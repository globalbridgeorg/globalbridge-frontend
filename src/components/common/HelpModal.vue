<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

// Modal genérico pra explicar uma página por vídeo — pensado pra ser
// reaproveitado em outras telas do site além do mapa, por isso só recebe
// título + fonte do vídeo (ou conteúdo customizado via slot) e não sabe
// nada sobre mapa/filtros/etc.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  videoSrc: { type: String, default: '' },
  videoPoster: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const panelRef = ref(null)
const videoRef = ref(null)
const carregandoVideo = ref(true)
let elementoComFocoAntes = null

function fechar() {
  emit('update:modelValue', false)
}

function aoClicarNoBackdrop(event) {
  if (event.target === event.currentTarget) fechar()
}

function aoPressionarTecla(event) {
  if (event.key === 'Escape') fechar()
}

watch(() => props.modelValue, (aberto) => {
  if (aberto) {
    carregandoVideo.value = true
    elementoComFocoAntes = document.activeElement
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => panelRef.value?.focus())
  } else {
    document.body.style.overflow = ''
    videoRef.value?.pause()
    elementoComFocoAntes?.focus?.()
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="help-modal">
      <div
        v-if="modelValue"
        class="help-modal-backdrop"
        @click="aoClicarNoBackdrop"
        @keydown="aoPressionarTecla"
      >
        <div
          ref="panelRef"
          class="help-modal-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
        >
          <header class="help-modal-header">
            <h2 class="help-modal-title">{{ title }}</h2>
            <button type="button" class="help-modal-close" aria-label="Fechar" @click="fechar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div class="help-modal-body">
            <slot>
              <div v-if="videoSrc" class="help-modal-video-wrap">
                <div v-if="carregandoVideo" class="help-modal-video-loading">
                  <LoadingSpinner label="Carregando..." />
                </div>
                <video
                  ref="videoRef"
                  class="help-modal-video"
                  :class="{ 'is-loading': carregandoVideo }"
                  :src="videoSrc"
                  :poster="videoPoster"
                  autoplay
                  muted
                  loop
                  playsinline
                  @canplay="carregandoVideo = false"
                />
              </div>
              <p v-else class="help-modal-placeholder">Vídeo explicativo em breve.</p>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.help-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(23, 17, 26, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.help-modal-panel {
  width: 100%;
  max-width: 780px;
  max-height: min(88vh, 720px);
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid var(--gb-purple-deep-16);
  box-shadow: 0 24px 64px rgba(23, 17, 26, 0.32);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.help-modal-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--gb-purple-deep-16);
}

.help-modal-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 18px;
  color: var(--gb-dark);
  margin: 0;
}

.help-modal-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--gb-ink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 150ms ease-out, color 150ms ease-out;
}
.help-modal-close:hover {
  background: var(--gb-purple-deep-16);
  color: var(--gb-dark);
}
.help-modal-close:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

.help-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-modal-video-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 70vh;
}

.help-modal-video-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--gb-dark);
}

.help-modal-video {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: var(--gb-dark);
  display: block;
  object-fit: contain;
  transition: opacity 200ms ease-out;
}
.help-modal-video.is-loading {
  opacity: 0;
}

.help-modal-placeholder {
  font-size: 14px;
  color: var(--gb-ink-faint);
  text-align: center;
}

.help-modal-enter-active,
.help-modal-leave-active {
  transition: opacity 200ms ease-out;
}
.help-modal-enter-active .help-modal-panel,
.help-modal-leave-active .help-modal-panel {
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}
.help-modal-enter-from,
.help-modal-leave-to {
  opacity: 0;
}
.help-modal-enter-from .help-modal-panel,
.help-modal-leave-to .help-modal-panel {
  transform: scale(0.96);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .help-modal-enter-active,
  .help-modal-leave-active,
  .help-modal-enter-active .help-modal-panel,
  .help-modal-leave-active .help-modal-panel {
    transition: none;
  }
}

@media (max-width: 768px) {
  .help-modal-panel {
    max-height: 85vh;
  }
}
</style>
