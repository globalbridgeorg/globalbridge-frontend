import { ref, computed } from 'vue'

// Versão compartilhada entre todas as instâncias: qualquer setTokens/clearTokens
// invalida o `isLoggedIn` computed de todo mundo (Header, Footer, etc.), sem
// precisar de truques como ler `route.fullPath` só pra forçar recomputo.
const tokenVersion = ref(0)

function readToken(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

export function useAuth() {
  const isLoggedIn = computed(() => {
    tokenVersion.value
    return !!readToken('access_token')
  })

  function setTokens({ access, refresh }, persist) {
    const storage = persist ? localStorage : sessionStorage
    storage.setItem('access_token', access)
    storage.setItem('refresh_token', refresh)
    tokenVersion.value++
  }

  function clearTokens() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    tokenVersion.value++
  }

  function getAccessToken() {
    return readToken('access_token')
  }

  function getRefreshToken() {
    return readToken('refresh_token')
  }

  return { isLoggedIn, setTokens, clearTokens, getAccessToken, getRefreshToken }
}
