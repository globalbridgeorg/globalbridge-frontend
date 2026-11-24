import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const isInstallable = ref(false)

export function usePWA() {
  onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e
      isInstallable.value = true
    })

    window.addEventListener('appinstalled', () => {
      isInstallable.value = false
      deferredPrompt.value = null
    })
  })

  const installPWA = async () => {
    if (!deferredPrompt.value) return

    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    
    if (outcome === 'accepted') {
      isInstallable.value = false
      deferredPrompt.value = null
    }
  }

  return {
    isInstallable,
    installPWA
  }
}