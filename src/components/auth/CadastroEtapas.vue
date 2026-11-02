<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'

const emit = defineEmits(['voltar-login'])
const router = useRouter()

const steps = [
  { fields: ['email'], labels: ['E-mail'], placeholders: ['exemplo@dominio.com'], types: ['email'], label: 'E-mail' },
  { fields: ['verificationCode'], labels: ['Código de verificação'], placeholders: ['000000'], types: ['text'], label: 'Código de verificação' },
  { fields: ['name'], labels: ['Nome completo'], placeholders: ['Seu nome'], types: ['text'], label: 'Dados pessoais' },
  { fields: ['password', 'confirmPassword'], labels: ['Senha', 'Confirmar senha'], placeholders: ['Crie uma senha', 'Digite novamente'], types: ['password', 'password'], label: 'Senha' }
]

const step = ref(1)
const loading = ref(false)
const processandoEtapa = ref(false)
const errorField = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const registerData = reactive({ email: '', verificationCode: '', name: '', password: '', confirmPassword: '' })

const currentStep = computed(() => steps[step.value - 1] || steps[0])

function clearError() { errorField.value = ''; errorMessage.value = '' }
function clearErrorForField(field) { if (errorField.value === field) clearError() }
function setError(field, message) { errorField.value = field; errorMessage.value = message; successMessage.value = '' }

function goToStep(target) { if (target < 1 || target >= step.value) return; step.value = target; clearError() }
function prevStep() { if (step.value > 1) { step.value--; clearError() } }
function handleStepEnter() { step.value < steps.length ? nextStep() : handleRegister() }

async function nextStep() {
  clearError()
  const cur = currentStep.value

  for (const f of cur.fields) {
    if (!registerData[f]) {
      const label = cur.labels[cur.fields.indexOf(f)]
      setError(`register.${f}`, `Preencha ${label.toLowerCase()}`)
      return
    }
  }

  if (cur.fields[0] === 'email') {
    processandoEtapa.value = true
    try {
      await axios.post('/auth/cadastro/codigo/solicitar/', { email: registerData.email })
    } catch (err) {
      processandoEtapa.value = false
      return setError('register.email', err.response?.data?.email?.[0] || err.response?.data?.detail || 'Não conseguimos enviar o código agora. Tente novamente.')
    }
    processandoEtapa.value = false
  }

  if (cur.fields[0] === 'verificationCode') {
    processandoEtapa.value = true
    try {
      await axios.post('/auth/cadastro/codigo/verificar/', { email: registerData.email, codigo: registerData.verificationCode })
    } catch (err) {
      processandoEtapa.value = false
      return setError('register.verificationCode', err.response?.data?.detail || 'Código inválido ou expirado.')
    }
    processandoEtapa.value = false
  }

  if (step.value < steps.length) step.value++
}

async function reenviarCodigoCadastro() {
  clearError()
  processandoEtapa.value = true
  try {
    await axios.post('/auth/cadastro/codigo/solicitar/', { email: registerData.email })
    successMessage.value = 'Código reenviado — confira seu e-mail.'
  } catch (err) {
    setError('register.verificationCode', err.response?.data?.email?.[0] || err.response?.data?.detail || 'Não conseguimos reenviar o código agora.')
  } finally {
    processandoEtapa.value = false
  }
}

async function handleRegister() {
  clearError()
  if (!registerData.email) return setError('register.email', 'Informe seu e-mail')
  if (!registerData.name) return setError('register.name', 'Informe seu nome completo')
  if (!registerData.password) return setError('register.password', 'Crie uma senha')
  if (!registerData.confirmPassword) return setError('register.confirmPassword', 'Confirme sua senha')
  if (registerData.password !== registerData.confirmPassword) return setError('register.confirmPassword', 'As senhas não coincidem')
  if (registerData.password.length < 8) return setError('register.password', 'A senha deve ter no mínimo 8 caracteres')

  loading.value = true
  try {
    const res = await axios.post('/registro/', { email: registerData.email, name: registerData.name, password: registerData.password })
    let { access, refresh } = res.data
    if (!access || !refresh) {
      const loginRes = await axios.post('/token/', { email: registerData.email, password: registerData.password })
      ;({ access, refresh } = loginRes.data)
    }
    localStorage.setItem('access_token', access); localStorage.setItem('refresh_token', refresh)
    router.push({ name: 'profile' })
  } catch (err) {
    if (err.response?.data?.email) setError('register.email', 'Este e-mail já está em uso')
    else if (err.response?.data?.password) setError('register.password', err.response.data.password[0])
    else setError('register.email', 'Erro ao criar conta')
  } finally { loading.value = false }
}
</script>

<template>
  <div class="card-content">
    <div class="stepper">
      <div class="step-dots">
        <button
          v-for="(s, i) in steps"
          :key="i"
          type="button"
          class="dot"
          :class="{ active: step === i + 1, completed: step > i + 1 }"
          :aria-current="step === i + 1 ? 'step' : undefined"
          :aria-label="`Etapa ${i + 1}: ${s.label}`"
          :disabled="i + 1 > step"
          @click="goToStep(i + 1)"
        ></button>
      </div>
      <div class="step-info">
        <span class="step-label">{{ currentStep.label }}</span>
        <span class="step-count">Etapa {{ step }} de {{ steps.length }}</span>
      </div>
    </div>

    <div v-if="successMessage" class="field-success">{{ successMessage }}</div>

    <div v-for="(field, index) in currentStep.fields" :key="field" class="form-group">
      <label :for="`register-${field}`">{{ currentStep.labels[index] }}</label>
      <div v-if="errorField === `register.${field}`" class="field-error">{{ errorMessage }}</div>
      <input
        :id="`register-${field}`"
        :type="currentStep.types[index]"
        v-model="registerData[field]"
        :placeholder="currentStep.placeholders[index]"
        @keyup.enter="handleStepEnter"
        @input="clearErrorForField(`register.${field}`)"
      >
    </div>

    <div v-if="step === 2" class="verification-actions">
      <button class="resend-link" :disabled="processandoEtapa" @click="reenviarCodigoCadastro">Reenviar código</button>
    </div>

    <div class="step-buttons">
      <button v-if="step > 1" class="btn-secondary" :disabled="processandoEtapa" @click="prevStep">Voltar</button>
      <button v-if="step < steps.length" class="btn-primary" :disabled="processandoEtapa" @click="nextStep">{{ processandoEtapa ? 'Enviando...' : 'Próximo' }}</button>
      <button v-if="step === steps.length" class="btn-primary" :disabled="loading" @click="handleRegister">{{ loading ? 'Criando conta...' : 'Criar conta' }}</button>
    </div>

    <div class="back-to-login">
      <span>Já possui uma conta?</span>
      <button class="back-login-link" @click="emit('voltar-login')">Fazer Login</button>
    </div>
  </div>
</template>

<style scoped>
.resend-link { background: none; border: none; color: var(--gb-magenta); font-size: 12px; cursor: pointer; text-decoration: underline; }
.back-to-login { text-align: center; margin-top: 20px; }
.back-to-login span { color: var(--gb-ink-soft); font-size: 13px; display: block; margin-bottom: 8px; }
.back-login-link { background: none; border: none; color: var(--gb-magenta); font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline; }
.back-login-link:hover { color: #7A0F74; }
.stepper { margin-bottom: 30px; text-align: center; }
.step-dots { display: flex; justify-content: center; gap: 12px; margin-bottom: 12px; }
.dot { width: 20px; height: 20px; border-radius: 50%; border: none; background: var(--gb-purple-deep-16); transition: all 0.3s; cursor: pointer; padding: 0; }
.dot.active { background: var(--gb-magenta); transform: scale(1.3); }
.dot.completed { background: var(--gb-mauve); }
.step-info { color: var(--gb-ink-soft); font-size: 13px; }
.step-label { font-family: var(--gb-font-eyebrow); font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; display: block; margin-bottom: 14px; color: var(--gb-dark); }
.step-count { font-size: 12px; color: var(--gb-ink-faint); }
.step-buttons { display: flex; gap: 12px; margin-top: 10px; }
.step-buttons .btn-primary, .step-buttons .btn-secondary { flex: 1; }
.btn-secondary { background: transparent; color: var(--gb-dark); border: 1px solid var(--gb-purple-deep-16); padding: 13px; border-radius: 10px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; transition: background 0.2s ease; }
.btn-secondary:hover { background: rgba(46, 10, 46, 0.05); }
.verification-actions { display: flex; align-items: center; margin: -10px 0 20px; }
</style>
