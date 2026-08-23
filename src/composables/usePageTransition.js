import { ref } from 'vue'

// Estado global do "corte diagonal" entre páginas — compartilhado pelo
// PageWipeOverlay.vue (que desenha a faixa) e pelos guards do router
// (que decidem quando ligar/desligar).
export const sweeping = ref(false)

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
