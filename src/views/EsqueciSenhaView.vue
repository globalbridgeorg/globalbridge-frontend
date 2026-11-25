<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { solicitarRedefinicaoSenha } from '@/services/api'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { traduzirErroAuth } from '@/utils/authErrors'

const viewRef = ref(null)
let ctx

const email = ref('')
const enviado = ref(false)
const loading = ref(false)
const erro = ref('')

function animar() {
  if (prefersReducedMotion() || !viewRef.value) return
  ctx?.revert()
  ctx = gsap.context(() => {
    gsap.from('.esqueci-view > *', {
      opacity: 0,
      y: 16,
      duration: 0.45,
      stagger: 0.06,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    })
  }, viewRef.value)
}

async function enviar() {
  erro.value = ''
  if (!email.value.trim()) { erro.value = 'Informe seu e-mail.'; return }
  loading.value = true
  try {
    await solicitarRedefinicaoSenha(email.value)
    enviado.value = true
  } catch (err) {
    erro.value = traduzirErroAuth(err, 'Erro ao enviar. Tente novamente em instantes.')
  } finally {
    loading.value = false
  }
}

watch(enviado, async () => {
  await nextTick()
  animar()
})

onMounted(animar)
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="viewRef" class="esqueci-view gb-section">
    <span class="eyebrow">Redefinição de senha</span>

    <template v-if="!enviado">
      <h1 class="gb-heading">Esqueceu<br />sua senha?</h1>
      <p class="desc">Informa o e-mail da sua conta que a gente manda um link pra você escolher uma nova senha.</p>

      <div class="form-group">
        <label for="es-email">E-mail</label>
        <div v-if="erro" class="field-error">{{ erro }}</div>
        <input id="es-email" type="email" v-model="email" placeholder="seu@email.com" @keyup.enter="enviar">
      </div>

      <button class="btn-primary" :disabled="loading" @click="enviar">{{ loading ? 'Enviando...' : 'Enviar link' }}</button>
    </template>

    <template v-else>
      <div class="icone-ok">
        <i class="fi fi-rr-check-circle" aria-hidden="true"></i>
      </div>
      <h1 class="gb-heading">Confere<br />seu e-mail</h1>
      <p class="desc">Se {{ email }} tiver uma conta na GlobalBridge, você vai receber um link pra redefinir a senha em instantes.</p>
    </template>

    <router-link class="voltar" to="/login">Voltar pro login</router-link>
  </div>
</template>

<style scoped>
.esqueci-view {
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
  font-size: 34px;
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
  .esqueci-view {
    padding: 16px 16px 72px;
  }
}
</style>
