import { useRouter } from 'vue-router'
import { signOutConta } from '@/services/api'
import { resetarConta } from '@/composables/useContaAtual'
import { resetarFavoritos } from '@/composables/useFavoritos'

export function useAuth() {
  const router = useRouter()

  async function logout() {
    try {
      await signOutConta()
    } catch {
      // mesmo se falhar rede, limpa estado local
    }
    resetarConta()
    resetarFavoritos()
    router.push({ name: 'login' })
  }

  return { logout }
}
