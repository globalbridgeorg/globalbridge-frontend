<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AuthCenario from '@/components/auth/AuthCenario.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import CadastroEtapas from '@/components/auth/CadastroEtapas.vue'

const showRegister = ref(false)
const cardPhase = ref('idle')
const cardPhaseTimers = []
const justMounted = ref(true)
onMounted(() => { cardPhaseTimers.push(setTimeout(() => { justMounted.value = false }, 700)) })

function switchAuthMode(toRegister) {
  if (cardPhase.value !== 'idle') return
  cardPhaseTimers.splice(0).forEach(clearTimeout)
  cardPhase.value = 'exiting'
  cardPhaseTimers.push(setTimeout(() => {
    showRegister.value = toRegister
    cardPhase.value = 'entering'
    cardPhaseTimers.push(setTimeout(() => { cardPhase.value = 'idle' }, 300))
  }, 220))
}

onBeforeUnmount(() => { cardPhaseTimers.splice(0).forEach(clearTimeout) })
</script>

<template>
  <div class="page-container">
    <AuthCenario />

    <div
      class="main-card"
      :class="{ 'slide-left': showRegister, 'mount-in': justMounted, 'card-exit': cardPhase === 'exiting', 'card-enter': cardPhase === 'entering' }"
    >
      <!-- Login fica vivo ao ir pro cadastro (mantém e-mail digitado); o cadastro sempre recomeça do zero. -->
      <KeepAlive include="LoginForm">
        <LoginForm v-if="!showRegister" @criar-conta="switchAuthMode(true)" />
        <CadastroEtapas v-else @voltar-login="switchAuthMode(false)" />
      </KeepAlive>
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

@media (prefers-reduced-motion: reduce) {
  .page-container, .main-card, .main-card.mount-in, .main-card.card-exit, .main-card.card-enter { animation: none; }
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

.main-card.card-exit { animation: cardExit 0.22s ease both; }
@keyframes cardExit { to { opacity: 0; transform: translateX(var(--card-shift)) translateY(10px); } }

.main-card.card-enter { animation: cardEnter 0.28s ease both; }
@keyframes cardEnter {
  from { opacity: 0; transform: translateX(var(--card-shift)) translateY(10px); }
  to { opacity: 1; transform: translateX(var(--card-shift)) translateY(0); }
}

.card-content { height: 100%; display: flex; flex-direction: column; justify-content: center; }

/* Campos/botões/mensagens usados tanto no LoginForm quanto no CadastroEtapas. */
:deep(.form-group) { margin-bottom: 20px; }
:deep(.form-group label) { display: block; margin-bottom: 8px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gb-ink-faint); }
:deep(.form-group input) { width: 100%; padding: 12px 14px; border: 1px solid var(--gb-purple-deep-16); border-radius: 10px; font-size: 14px; font-family: var(--gb-font-display); transition: border-color 0.2s ease, box-shadow 0.2s ease; background: #fff; color: var(--gb-dark); }
:deep(.form-group input:focus) { outline: none; border-color: var(--gb-magenta); box-shadow: 0 0 0 3px rgba(176, 31, 176, 0.12); }
:deep(.btn-primary) { width: 100%; background: var(--gb-dark); color: #fff; border: none; padding: 13px; border-radius: 10px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; transition: background 0.2s ease, transform 0.1s ease; }
:deep(.btn-primary:hover) { background: var(--gb-magenta); }
:deep(.btn-primary:active) { transform: scale(0.98); }
.side-text { position: absolute; left: 8%; top: 30%; transform: translateY(-50%); opacity: 0; transition: opacity 0.6s ease 0.3s; pointer-events: none; z-index: 1; }
.side-text.show { opacity: 1; pointer-events: auto; }
.side-text h1 { font-family: var(--gb-font-display); font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; color: var(--gb-cream); font-size: 4.5rem; line-height: 1.02; margin: 0; }
:deep(.field-error) { display: block; margin-bottom: 8px; color: #dc2626; font-size: 13px; font-weight: 700; animation: errorShake 0.25s ease-in-out; }
:deep(.field-success) { display: block; margin-bottom: 16px; color: #15803d; font-size: 13px; font-weight: 700; }

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
