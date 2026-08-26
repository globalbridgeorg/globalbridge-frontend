<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'

const router = useRouter()

const showRegister = ref(false)
const loginMode = ref('estudante')
const loading = ref(false)
const errorField = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const step = ref(1)
const stepDirection = ref('')
const stepAnimationTimer = ref(null)
const cardPhase = ref('idle')
const cardPhaseTimers = []
const justMounted = ref(true)
onMounted(() => { cardPhaseTimers.push(setTimeout(() => { justMounted.value = false }, 700)) })

const steps = [
  { fields: ['email'], labels: ['E-mail'], placeholders: ['exemplo@dominio.com'], types: ['email'], label: 'E-mail' },
  { fields: ['verificationCode'], labels: ['Código de verificação'], placeholders: ['000000'], types: ['text'], label: 'Código de verificação' },
  { fields: ['name'], labels: ['Nome completo'], placeholders: ['Seu nome'], types: ['text'], label: 'Dados pessoais' },
  { fields: ['password', 'confirmPassword'], labels: ['Senha', 'Confirmar senha'], placeholders: ['Crie uma senha', 'Digite novamente'], types: ['password', 'password'], label: 'Senha' }
]

const loginForm = reactive({ email: '', password: '', keepLogged: false })
const codigoModo = ref(false)
const codigoEnviado = ref(false)
const codigoValor = ref('')
const codigoLoading = ref(false)
const registerData = reactive({ email: '', verificationCode: '', name: '', password: '', confirmPassword: '' })

const currentStep = computed(() => steps[step.value - 1] || steps[0])

function clearError() { errorField.value = ''; errorMessage.value = '' }
function clearErrorForField(field) { if (errorField.value === field) clearError() }
function setError(field, message) { errorField.value = field; errorMessage.value = message; successMessage.value = '' }

function animateStep(direction) {
  stepDirection.value = direction
  if (stepAnimationTimer.value) clearTimeout(stepAnimationTimer.value)
  stepAnimationTimer.value = setTimeout(() => { stepDirection.value = '' }, 240)
}

function resetRegisterData() {
  registerData.email = ''
  registerData.verificationCode = ''
  registerData.name = ''
  registerData.password = ''
  registerData.confirmPassword = ''
  step.value = 1
  clearError()
  successMessage.value = ''
}

function switchAuthMode(toRegister) {
  if (cardPhase.value !== 'idle') return
  cardPhaseTimers.splice(0).forEach(clearTimeout)
  cardPhase.value = 'exiting'
  cardPhaseTimers.push(setTimeout(() => {
    if (toRegister) { showRegister.value = true; resetRegisterData() }
    else { showRegister.value = false; resetRegisterData() }
    cardPhase.value = 'entering'
    cardPhaseTimers.push(setTimeout(() => { cardPhase.value = 'idle' }, 300))
  }, 220))
}

function goToRegister() { switchAuthMode(true) }
function goToStep(target) { if (target < 1 || target >= step.value) return; step.value = target; animateStep('back'); clearError() }

function nextStep() {
  clearError()
  const cur = currentStep.value
  if (cur.fields[0] === 'verificationCode') {
    if (step.value < steps.length) { step.value++; animateStep('forward') }
    return
  }
  for (const f of cur.fields) {
    if (!registerData[f]) {
      const label = cur.labels[cur.fields.indexOf(f)]
      setError(`register.${f}`, `Preencha ${label.toLowerCase()}`)
      return
    }
  }
  if (step.value < steps.length) { step.value++; animateStep('forward') }
}

function prevStep() { if (step.value > 1) { step.value--; animateStep('back'); clearError() } }
function skipVerification() { registerData.verificationCode = '000000'; if (step.value < steps.length) { step.value++; animateStep('forward') } }
function handleStepEnter() { step.value < steps.length ? nextStep() : handleRegister() }

async function handleLogin() {
  clearError()
  if (!loginForm.email) return setError('login.email', 'Informe seu e-mail')
  if (!loginForm.password) return setError('login.password', 'Informe sua senha')
  loading.value = true
  try {
    const res = await axios.post('/token/', { email: loginForm.email, password: loginForm.password })
    const { access, refresh } = res.data
    if (loginForm.keepLogged) { localStorage.setItem('access_token', access); localStorage.setItem('refresh_token', refresh) }
    else { sessionStorage.setItem('access_token', access); sessionStorage.setItem('refresh_token', refresh) }
    successMessage.value = 'Login realizado com sucesso!'

    // Conta business (tipo=agencia) tem um painel próprio — decide pra
    // onde mandar depois de logar com base no que a conta realmente é,
    // não em qual aba a pessoa escolheu (a aba é só uma dica visual).
    await irERedirecionarPosLogin()
  } catch (err) {
    if (err.response?.status === 401) setError('login.email', 'E-mail ou senha inválidos')
    else setError('login.email', 'Erro ao conectar com o servidor')
  } finally { loading.value = false }
}

function irERedirecionarPosLogin() {
  return axios.get('/usuarios/me/').then(({ data: eu }) => {
    router.push({ name: eu.tipo === 'agencia' ? 'business' : 'profile' })
  }).catch(() => router.push({ name: 'profile' }))
}

function ativarCodigoModo() {
  clearError()
  codigoModo.value = true
  codigoEnviado.value = false
  codigoValor.value = ''
}

function voltarParaSenha() {
  clearError()
  codigoModo.value = false
  codigoEnviado.value = false
  codigoValor.value = ''
}

async function solicitarCodigo() {
  clearError()
  if (!loginForm.email) return setError('login.email', 'Informe seu e-mail')
  loading.value = true
  try {
    await axios.post('/auth/codigo/solicitar/', { email: loginForm.email })
    codigoEnviado.value = true
    successMessage.value = 'Se esse e-mail tiver conta, o código chega em instantes.'
  } catch (e) {
    setError('login.email', 'Erro ao enviar o código')
  } finally {
    loading.value = false
  }
}

async function confirmarCodigo() {
  clearError()
  if (!codigoValor.value) return setError('login.codigo', 'Informe o código recebido')
  codigoLoading.value = true
  try {
    const { data } = await axios.post('/auth/codigo/verificar/', { email: loginForm.email, codigo: codigoValor.value })
    if (loginForm.keepLogged) { localStorage.setItem('access_token', data.access); localStorage.setItem('refresh_token', data.refresh) }
    else { sessionStorage.setItem('access_token', data.access); sessionStorage.setItem('refresh_token', data.refresh) }
    await irERedirecionarPosLogin()
  } catch (e) {
    setError('login.codigo', 'Código inválido ou expirado')
  } finally {
    codigoLoading.value = false
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
    const { access, refresh } = res.data
    if (access && refresh) {
      localStorage.setItem('access_token', access); localStorage.setItem('refresh_token', refresh); router.push({ name: 'profile' }); return
    }
    const loginRes = await axios.post('/token/', { email: registerData.email, password: registerData.password })
    localStorage.setItem('access_token', loginRes.data.access); localStorage.setItem('refresh_token', loginRes.data.refresh)
    router.push({ name: 'profile' })
  } catch (err) {
    if (err.response?.data?.email) setError('register.email', 'Este e-mail já está em uso')
    else if (err.response?.data?.password) setError('register.password', err.response.data.password[0])
    else setError('register.email', 'Erro ao criar conta')
  } finally { loading.value = false }
}

function resendCode() { clearError(); successMessage.value = 'Código reenviado com sucesso.' }
function backToLogin() { switchAuthMode(false) }

onBeforeUnmount(() => {
  if (stepAnimationTimer.value) clearTimeout(stepAnimationTimer.value)
  cardPhaseTimers.splice(0).forEach(clearTimeout)
})

</script>

<template>
  <div class="page-container">
    <div class="scene">
      <svg class="stars" width="100%" height="100%" preserveAspectRatio="none">
        <circle cx="8%" cy="10%" r="1.4" fill="#fff" /><circle cx="22%" cy="15%" r="1" fill="#fff" />
        <circle cx="38%" cy="8%" r="1.6" fill="#fff" /><circle cx="52%" cy="13%" r="1" fill="#fff" />
        <circle cx="66%" cy="7%" r="1.4" fill="#fff" /><circle cx="80%" cy="11%" r="1" fill="#fff" />
        <circle cx="92%" cy="16%" r="1.6" fill="#fff" /><circle cx="15%" cy="22%" r="1" fill="#fff" />
        <circle cx="44%" cy="21%" r="1" fill="#fff" /><circle cx="74%" cy="23%" r="1.2" fill="#fff" />
      </svg>

      <svg class="skyline skyline-back" viewBox="0 0 2880 300" preserveAspectRatio="none">
        <g fill="#3d1247">
          <rect x="0" y="140" width="60" height="160" /><rect x="70" y="100" width="40" height="200" />
          <rect x="120" y="160" width="80" height="140" /><rect x="210" y="70" width="30" height="230" />
          <rect x="250" y="130" width="60" height="170" /><polygon points="330,130 360,60 390,130" />
          <rect x="330" y="130" width="60" height="170" /><rect x="400" y="110" width="50" height="190" />
          <rect x="460" y="170" width="70" height="130" /><rect x="540" y="90" width="35" height="210" />
          <rect x="590" y="150" width="55" height="150" />
        </g>
        <g fill="#3d1247" transform="translate(720,0)">
          <rect x="0" y="140" width="60" height="160" /><rect x="70" y="100" width="40" height="200" />
          <rect x="120" y="160" width="80" height="140" /><rect x="210" y="70" width="30" height="230" />
          <rect x="250" y="130" width="60" height="170" /><polygon points="330,130 360,60 390,130" />
          <rect x="330" y="130" width="60" height="170" /><rect x="400" y="110" width="50" height="190" />
          <rect x="460" y="170" width="70" height="130" /><rect x="540" y="90" width="35" height="210" />
          <rect x="590" y="150" width="55" height="150" />
        </g>
        <g fill="#3d1247" transform="translate(1440,0)">
          <rect x="0" y="140" width="60" height="160" /><rect x="70" y="100" width="40" height="200" />
          <rect x="120" y="160" width="80" height="140" /><rect x="210" y="70" width="30" height="230" />
          <rect x="250" y="130" width="60" height="170" /><polygon points="330,130 360,60 390,130" />
          <rect x="330" y="130" width="60" height="170" /><rect x="400" y="110" width="50" height="190" />
          <rect x="460" y="170" width="70" height="130" /><rect x="540" y="90" width="35" height="210" />
          <rect x="590" y="150" width="55" height="150" />
        </g>
        <g fill="#3d1247" transform="translate(2160,0)">
          <rect x="0" y="140" width="60" height="160" /><rect x="70" y="100" width="40" height="200" />
          <rect x="120" y="160" width="80" height="140" /><rect x="210" y="70" width="30" height="230" />
          <rect x="250" y="130" width="60" height="170" /><polygon points="330,130 360,60 390,130" />
          <rect x="330" y="130" width="60" height="170" /><rect x="400" y="110" width="50" height="190" />
          <rect x="460" y="170" width="70" height="130" /><rect x="540" y="90" width="35" height="210" />
          <rect x="590" y="150" width="55" height="150" />
        </g>
      </svg>

      <svg class="skyline skyline-front" viewBox="0 0 2880 340" preserveAspectRatio="none">
        <g fill="#17081d">
          <rect x="20" y="120" width="70" height="220" /><rect x="100" y="180" width="45" height="160" />
          <rect x="155" y="90" width="35" height="250" /><circle cx="172" cy="80" r="18" fill="none" stroke="#17081d" stroke-width="6" />
          <rect x="220" y="150" width="90" height="190" /><rect x="330" y="60" width="26" height="280" />
          <rect x="370" y="170" width="60" height="170" /><rect x="450" y="110" width="50" height="230" />
          <polygon points="530,140 560,40 590,140" /><rect x="530" y="140" width="60" height="200" />
          <rect x="610" y="190" width="80" height="150" />
        </g>
        <g fill="#17081d" transform="translate(720,0)">
          <rect x="20" y="120" width="70" height="220" /><rect x="100" y="180" width="45" height="160" />
          <rect x="155" y="90" width="35" height="250" /><circle cx="172" cy="80" r="18" fill="none" stroke="#17081d" stroke-width="6" />
          <rect x="220" y="150" width="90" height="190" /><rect x="330" y="60" width="26" height="280" />
          <rect x="370" y="170" width="60" height="170" /><rect x="450" y="110" width="50" height="230" />
          <polygon points="530,140 560,40 590,140" /><rect x="530" y="140" width="60" height="200" />
          <rect x="610" y="190" width="80" height="150" />
        </g>
        <g fill="#17081d" transform="translate(1440,0)">
          <rect x="20" y="120" width="70" height="220" /><rect x="100" y="180" width="45" height="160" />
          <rect x="155" y="90" width="35" height="250" /><circle cx="172" cy="80" r="18" fill="none" stroke="#17081d" stroke-width="6" />
          <rect x="220" y="150" width="90" height="190" /><rect x="330" y="60" width="26" height="280" />
          <rect x="370" y="170" width="60" height="170" /><rect x="450" y="110" width="50" height="230" />
          <polygon points="530,140 560,40 590,140" /><rect x="530" y="140" width="60" height="200" />
          <rect x="610" y="190" width="80" height="150" />
        </g>
        <g fill="#17081d" transform="translate(2160,0)">
          <rect x="20" y="120" width="70" height="220" /><rect x="100" y="180" width="45" height="160" />
          <rect x="155" y="90" width="35" height="250" /><circle cx="172" cy="80" r="18" fill="none" stroke="#17081d" stroke-width="6" />
          <rect x="220" y="150" width="90" height="190" /><rect x="330" y="60" width="26" height="280" />
          <rect x="370" y="170" width="60" height="170" /><rect x="450" y="110" width="50" height="230" />
          <polygon points="530,140 560,40 590,140" /><rect x="530" y="140" width="60" height="200" />
          <rect x="610" y="190" width="80" height="150" />
        </g>
      </svg>

      <div class="plane-strip">
        <svg class="plane" width="22" height="12" viewBox="0 0 22 12" style="animation-delay:1s; top:8%;">
          <path d="M1 6 L18 6 M14 2 L21 6 L14 10 M6 6 L3 2 M6 6 L3 10" stroke="rgba(251,246,231,0.7)" stroke-width="1.3" fill="none" stroke-linecap="round" />
        </svg>
        <svg class="plane plane-slow" width="18" height="10" viewBox="0 0 22 12" style="animation-delay:9s; top:16%;">
          <path d="M1 6 L18 6 M14 2 L21 6 L14 10 M6 6 L3 2 M6 6 L3 10" stroke="rgba(251,246,231,0.5)" stroke-width="1.3" fill="none" stroke-linecap="round" />
        </svg>
      </div>
    </div>

    <div
      class="main-card"
      :class="{ 'slide-left': showRegister, 'step-forward': stepDirection === 'forward', 'step-back': stepDirection === 'back', 'mount-in': justMounted, 'card-exit': cardPhase === 'exiting', 'card-enter': cardPhase === 'entering' }"
    >
      <div v-if="!showRegister" class="card-content">
        <div class="mode-toggle">
          <div class="mode-toggle-thumb" :class="{ right: loginMode === 'agencia' }"></div>
          <button type="button" class="mode-opt" :class="{ active: loginMode === 'estudante' }" @click="loginMode = 'estudante'">Sou estudante</button>
          <button type="button" class="mode-opt" :class="{ active: loginMode === 'agencia' }" @click="loginMode = 'agencia'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V8l6-4v16"/><path d="M10 20V10l8 3v7"/><path d="M3 20h18"/></svg>
            Sou agência
          </button>
        </div>

        <div v-if="successMessage" class="field-success">{{ successMessage }}</div>

        <div class="form-group">
          <label for="login-email">{{ loginMode === 'agencia' ? 'E-mail institucional' : 'E-mail' }}</label>
          <div v-if="errorField === 'login.email'" class="field-error">{{ errorMessage }}</div>
          <input id="login-email" type="email" autocomplete="email" v-model="loginForm.email" placeholder="seu@email.com" @input="clearErrorForField('login.email')">
        </div>

        <template v-if="!codigoModo">
          <div class="form-group">
            <label for="login-senha">Senha</label>
            <div v-if="errorField === 'login.password'" class="field-error">{{ errorMessage }}</div>
            <input id="login-senha" type="password" autocomplete="current-password" v-model="loginForm.password" placeholder="••••••••" @input="clearErrorForField('login.password')">
          </div>
          <div class="checkbox-group">
            <input type="checkbox" id="keepLogged" v-model="loginForm.keepLogged">
            <label for="keepLogged">Manter conectado</label>
          </div>
          <button class="btn-primary" @click="handleLogin">{{ loginMode === 'agencia' ? 'Entrar como agência' : 'Entrar' }}</button>
          <div class="login-extra-links">
            <router-link to="/esqueci-senha">Esqueceu a senha?</router-link>
            <button class="link-inline" @click="ativarCodigoModo">Entrar com código por e-mail</button>
          </div>
        </template>

        <template v-else-if="!codigoEnviado">
          <div class="checkbox-group">
            <input type="checkbox" id="keepLogged2" v-model="loginForm.keepLogged">
            <label for="keepLogged2">Manter conectado</label>
          </div>
          <button class="btn-primary" :disabled="loading" @click="solicitarCodigo">{{ loading ? 'Enviando...' : 'Enviar código' }}</button>
          <div class="login-extra-links">
            <button class="link-inline" @click="voltarParaSenha">Entrar com senha</button>
          </div>
        </template>

        <template v-else>
          <div class="form-group">
            <label for="login-codigo">Código recebido por e-mail</label>
            <div v-if="errorField === 'login.codigo'" class="field-error">{{ errorMessage }}</div>
            <input id="login-codigo" type="text" inputmode="numeric" autocomplete="one-time-code" v-model="codigoValor" placeholder="000000" maxlength="6" @keyup.enter="confirmarCodigo" @input="clearErrorForField('login.codigo')">
          </div>
          <button class="btn-primary" :disabled="codigoLoading" @click="confirmarCodigo">{{ codigoLoading ? 'Confirmando...' : 'Confirmar e entrar' }}</button>
          <div class="login-extra-links">
            <button class="link-inline" @click="solicitarCodigo">Reenviar código</button>
            <button class="link-inline" @click="voltarParaSenha">Entrar com senha</button>
          </div>
        </template>

        <div v-if="loginMode === 'estudante'" class="create-account-link">
          <span>Não possui uma conta?</span>
          <button class="link-button" @click="goToRegister">Criar conta</button>
        </div>
        <div v-else class="create-account-link">
          <span>Sua agência ainda não tem conta business?</span>
          <router-link class="link-button" to="/business/solicitar">Solicitar verificação</router-link>
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

        <div
          v-for="(field, index) in currentStep.fields"
          :key="field"
          class="form-group"
        >
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
          <button class="resend-link" @click="resendCode">Reenviar código</button>
          <button class="debug-link" @click="skipVerification">Pular verificação (debug)</button>
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

.page-container {
  position: relative;
  width: 100%;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  overflow: hidden;
  background: linear-gradient(180deg, #4a1d54 0%, #2e0a2e 55%, #17081d 100%);
  animation: skyShift 18s ease-in-out infinite alternate;
}

@keyframes skyShift {
  from { filter: hue-rotate(0deg) brightness(1); }
  to { filter: hue-rotate(-8deg) brightness(1.08); }
}

/* ── Cena animada de fundo ───────────────────────────────────────────── */
.scene { position: absolute; inset: 0; z-index: 0; }

.stars { position: absolute; inset: 0; opacity: 0.5; }

/* Altura em aspect-ratio (não em % da tela) — cada <svg> usa
   preserveAspectRatio="none" pra esticar o desenho até preencher a
   largura de 300%, então a altura do elemento PRECISA acompanhar essa
   mesma proporção do viewBox (2880x300 / 2880x340). Antes a altura era
   um % fixo da tela: numa tela estreita e alta (celular), a largura
   encolhia bem mais que a altura, esticando o desenho e deixando os
   prédios finos e alongados. Com aspect-ratio a altura sempre acompanha
   a largura real na proporção certa, em qualquer tamanho de tela. */
.skyline { position: absolute; left: 0; bottom: 0; width: 300%; animation: scroll linear infinite; }
/* Altura ~30% maior que o desenho original (300/340 -> 390/442), de
   propósito — deixa mais prédio visível sem mexer na largura (que
   precisa continuar em sincronia com o -33.3333% do @keyframes scroll
   logo abaixo, senão o loop de repetição desalinha). */
.skyline-back { aspect-ratio: 2880 / 390; opacity: 0.5; animation-duration: 80s; }
.skyline-front { aspect-ratio: 2880 / 442; animation-duration: 42s; animation-direction: reverse; }

@keyframes scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-33.3333%); }
}

.plane-strip { position: absolute; top: 0; left: 0; width: 100%; height: 40%; }
.plane { position: absolute; animation: crossSky 18s linear infinite; opacity: 0.8; }
.plane-slow { animation-duration: 24s; }

@keyframes crossSky {
  from { transform: translateX(-60px); }
  to { transform: translateX(110vw); }
}

@media (prefers-reduced-motion: reduce) {
  .page-container, .skyline, .plane, .main-card, .main-card.mount-in, .main-card.card-exit, .main-card.card-enter { animation: none; }
}

/* ── Card de login/cadastro ──────────────────────────────────────────── */
.main-card {
  position: relative;
  z-index: 1;
  background: rgb(252, 252, 252);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 4px 4px 40px 4px;
  padding: 34px 36px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
  width: 100%;
  max-width: 460px;
  min-height: 400px;
  --card-shift: 0vw;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  transform: translateX(var(--card-shift)) scale(1);
}

.main-card.mount-in { animation: cardIn 0.7s cubic-bezier(.16, 1, .3, 1) both; }
@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.main-card.slide-left { --card-shift: 25vw; }
.main-card.step-forward { --card-shift: 25vw; }
.main-card.slide-left.step-forward { --card-shift: 25vw; }
.main-card.step-back { --card-shift: 25vw; }
.main-card.slide-left.step-back { --card-shift: 25vw; }

.main-card.card-exit { animation: cardExit 0.22s ease both; }
@keyframes cardExit { to { opacity: 0; transform: translateX(var(--card-shift)) translateY(10px); } }

.main-card.card-enter { animation: cardEnter 0.28s ease both; }
@keyframes cardEnter {
  from { opacity: 0; transform: translateX(var(--card-shift)) translateY(10px); }
  to { opacity: 1; transform: translateX(var(--card-shift)) translateY(0); }
}

.card-content { height: 100%; display: flex; flex-direction: column; justify-content: center; }

.mode-toggle { position: relative; display: grid; grid-template-columns: 1fr 1fr; background: rgba(46, 10, 46, 0.06); border-radius: 12px; padding: 4px; margin-bottom: 24px; }
.mode-toggle-thumb { position: absolute; top: 4px; left: 4px; width: calc(50% - 6px); height: calc(100% - 8px); background: var(--gb-dark); border-radius: 9px; transition: transform 0.25s cubic-bezier(.4,0,.2,1); }
.mode-toggle-thumb.right { transform: translateX(calc(100% + 4px)); }
.mode-opt { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; border: none; background: none; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 12px; letter-spacing: 0.02em; text-transform: uppercase; color: var(--gb-ink-faint); cursor: pointer; transition: color 0.2s ease; }
.mode-opt.active { color: #fff; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gb-ink-faint); }
.form-group input { width: 100%; padding: 12px 14px; border: 1px solid var(--gb-purple-deep-16); border-radius: 10px; font-size: 14px; font-family: var(--gb-font-display); transition: border-color 0.2s ease, box-shadow 0.2s ease; background: #fff; color: var(--gb-dark); }
.form-group input:focus { outline: none; border-color: var(--gb-magenta); box-shadow: 0 0 0 3px rgba(176, 31, 176, 0.12); }
.checkbox-group { display: flex; align-items: center; gap: 10px; margin-bottom: 25px; }
.checkbox-group input { width: 16px; height: 16px; accent-color: var(--gb-magenta); cursor: pointer; }
.checkbox-group label { margin-bottom: 0; font-size: 13px; color: var(--gb-ink-soft); cursor: pointer; }
.btn-primary { width: 100%; background: var(--gb-dark); color: #fff; border: none; padding: 13px; border-radius: 10px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; transition: background 0.2s ease, transform 0.1s ease; }
.btn-primary:hover { background: var(--gb-magenta); }
.btn-primary:active { transform: scale(0.98); }
.login-extra-links { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
.login-extra-links a, .login-extra-links .link-inline { background: none; border: none; padding: 0; color: var(--gb-magenta); font-size: 12.5px; font-weight: 600; cursor: pointer; text-decoration: underline; }
.login-extra-links a:hover, .login-extra-links .link-inline:hover { color: #7A0F74; }
.create-account-link { text-align: center; margin-top: 20px; }
.create-account-link span { color: var(--gb-ink-soft); font-size: 13px; }
.link-button { background: none; border: none; color: var(--gb-magenta); font-weight: 600; cursor: pointer; font-size: 13px; text-decoration: underline; margin-left: 5px; }
.link-button:hover { color: #7A0F74; }
.resend-code { text-align: right; margin-top: -12px; margin-bottom: 20px; }
.resend-link { background: none; border: none; color: var(--gb-magenta); font-size: 12px; cursor: pointer; text-decoration: underline; }
.back-to-login { text-align: center; margin-top: 20px; }
.back-to-login span { color: var(--gb-ink-soft); font-size: 13px; display: block; margin-bottom: 8px; }
.back-login-link { background: none; border: none; color: var(--gb-magenta); font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline; }
.back-login-link:hover { color: #7A0F74; }
.side-text { position: absolute; left: 8%; top: 30%; transform: translateY(-50%); opacity: 0; transition: opacity 0.6s ease 0.3s; pointer-events: none; z-index: 1; }
.side-text.show { opacity: 1; pointer-events: auto; }
.side-text h1 { font-family: var(--gb-font-display); font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; color: var(--gb-cream); font-size: 4.5rem; line-height: 1.02; margin: 0; }
.footer-text { padding: 0 0 0 15px; opacity: 40%; position: absolute; bottom: 40px; left: 0; text-align: left; color: #ffffff; font-size: 12px; }
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
.verification-actions { display: flex; justify-content: space-between; align-items: center; margin: -10px 0 20px; }
.debug-link { background: none; border: none; color: #b45309; font-size: 12px; cursor: pointer; text-decoration: underline; }
.field-error { display: block; margin-bottom: 8px; color: #dc2626; font-size: 13px; font-weight: 700; animation: errorShake 0.25s ease-in-out; }
.field-success { display: block; margin-bottom: 16px; color: #15803d; font-size: 13px; font-weight: 700; }

@keyframes errorShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 50% { transform: translateX(3px); } 75% { transform: translateX(-2px); } }

/* A transição de login→cadastro desloca o card 25vw pro lado pra abrir
   espaço pro "CRIAR UMA CONTA" (.side-text) — isso pressupõe uma tela
   larga. No celular não tem espaço lateral: o texto lateral só some e o
   card passa a só trocar de conteúdo no lugar (fade + leve deslocamento
   vertical, sem o deslocamento horizontal). */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .main-card {
    padding: 28px 22px;
    --card-shift: 0vw !important;
  }

  .side-text {
    display: none;
  }
}
</style>
