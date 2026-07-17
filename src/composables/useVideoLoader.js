import { ref } from "vue"

// Deixa o <video> usar o src diretamente: o navegador faz streaming
// com range requests em vez de baixar o arquivo inteiro como blob antes de tocar.
export function useVideoLoader() {

  const videoSrc = ref(null)
  const loading = ref(true)

  const loadVideo = (src) => {
    videoSrc.value = src
    loading.value = false
  }

  return {
    videoSrc,
    loading,
    loadVideo
  }
}