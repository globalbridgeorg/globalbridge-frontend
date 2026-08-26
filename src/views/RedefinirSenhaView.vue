<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/services/axios'

const route = useRoute()
const router = useRouter()

const uid = computed(() => route.query.uid || '')
const token = computed(() => route.query.token || '')
const linkValido = computed(() => Boolean(uid.value && token.value))

const novaSenha = ref('')
const confirmarSenha = ref('')
const loading = ref(false)
const erro = ref('')
const sucesso = ref(false)

async function redefinir() {
  erro.value = ''
  if (!novaSenha.value || novaSenha.value.length < 8) { erro.value = 'A senha deve ter no mínimo 8 caracteres.'; return }
  if (novaSenha.value !== confirmarSenha.value) { erro.value = 'As senhas não coincidem.'; return }

  loading.value = true
  try {
    await axios.post('/auth/redefinir-senha/', { uid: uid.value, token: token.value, nova_senha: novaSenha.value })
    sucesso.value = true
    setTimeout(() => router.push({ name: 'login' }), 2500)
  } catch (e) {
    erro.value = e.response?.data?.detail || 'Não foi possível redefinir a senha.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="redefinir-view gb-section">
    <span class="eyebrow">Redefinição de senha</span>

    <template v-if="!linkValido">
      <h1 class="gb-heading">Link<br />inválido</h1>
      <p class="desc">Esse link de redefinição está incompleto ou expirou. Pede um novo.</p>
      <router-link class="voltar" to="/esqueci-senha">Pedir novo link</router-link>
    </template>

    <template v-else-if="sucesso">
      <div class="icone-ok">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/></svg>
      </div>
      <h1 class="gb-heading">Senha<br />redefinida</h1>
      <p class="desc">Já pode logar com a nova senha. Te levando pro login...</p>
    </template>

    <template v-else>
      <h1 class="gb-heading">Escolha uma<br />nova senha</h1>

      <div class="form-group">
        <label>Nova senha</label>
        <input type="password" v-model="novaSenha" placeholder="Mínimo 8 caracteres">
      </div>
      <div class="form-group">
        <label>Confirmar senha</label>
        <div v-if="erro" class="field-error">{{ erro }}</div>
        <input type="password" v-model="confirmarSenha" placeholder="Digite novamente" @keyup.enter="redefinir">
      </div>

      <button class="btn-primary" :disabled="loading" @click="redefinir">{{ loading ? 'Salvando...' : 'Redefinir senha' }}</button>
    </template>
  </div>
</template>

<style scoped>
.redefinir-view {
  padding: 120px 5% 90px;
  max-width: 480px;
  text-align: center;
}

.eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-mauve);
}

.gb-heading {
  margin: 12px 0 12px;
  font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2.2rem);
}

.desc {
  font-size: 1rem;
  color: var(--gb-ink-soft);
  line-height: 1.6;
  margin-bottom: 32px;
}

.icone-ok {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px auto 20px;
  background: rgba(61, 154, 75, 0.12);
  color: #3D9A4B;
}

.form-group { text-align: left; margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gb-ink-faint); }
.form-group input { width: 100%; padding: 12px 14px; border: 1px solid var(--gb-purple-deep-16); border-radius: 10px; font-size: 14px; font-family: var(--gb-font-display); background: #fff; color: var(--gb-dark); }
.form-group input:focus { outline: none; border-color: var(--gb-magenta); box-shadow: 0 0 0 3px rgba(176, 31, 176, 0.12); }
.field-error { display: block; margin-bottom: 8px; color: #dc2626; font-size: 13px; font-weight: 700; }

.btn-primary { width: 100%; background: var(--gb-dark); color: #fff; border: none; padding: 13px; border-radius: 10px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; }
.btn-primary:hover { background: var(--gb-magenta); }
.btn-primary:disabled { opacity: 0.6; cursor: default; }

.voltar { display: block; margin-top: 24px; font-size: 13px; color: var(--gb-magenta); font-weight: 600; text-decoration: underline; }
</style>
