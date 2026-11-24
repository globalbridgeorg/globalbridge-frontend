<script setup>
import { ref, reactive, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import { signInPassword, signInOtp, verifyLoginOtp } from '@/services/api'
import { useContaAtual } from '@/composables/useContaAtual'
import { traduzirErroAuth } from '@/utils/authErrors'

const emit = defineEmits(['criar-conta'])
const router = useRouter()
const { carregarConta } = useContaAtual()

const loginMode = ref('estudante')
const loading = ref(false)
const errorField = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const loginForm = reactive({ email: '', password: '', keepLogged: false })
const codigoModo = ref(false)
const codigoEnviado = ref(false)
const codigoValor = ref('')
const codigoLoading = ref(false)

function clearError() { errorField.value = ''; errorMessage.value = '' }
function clearErrorForField(field) { if (errorField.value === field) clearError() }
function setError(field, message) { errorField.value = field; errorMessage.value = message; successMessage.value = '' }

onDeactivated(() => { clearError(); successMessage.value = '' })

async function irERedirecionarPosLogin() {
  const conta = await carregarConta(true)
  if (conta.tipo === 'agencia') {
    router.push({ name: 'business' })
  } else if (conta.is_admin) {
    router.push({ name: 'admin' })
  } else {
    router.push({ name: 'profile' })
  }
}

async function handleLogin() {
  clearError()
  if (!loginForm.email.trim()) return setError('login.email', 'Informe seu e-mail')
  if (!loginForm.password) return setError('login.password', 'Informe sua senha')
  loading.value = true
  try {
    await signInPassword(loginForm.email, loginForm.password, loginForm.keepLogged)
    successMessage.value = 'Login realizado com sucesso!'
    await irERedirecionarPosLogin()
  } catch (err) {
    setError('login.email', traduzirErroAuth(err))
  } finally {
    loading.value = false
  }
}

function trocarParaCodigo(ativo) {
  clearError()
  codigoModo.value = ativo
  codigoEnviado.value = false
  codigoValor.value = ''
}

async function solicitarCodigo() {
  clearError()
  if (!loginForm.email.trim()) return setError('login.email', 'Informe seu e-mail')
  loading.value = true
  try {
    await signInOtp(loginForm.email, loginForm.keepLogged)
    codigoEnviado.value = true
    successMessage.value = 'Se esse e-mail tiver conta, o código chega em instantes.'
  } catch (err) {
    setError('login.email', traduzirErroAuth(err))
  } finally {
    loading.value = false
  }
}

async function confirmarCodigo() {
  clearError()
  if (!codigoValor.value.trim()) return setError('login.codigo', 'Informe o código recebido')
  codigoLoading.value = true
  try {
    await verifyLoginOtp(loginForm.email, codigoValor.value)
    await irERedirecionarPosLogin()
  } catch (err) {
    setError('login.codigo', traduzirErroAuth(err, 'Código inválido ou expirado'))
  } finally {
    codigoLoading.value = false
  }
}
</script>

<template>
  <div class="card-content">
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
      <input id="login-email" type="email" autocomplete="email" v-model="loginForm.email" placeholder="seu@email.com" @keyup.enter="!codigoModo ? handleLogin() : solicitarCodigo()" @input="clearErrorForField('login.email')">
    </div>

    <template v-if="!codigoModo">
      <div class="form-group">
        <label for="login-senha">Senha</label>
        <div v-if="errorField === 'login.password'" class="field-error">{{ errorMessage }}</div>
        <input id="login-senha" type="password" autocomplete="current-password" v-model="loginForm.password" placeholder="••••••••" @keyup.enter="handleLogin" @input="clearErrorForField('login.password')">
      </div>
      <div class="checkbox-group">
        <input type="checkbox" id="keepLogged" v-model="loginForm.keepLogged">
        <label for="keepLogged">Manter conectado</label>
      </div>
      <button class="btn-primary" :disabled="loading" @click="handleLogin">{{ loading ? 'Entrando...' : (loginMode === 'agencia' ? 'Entrar como agência' : 'Entrar') }}</button>
      <div class="login-extra-links">
        <router-link to="/esqueci-senha">Esqueceu a senha?</router-link>
        <button type="button" class="link-inline" @click="trocarParaCodigo(true)">Entrar com código por e-mail</button>
      </div>
    </template>

    <template v-else-if="!codigoEnviado">
      <div class="checkbox-group">
        <input type="checkbox" id="keepLogged2" v-model="loginForm.keepLogged">
        <label for="keepLogged2">Manter conectado</label>
      </div>
      <button class="btn-primary" :disabled="loading" @click="solicitarCodigo">{{ loading ? 'Enviando...' : 'Enviar código' }}</button>
      <div class="login-extra-links">
        <button class="link-inline" @click="trocarParaCodigo(false)">Entrar com senha</button>
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
        <button class="link-inline" @click="trocarParaCodigo(false)">Entrar com senha</button>
      </div>
    </template>

    <div v-if="loginMode === 'estudante'" class="create-account-link">
      <span>Não possui uma conta?</span>
      <button class="link-button" @click="emit('criar-conta')">Criar conta</button>
    </div>
    <div v-else class="create-account-link">
      <span>Sua agência ainda não tem conta business?</span>
      <router-link class="link-button" to="/business/solicitar">Solicitar verificação</router-link>
    </div>
  </div>
</template>

<style scoped>
.mode-toggle { position: relative; display: grid; grid-template-columns: 1fr 1fr; background: rgba(46, 10, 46, 0.06); border-radius: 12px; padding: 4px; margin-bottom: 24px; }
.mode-toggle-thumb { position: absolute; top: 4px; left: 4px; width: calc(50% - 6px); height: calc(100% - 8px); background: var(--gb-dark); border-radius: 9px; transition: transform 0.25s cubic-bezier(.4,0,.2,1); }
.mode-toggle-thumb.right { transform: translateX(calc(100% + 4px)); }
.mode-opt { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; border: none; background: none; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 12px; letter-spacing: 0.02em; text-transform: uppercase; color: var(--gb-ink-faint); cursor: pointer; transition: color 0.2s ease; }
.mode-opt.active { color: #fff; }
.checkbox-group { display: flex; align-items: center; gap: 10px; margin-bottom: 25px; }
.checkbox-group input { width: 16px; height: 16px; accent-color: var(--gb-magenta); cursor: pointer; }
.checkbox-group label { margin-bottom: 0; font-size: 13px; color: var(--gb-ink-soft); cursor: pointer; }
.login-extra-links { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
.login-extra-links a, .login-extra-links .link-inline { background: none; border: none; padding: 0; color: var(--gb-magenta); font-size: 12.5px; font-weight: 600; cursor: pointer; text-decoration: underline; }
.login-extra-links a:hover, .login-extra-links .link-inline:hover { color: #7A0F74; }
.create-account-link { text-align: center; margin-top: 20px; }
.create-account-link span { color: var(--gb-ink-soft); font-size: 13px; }
.link-button { background: none; border: none; color: var(--gb-magenta); font-weight: 600; cursor: pointer; font-size: 13px; text-decoration: underline; margin-left: 5px; }
.link-button:hover { color: #7A0F74; }
</style>
