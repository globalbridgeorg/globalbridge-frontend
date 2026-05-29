<template>
  <div class="page-container">
    <div class="background-image"></div>

    <!-- Quadrado Principal -->
    <div
      class="main-card"
      :class="{ 'slide-left': showRegister }"
    >
      <!-- Tela de Login -->
      <div v-if="!showRegister" class="card-content">
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" v-model="loginForm.email" placeholder="seu@email.com">
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" v-model="loginForm.password" placeholder="••••••••">
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="keepLogged" v-model="loginForm.keepLogged">
          <label for="keepLogged">Manter conectado</label>
        </div>
        <button class="btn-primary" @click="handleLogin">Entrar</button>
        <div class="create-account-link">
          <span>Não possui uma conta?</span>
          <button class="link-button" @click="showRegister = true">Criar conta</button>
        </div>
      </div>

      <!-- Tela de Cadastro -->
      <div v-else class="card-content">
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" v-model="registerData.email" placeholder="exemplo@dominio.com">
        </div>
        <div class="form-group">
          <label>Código de verificação</label>
          <input type="text" v-model="registerData.verificationCode" placeholder="000000">
        </div>
        <div class="resend-code">
          <button class="resend-link" @click="resendCode">Reenviar código</button>
        </div>
        <div class="form-group">
          <label>Nome completo</label>
          <input type="text" v-model="registerData.name" placeholder="Seu nome">
        </div>
        <div class="form-group">
          <label>Nome de usuário</label>
          <input type="text" v-model="registerData.username" placeholder="@username">
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" v-model="registerData.password" placeholder="Crie uma senha">
        </div>
        <div class="form-group">
          <label>Confirmar senha</label>
          <input type="password" v-model="registerData.confirmPassword" placeholder="Digite novamente">
        </div>
        <button class="btn-primary" @click="handleRegister">Criar conta</button>

        <div class="back-to-login">
          <span>Já possui uma conta?</span>
          <button class="back-login-link" @click="backToLogin">Fazer Login</button>
        </div>
      </div>
    </div>

    <!-- Texto lateral -->
    <div class="side-text" :class="{ show: showRegister }">
      <h1>CRIAR UMA<br>CONTA</h1>
    </div>

    <!-- Rodapé -->
    <div class="footer-text">
      É necessário uma conta para realizar doações não anônimas<br>
      by share-help
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

export default {
  name: 'LoginRegisterView',
  data() {
    return {
      showRegister: false,
      loading: false,
      error: '',
      loginForm: {
        email: '',
        password: '',
        keepLogged: false
      },
      registerData: {
        email: '',
        verificationCode: '',
        name: '',
        username: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    // ==================== LOGIN ====================
    async handleLogin() {
      this.error = ''

      // Validação básica
      if (!this.loginForm.email || !this.loginForm.password) {
        this.error = 'Preencha todos os campos'
        alert(this.error)
        return
      }

      this.loading = true

      try {
        // Faz a requisição para o backend
        const response = await axios.post(`${API_URL}/token/`, {
          email: this.loginForm.email,
          password: this.loginForm.password
        })

        // Salva os tokens
        const { access, refresh } = response.data

        if (this.loginForm.keepLogged) {
          // Mantém mesmo fechando o navegador
          localStorage.setItem('access_token', access)
          localStorage.setItem('refresh_token', refresh)
        } else {
          // Apaga quando fechar o navegador
          sessionStorage.setItem('access_token', access)
          sessionStorage.setItem('refresh_token', refresh)
        }

        alert('Login realizado com sucesso!')

        // Redireciona para a home
        this.$router.push({ name: 'test' }) 

      } catch (err) {
        if (err.response?.status === 401) {
          this.error = 'Email ou senha inválidos'
        } else {
          this.error = 'Erro ao conectar com o servidor'
        }
        alert(this.error)
      } finally {
        this.loading = false
      }
    },

    // ==================== REGISTRO ====================
    async handleRegister() {
      this.error = ''

      // Validações
      if (!this.registerData.email || !this.registerData.name || !this.registerData.password) {
        this.error = 'Preencha todos os campos'
        alert(this.error)
        return
      }

      if (this.registerData.password !== this.registerData.confirmPassword) {
        this.error = 'As senhas não coincidem'
        alert(this.error)
        return
      }

      if (this.registerData.password.length < 8) {
        this.error = 'A senha deve ter no mínimo 8 caracteres'
        alert(this.error)
        return
      }

      this.loading = true

      try {
        // Cadastra o usuário
        await axios.post(`${API_URL}/registro/`, {
          email: this.registerData.email,
          name: this.registerData.name,
          password: this.registerData.password
        })

        alert('Conta criada com sucesso! Faça login.')

        // Volta para a tela de login
        this.backToLogin()

      } catch (err) {
        if (err.response?.data?.email) {
          this.error = 'Este email já está em uso'
        } else if (err.response?.data?.password) {
          this.error = err.response.data.password[0]
        } else {
          this.error = 'Erro ao criar conta'
        }
        alert(this.error)
      } finally {
        this.loading = false
      }
    },

    // ==================== OUTROS ====================
    resendCode() {
      alert('Reenvio de código simulado.')
    },

    backToLogin() {
      this.showRegister = false
      this.error = ''
      this.registerData = {
        email: '',
        verificationCode: '',
        name: '',
        username: '',
        password: '',
        confirmPassword: ''
      }
    }
  }
}
</script>

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
  min-height: 500px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(0);
  z-index: 1;
}

.main-card.slide-left {
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
</style>