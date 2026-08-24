
import Lenis from '@studio-freight/lenis'

let lenisInstance = null

export const initSmoothScroll = () => {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  })

  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)

  lenisInstance = lenis
  return lenis
}

// Rola até um elemento (ou seletor) respeitando o smooth scroll do Lenis,
// com fallback nativo caso o Lenis ainda não tenha sido inicializado
// (ex.: navegação para a home vinda de outra rota).
export const scrollToTarget = (target, options = {}) => {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return

  if (lenisInstance) {
    lenisInstance.scrollTo(el, { offset: -96, duration: 1.4, ...options })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Volta pro topo ao trocar de página. Precisa passar pelo Lenis (em vez de
// window.scrollTo) porque ele mantém seu próprio estado de scroll e
// recoloca a página onde estava a cada frame, sobrescrevendo qualquer
// scrollTo nativo.
//
// A duração aqui (0.32s) é praticamente a mesma da transição de zoom com
// blur em App.vue (~0.2-0.36s) de propósito: antes esse scroll rolava
// sozinho em 0.9s, bem mais devagar que o blur/fade — a transição visual
// terminava rápido e a página continuava "subindo" por conta própria por
// baixo, descolada dela, o que parecia travamento em vez de uma
// transição só. Casando as duas durações, o "subir" acontece junto com o
// blur e some no mesmo instante que ele, como uma coisa só.
export const resetScroll = () => {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { duration: 0.32, easing: (t) => 1 - Math.pow(1 - t, 3) })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
