
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

// Volta pro topo instantaneamente ao trocar de página. Precisa passar pelo
// Lenis (em vez de window.scrollTo) porque ele mantém seu próprio estado de
// scroll e recoloca a página onde estava a cada frame, sobrescrevendo
// qualquer scrollTo nativo.
export const resetScroll = () => {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: true })
  } else {
    window.scrollTo(0, 0)
  }
}
