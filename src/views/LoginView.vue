<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { setTokens } = useAuth()

const showRegister = ref(false)
const loading = ref(false)
const errorField = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const step = ref(1)

// Nota: o backend ainda não tem endpoint de verificação de e-mail,
// então essa etapa não existe aqui até que exista suporte real.
const steps = [
  { fields: ['email'], labels: ['E-mail'], placeholders: ['exemplo@dominio.com'], types: ['email'], label: 'E-mail' },
  { fields: ['name'], labels: ['Nome completo'], placeholders: ['Seu nome'], types: ['text'], label: 'Dados pessoais' },
  { fields: ['password', 'confirmPassword'], labels: ['Senha', 'Confirmar senha'], placeholders: ['Crie uma senha', 'Digite novamente'], types: ['password', 'password'], label: 'Senha' }
]

const loginForm = reactive({ email: '', password: '', keepLogged: false })
const registerData = reactive({ email: '', name: '', password: '', confirmPassword: '' })

const currentStep = computed(() => steps[step.value - 1] || steps[0])

function clearError() { errorField.value = ''; errorMessage.value = '' }
function clearErrorForField(field) { if (errorField.value === field) clearError() }
function setError(field, message) { errorField.value = field; errorMessage.value = message; successMessage.value = '' }

function resetRegisterData() {
  registerData.email = ''
  registerData.name = ''
  registerData.password = ''
  registerData.confirmPassword = ''
  step.value = 1
  clearError()
  successMessage.value = ''
}

function goToRegister() { showRegister.value = true; resetRegisterData() }
function goToStep(target) { if (target < 1 || target >= step.value) return; step.value = target; clearError() }

function nextStep() {
  clearError()
  const cur = currentStep.value
  for (const f of cur.fields) {
    if (!registerData[f]) {
      const label = cur.labels[cur.fields.indexOf(f)]
      setError(`register.${f}`, `Preencha ${label.toLowerCase()}`)
      return
    }
  }
  if (step.value < steps.length) step.value++
}

function prevStep() { if (step.value > 1) { step.value--; clearError() } }
function handleStepEnter() { step.value < steps.length ? nextStep() : handleRegister() }

async function handleLogin() {
  clearError()
  if (!loginForm.email) return setError('login.email', 'Informe seu e-mail')
  if (!loginForm.password) return setError('login.password', 'Informe sua senha')
  loading.value = true
  try {
    const res = await axios.post('/token/', { email: loginForm.email, password: loginForm.password })
    setTokens(res.data, loginForm.keepLogged)
    successMessage.value = 'Login realizado com sucesso!'
    router.push({ name: 'profile' })
  } catch (err) {
    if (err.response?.status === 401) setError('login.email', 'E-mail ou senha inválidos')
    else setError('login.email', 'Erro ao conectar com o servidor')
  } finally { loading.value = false }
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
    if (res.data.access && res.data.refresh) {
      setTokens(res.data, true)
      router.push({ name: 'profile' })
      return
    }
    const loginRes = await axios.post('/token/', { email: registerData.email, password: registerData.password })
    setTokens(loginRes.data, true)
    router.push({ name: 'profile' })
  } catch (err) {
    if (err.response?.data?.email) setError('register.email', 'Este e-mail já está em uso')
    else if (err.response?.data?.password) setError('register.password', err.response.data.password[0])
    else setError('register.email', 'Erro ao criar conta')
  } finally { loading.value = false }
}

function backToLogin() { showRegister.value = false; resetRegisterData() }
</script>

<template>
  <div class="page-container">
    <div class="background-image"></div>

    <div
      class="main-card"
      :class="{ 'slide-left': showRegister }"
    >
      <div v-if="!showRegister" class="card-content">
        <div v-if="successMessage" class="field-success">{{ successMessage }}</div>

        <div class="form-group">
          <label>E-mail</label>
          <div v-if="errorField === 'login.email'" class="field-error">{{ errorMessage }}</div>
          <input type="email" v-model="loginForm.email" placeholder="seu@email.com" @input="clearErrorForField('login.email')">
        </div>
        <div class="form-group">
          <label>Senha</label>
          <div v-if="errorField === 'login.password'" class="field-error">{{ errorMessage }}</div>
          <input type="password" v-model="loginForm.password" placeholder="••••••••" @input="clearErrorForField('login.password')">
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="keepLogged" v-model="loginForm.keepLogged">
          <label for="keepLogged">Manter conectado</label>
        </div>
        <button class="btn-primary" @click="handleLogin">Entrar</button>
        <div class="create-account-link">
          <span>Não possui uma conta?</span>
          <button class="link-button" @click="goToRegister">Criar conta</button>
        </div>
      </div>

      <div v-else class="card-content">
        <div class="stepper">
          <div class="step-dots">
            <button
              v-for="(s, i) in steps"
              :key="i"
              type="button"
              class="dot"
              :class="{ active: step === i + 1, completed: step > i + 1 }"
              @click="goToStep(i + 1)"
            ></button>
          </div>
          <div class="step-info">
            <span class="step-label">{{ currentStep.label }}</span>
            <span class="step-count">Etapa {{ step }} de {{ steps.length }}</span>
          </div>
        </div>

        <div v-if="successMessage" class="field-success">{{ successMessage }}</div>

        <div
          v-for="(field, index) in currentStep.fields"
          :key="field"
          class="form-group"
        >
          <label>{{ currentStep.labels[index] }}</label>
          <div v-if="errorField === `register.${field}`" class="field-error">{{ errorMessage }}</div>
          <input
            :type="currentStep.types[index]"
            v-model="registerData[field]"
            :placeholder="currentStep.placeholders[index]"
            @keyup.enter="handleStepEnter"
            @input="clearErrorForField(`register.${field}`)"
          >
        </div>

        <div class="step-buttons">
          <button v-if="step > 1" class="btn-secondary" @click="prevStep">Voltar</button>
          <button v-if="step < steps.length" class="btn-primary" @click="nextStep">Próximo</button>
          <button v-if="step === steps.length" class="btn-primary" @click="handleRegister">Criar conta</button>
        </div>

        <div class="back-to-login">
          <span>Já possui uma conta?</span>
          <button class="back-login-link" @click="backToLogin">Fazer Login</button>
        </div>
      </div>
    </div>

    <div class="side-text" :class="{ show: showRegister }">
      <h1>CRIAR UMA<br>CONTA</h1>
    </div>
  </div>
</template>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.page-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%);
  background-image: url('/images/backgroundlogin.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.main-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 4px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 550px;
  min-height: 400px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  transform: translateX(0) scale(1);
  z-index: 1;
}

.main-card.slide-left { transform: translateX(25vw); }

.card-content { height: 100%; display: flex; flex-direction: column; justify-content: center; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #1f2937; }
.form-group input { width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 15px; transition: all 0.2s; background: white; }
.form-group input:focus { outline: none; border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.checkbox-group { display: flex; align-items: center; gap: 10px; margin-bottom: 25px; }
.checkbox-group input { width: 18px; height: 18px; cursor: pointer; }
.checkbox-group label { margin-bottom: 0; font-size: 14px; color: #4b5563; cursor: pointer; }
.btn-primary { width: 100%; background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%); color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.1s; }
.btn-primary:hover { opacity: 0.9; transform: scale(0.98); }
.create-account-link { text-align: center; margin-top: 20px; }
.create-account-link span { color: #6b7280; font-size: 14px; }
.link-button { background: none; border: none; color: #4F46E5; font-weight: 600; cursor: pointer; font-size: 14px; text-decoration: underline; margin-left: 5px; }
.link-button:hover { color: #06B6D4; }
.back-to-login { text-align: center; margin-top: 20px; }
.back-to-login span { color: #6b7280; font-size: 14px; display: block; margin-bottom: 8px; }
.back-login-link { background: none; border: none; color: #4F46E5; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: underline; }
.back-login-link:hover { color: #06B6D4; }
.side-text { position: absolute; left: 8%; top: 30%; transform: translateY(-50%); opacity: 0; transition: opacity 0.6s ease 0.3s; pointer-events: none; }
.side-text.show { opacity: 1; pointer-events: auto; }
.side-text h1 { color: white; font-size: 5rem; font-weight: bold; line-height: 1.1; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
.footer-text { padding: 0 0 0 15px; opacity: 40%; position: absolute; bottom: 40px; left: 0; text-align: left; color: #ffffff; font-size: 12px; }
.stepper { margin-bottom: 30px; text-align: center; }
.step-dots { display: flex; justify-content: center; gap: 12px; margin-bottom: 12px; }
.dot { width: 22px; height: 22px; border-radius: 50%; border: none; background: #e5e7eb; transition: all 0.3s; cursor: pointer; padding: 0; }
.dot.active { background: #1F1235; transform: scale(1.3); }
.dot.completed { background: #514762; }
.step-info { color: #4b5563; font-size: 14px; }
.step-label { font-weight: 600; display: block; margin-bottom: 14px; }
.step-count { font-size: 12px; color: #9ca3af; }
.step-buttons { display: flex; gap: 12px; margin-top: 10px; }
.step-buttons .btn-primary, .step-buttons .btn-secondary { flex: 1; }
.btn-secondary { background: #e5e7eb; color: #1f2937; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-secondary:hover { background: #d1d5db; }
.field-error { display: block; margin-bottom: 8px; color: #dc2626; font-size: 13px; font-weight: 700; animation: errorShake 0.25s ease-in-out; }
.field-success { display: block; margin-bottom: 16px; color: #15803d; font-size: 13px; font-weight: 700; }

@keyframes errorShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 50% { transform: translateX(3px); } 75% { transform: translateX(-2px); } }
</style>
