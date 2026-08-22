<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'

const router = useRouter()

const showRegister = ref(false)
const loading = ref(false)
const errorField = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const step = ref(1)
const stepDirection = ref('')
const stepAnimationTimer = ref(null)

const steps = [
  { fields: ['email'], labels: ['E-mail'], placeholders: ['exemplo@dominio.com'], types: ['email'], label: 'E-mail' },
  { fields: ['verificationCode'], labels: ['Código de verificação'], placeholders: ['000000'], types: ['text'], label: 'Código de verificação' },
  { fields: ['name'], labels: ['Nome completo'], placeholders: ['Seu nome'], types: ['text'], label: 'Dados pessoais' },
  { fields: ['password', 'confirmPassword'], labels: ['Senha', 'Confirmar senha'], placeholders: ['Crie uma senha', 'Digite novamente'], types: ['password', 'password'], label: 'Senha' }
]

const loginForm = reactive({ email: '', password: '', keepLogged: false })
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

function goToRegister() { showRegister.value = true; resetRegisterData() }
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
function backToLogin() { showRegister.value = false; resetRegisterData() }

onBeforeUnmount(() => { if (stepAnimationTimer.value) clearTimeout(stepAnimationTimer.value) })

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
      :class="{ 'slide-left': showRegister, 'step-forward': stepDirection === 'forward', 'step-back': stepDirection === 'back' }"
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

.skyline { position: absolute; left: 0; bottom: 0; width: 300%; animation: scroll linear infinite; }
.skyline-back { height: 32%; opacity: 0.5; animation-duration: 80s; }
.skyline-front { height: 38%; animation-duration: 42s; animation-direction: reverse; }

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
  .page-container, .skyline, .plane { animation: none; }
}

/* ── Card de login/cadastro ──────────────────────────────────────────── */
.main-card {
  position: relative;
  z-index: 1;
  background: rgba(251, 246, 231, 0.94);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 4px 4px 40px 4px;
  padding: 34px 36px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
  width: 100%;
  max-width: 460px;
  min-height: 400px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  transform: translateX(0) scale(1);
  animation: cardIn 0.7s cubic-bezier(.16, 1, .3, 1) both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.main-card.slide-left { transform: translateX(25vw); }
.main-card.step-forward { transform: translateX(25vw); }
.main-card.slide-left.step-forward { transform: translateX(25vw); }
.main-card.step-back { transform: translateX(25vw); }
.main-card.slide-left.step-back { transform: translateX(25vw); }

.card-content { height: 100%; display: flex; flex-direction: column; justify-content: center; }
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
</style>
