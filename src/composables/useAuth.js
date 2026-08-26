import { useRouter } from 'vue-router'

// Limpa os tokens dos dois storages (localStorage do "manter conectado" e
// sessionStorage do login normal) e manda pro login — usado tanto no
// perfil de estudante quanto nas telas de conta business (painel/editor).
export function useAuth() {
  const router = useRouter()

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    router.push({ name: 'login' })
  }

  return { logout }
}
