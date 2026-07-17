import { ref, onMounted, onUnmounted, computed } from "vue"

export function useScrollAnimation(endScroll = 600) {
  const scrollY = ref(0)
  let ticking = false

  const updateScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      scrollY.value = window.scrollY
      ticking = false
    })
  }

  onMounted(() => window.addEventListener("scroll", updateScroll, { passive: true }))
  onUnmounted(() => window.removeEventListener("scroll", updateScroll))

  const videoStyle = computed(() => {
    const rawP = Math.min(Math.max(scrollY.value / endScroll, 0), 1)

    const p = Math.min(rawP, 0.6) 

    return {
      transform: `scale(${1 - p * 0.25})`,
      borderRadius: `${p * 70}px`,
      width: `${100 - p * 15}%`,
    }
  })

  return { videoStyle }
}