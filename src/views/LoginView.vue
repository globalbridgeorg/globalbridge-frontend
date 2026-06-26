<script>
import axios from '@/services/axios'

export default {
  name: 'LoginRegisterView',
  data() {
    return {
      showRegister: false,
      loading: false,
      error: '',
      successMessage: '',
      errorField: '',
      errorMessage: '',
      step: 1,
      stepDirection: '',
      stepAnimationTimer: null,
      steps: [
        { fields: ['email'], labels: ['E-mail'], placeholders: ['exemplo@dominio.com'], types: ['email'], label: 'E-mail' },
        { fields: ['verificationCode'], labels: ['Código de verificação'], placeholders: ['000000'], types: ['text'], label: 'Código de verificação' },
        { fields: ['name'], labels: ['Nome completo'], placeholders: ['Seu nome'], types: ['text'], label: 'Dados pessoais' },
        { fields: ['password', 'confirmPassword'], labels: ['Senha', 'Confirmar senha'], placeholders: ['Crie uma senha', 'Digite novamente'], types: ['password', 'password'], label: 'Senha' }
      ],
      loginForm: {
        email: '',
        password: '',
        keepLogged: false
      },
      registerData: {
        email: '',
        verificationCode: '',
        name: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  computed: {
    currentStep() {
      return this.steps[this.step - 1] || this.steps[0]
    }
  },
  beforeUnmount() {
    if (this.stepAnimationTimer) {
      clearTimeout(this.stepAnimationTimer)
    }
  },
  methods: {
    clearError() {
      this.error = ''
      this.errorField = ''
      this.errorMessage = ''
    },

    clearErrorForField(field) {
      if (this.errorField === field) {
        this.errorField = ''
        this.errorMessage = ''
      }
    },

    setError(field, message) {
      this.errorField = field
      this.errorMessage = message
      this.successMessage = ''
    },

    animateStep(direction) {
      this.stepDirection = direction
      if (this.stepAnimationTimer) {
        clearTimeout(this.stepAnimationTimer)
      }
      this.stepAnimationTimer = setTimeout(() => {
        this.stepDirection = ''
      }, 240)
    },

    goToRegister() {
      this.showRegister = true
      this.step = 1
      this.clearError()
      this.successMessage = ''
      this.registerData = {
        email: '',
        verificationCode: '',
        name: '',
        password: '',
        confirmPassword: ''
      }
    },

    goToStep(targetStep) {
      if (targetStep < 1 || targetStep >= this.step) return
      this.step = targetStep
      this.animateStep('back')
      this.clearError()
    },

    nextStep() {
      const currentStep = this.currentStep
      this.clearError()

      if (currentStep.fields[0] === 'verificationCode') {
        if (this.step < this.steps.length) {
          this.step++
          this.animateStep('forward')
        }
        return
      }

      for (const field of currentStep.fields) {
        if (!this.registerData[field]) {
          const label = currentStep.labels[currentStep.fields.indexOf(field)]
          this.setError(`register.${field}`, `Preencha ${label.toLowerCase()}`)
          return
        }
      }

      if (this.step < this.steps.length) {
        this.step++
        this.animateStep('forward')
      }
    },

    prevStep() {
      if (this.step > 1) {
        this.step--
        this.animateStep('back')
        this.clearError()
      }
    },

    skipVerification() {
      this.registerData.verificationCode = '000000'
      if (this.step < this.steps.length) {
        this.step++
        this.animateStep('forward')
      }
    },

    handleStepEnter() {
      if (this.step < this.steps.length) {
        this.nextStep()
      } else {
        this.handleRegister()
      }
    },

    async handleLogin() {
      this.clearError()

      if (!this.loginForm.email) {
        this.setError('login.email', 'Informe seu e-mail')
        return
      }

      if (!this.loginForm.password) {
        this.setError('login.password', 'Informe sua senha')
        return
      }

      this.loading = true

      try {
        const response = await axios.post('/token/', {
          email: this.loginForm.email,
          password: this.loginForm.password
        })

        const { access, refresh } = response.data

        if (this.loginForm.keepLogged) {
          localStorage.setItem('access_token', access)
          localStorage.setItem('refresh_token', refresh)
        } else {
          sessionStorage.setItem('access_token', access)
          sessionStorage.setItem('refresh_token', refresh)
        }

        this.successMessage = 'Login realizado com sucesso!'
        this.$router.push({ name: 'profile' })
      } catch (err) {
        if (err.response?.status === 401) {
          this.setError('login.email', 'E-mail ou senha inválidos')
        } else {
          this.setError('login.email', 'Erro ao conectar com o servidor')
        }
      } finally {
        this.loading = false
      }
    },

    async handleRegister() {
      this.clearError()

      if (!this.registerData.email) {
        this.setError('register.email', 'Informe seu e-mail')
        return
      }

      if (!this.registerData.name) {
        this.setError('register.name', 'Informe seu nome completo')
        return
      }

      if (!this.registerData.password) {
        this.setError('register.password', 'Crie uma senha')
        return
      }

      if (!this.registerData.confirmPassword) {
        this.setError('register.confirmPassword', 'Confirme sua senha')
        return
      }

      if (this.registerData.password !== this.registerData.confirmPassword) {
        this.setError('register.confirmPassword', 'As senhas não coincidem')
        return
      }

      if (this.registerData.password.length < 8) {
        this.setError('register.password', 'A senha deve ter no mínimo 8 caracteres')
        return
      }

      this.loading = true

      try {
        const response = await axios.post('/registro/', {
          email: this.registerData.email,
          name: this.registerData.name,

          password: this.registerData.password
        })

        const { access, refresh } = response.data
        if (access && refresh) {
          localStorage.setItem('access_token', access)
          localStorage.setItem('refresh_token', refresh)
          this.$router.push({ name: 'profile' })
          return
        }

        const loginResponse = await axios.post('/token/', {
          email: this.registerData.email,
          password: this.registerData.password
        })

        const { access: loginAccess, refresh: loginRefresh } = loginResponse.data
        localStorage.setItem('access_token', loginAccess)
        localStorage.setItem('refresh_token', loginRefresh)
        this.$router.push({ name: 'profile' })
      } catch (err) {
        if (err.response?.data?.email) {
          this.setError('register.email', 'Este e-mail já está em uso')
        } else if (err.response?.data?.password) {
          this.setError('register.password', err.response.data.password[0])
        } else {
          this.setError('register.email', 'Erro ao criar conta')
        }
      } finally {
        this.loading = false
      }
    },

    resendCode() {
      this.clearError()
      this.successMessage = 'Código reenviado com sucesso.'
    },

    backToLogin() {
      this.showRegister = false
      this.step = 1
      this.clearError()
      this.successMessage = ''
      this.registerData = {
        email: '',
        verificationCode: '',
        name: '',
        password: '',
        confirmPassword: ''
      }
    }
  }
}
</script>

<template>
  <div class="page-container">
    <div class="background-image"></div>

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

.main-card.slide-left {
  transform: translateX(25vw);
}

.main-card.step-forward {
  transform: translateX(25vw);
}

.main-card.slide-left.step-forward {
  transform: translateX(25vw);
}

.main-card.step-back {
  transform: translateX(25vw);
}

.main-card.slide-left.step-back {
  transform: translateX(25vw);
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 25px;
}

.checkbox-group input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-group label {
  margin-bottom: 0;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
}

.btn-primary {
  width: 100%;
  background: url('/images/backgroundlogin.png');
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: scale(0.98);
}

.create-account-link {
  text-align: center;
  margin-top: 20px;
}

.create-account-link span {
  color: #6b7280;
  font-size: 14px;
}

.link-button {
  background: none;
  border: none;
  color: #4F46E5;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
  margin-left: 5px;
}

.link-button:hover {
  color: #06B6D4;
}

.resend-code {
  text-align: right;
  margin-top: -12px;
  margin-bottom: 20px;
}

.resend-link {
  background: none;
  border: none;
  color: #4F46E5;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.back-to-login {
  text-align: center;
  margin-top: 20px;
}

.back-to-login span {
  color: #6b7280;
  font-size: 14px;
  display: block;
  margin-bottom: 8px;
}

.back-login-link {
  background: none;
  border: none;
  color: #4F46E5;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.back-login-link:hover {
  color: #06B6D4;
}

.side-text {
  position: absolute;
  left: 8%;
  top: 30%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.6s ease 0.3s;
  pointer-events: none;
}

.side-text.show {
  opacity: 1;
  pointer-events: auto;
}

.side-text h1 {
  color: white;
  font-size: 5rem;
  font-weight: bold;
  line-height: 1.1;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.footer-text {
  padding: 0 0 0 15px;
  opacity: 40%;
  position: absolute;
  bottom: 40px;
  left: 0;
  text-align: left;
  color: #ffffff;
  font-size: 12px;
}

.stepper {
  margin-bottom: 30px;
  text-align: center;
}

.step-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: #e5e7eb;
  transition: all 0.3s;
  cursor: pointer;
  padding: 0;
}

.dot.active {
  background: #1F1235;
  transform: scale(1.3);
}

.dot.completed {
  background: #514762;
}

.step-info {
  color: #4b5563;
  font-size: 14px;
}

.step-label {
  font-weight: 600;
  display: block;
  margin-bottom: 14px;
}

.step-count {
  font-size: 12px;
  color: #9ca3af;
}

.step-buttons {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.step-buttons .btn-primary,
.step-buttons .btn-secondary {
  flex: 1;
}

.btn-secondary {
  background: #e5e7eb;
  color: #1f2937;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.verification-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -10px 0 20px;
}

.resend-link {
  background: none;
  border: none;
  color: #4F46E5;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.debug-link {
  background: none;
  border: none;
  color: #f59e0b;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.field-error {
  display: block;
  margin-bottom: 8px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
  animation: errorShake 0.25s ease-in-out;
}

.field-success {
  display: block;
  margin-bottom: 16px;
  color: #15803d;
  font-size: 13px;
  font-weight: 700;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
}
</style>