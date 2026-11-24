<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { supabase } from '@/services/supabase'
import { atualizarSenha } from '@/services/api'
import { prefersReducedMotion } from '@/composables/usePageTransition'

const router = useRouter()
const viewRef = ref(null)
let ctx

const verificando = ref(true)
const linkValido = ref(false)
const novaSenha = ref('')
const confirmarSenha = ref('')
const loading = ref(false)
const erro = ref('')
const sucesso = ref(false)

let subscription = null

function animar() {
  if (prefersReducedMotion() || !viewRef.value) return
  ctx?.revert()
  ctx = gsap.context(() => {
    gsap.from('.redefinir-view > *', {
      opacity: 0,
      y: 16,
      duration: 0.45,
      stagger: 0.06,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    })
  }, viewRef.value)
}

watch([verificando, sucesso], async () => {
  await nextTick()
  animar()
})

onMounted(async () => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
      linkValido.value = true
      verificando.value = false
    }
  })
  subscription = data.subscription

  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    linkValido.value = true
  }
  verificando.value = false
  await nextTick()
  animar()
})

onUnmounted(() => {
  subscription?.unsubscribe()
  ctx?.revert()
})

async function redefinir() {
  erro.value = ''
  if (!novaSenha.value || novaSenha.value.length < 8) { erro.value = 'A senha deve ter no mínimo 8 caracteres.'; return }
  if (novaSenha.value !== confirmarSenha.value) { erro.value = 'As senhas não coincidem.'; return }

  loading.value = true
  try {
    await atualizarSenha(novaSenha.value)
    sucesso.value = true
    setTimeout(() => router.push({ name: 'login' }), 2500)
  } catch {
    erro.value = 'Não foi possível redefinir a senha. Peça um novo link se este tiver expirado.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div ref="viewRef" class="redefinir-view gb-section">
    <span class="eyebrow">Redefinição de senha</span>

    <template v-if="verificando">
      <h1 class="gb-heading">Validando<br />seu link...</h1>
      <p class="desc">Aguarde um instante.</p>
    </template>

    <template v-else-if="!linkValido">
      <h1 class="gb-heading">Link<br />inválido</h1>
      <p class="desc">Esse link de redefinição está incompleto ou expirou. Peça um novo.</p>
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
        <label for="rs-nova-senha">Nova senha</label>
        <input id="rs-nova-senha" type="password" v-model="novaSenha" placeholder="Mínimo 8 caracteres" @keyup.enter="redefinir">
      </div>
      <div class="form-group">
        <label for="rs-confirmar-senha">Confirmar senha</label>
        <div v-if="erro" class="field-error">{{ erro }}</div>
        <input id="rs-confirmar-senha" type="password" v-model="confirmarSenha" placeholder="Digite novamente" @keyup.enter="redefinir">
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
  color: var(--gb-green);
}

.form-group { text-align: left; margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gb-ink-faint); }
.form-group input { width: 100%; padding: 12px 14px; border: 1px solid var(--gb-purple-deep-16); border-radius: 10px; font-size: 14px; font-family: var(--gb-font-display); background: #fff; color: var(--gb-dark); }
.form-group input:focus { outline: 2px solid var(--gb-magenta); outline-offset: 1px; border-color: var(--gb-magenta); }
.field-error { display: block; margin-bottom: 8px; color: #dc2626; font-size: 13px; font-weight: 700; }

.btn-primary { width: 100%; background: var(--gb-dark); color: #fff; border: none; padding: 13px; border-radius: 10px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; }
.btn-primary:hover { background: var(--gb-magenta); }
.btn-primary:disabled { opacity: 0.6; cursor: default; }

.voltar { display: block; margin-top: 24px; font-size: 13px; color: var(--gb-magenta); font-weight: 600; text-decoration: underline; }

@media (max-width: 768px) {
  .redefinir-view {
    padding: 16px 16px 72px;
  }
}
</style>
