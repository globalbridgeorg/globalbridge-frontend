import axios from 'axios'
import router from '@/router'
import { useAuth } from '@/composables/useAuth'

const { getAccessToken, getRefreshToken, setTokens, clearTokens } = useAuth()

const normalizeBaseUrl = (url) => {
  if (!url) return url
  let normalized = url.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`
  }
  return normalized
}

const getBaseUrl = () => {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_BASE_URL)
  if (import.meta.env.PROD) {
    if (envUrl) {
      return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
    }
    return 'https://globalbridge-backend-production.up.railway.app/api'
  }

  // Local development uses relative API path so Vite proxy can forward to the local backend.
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  }
  return '/api'
}

axios.defaults.baseURL = getBaseUrl()

axios.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Não tenta refresh para rotas de autenticação (login/refresh)
    const isAuthRoute = originalRequest.url?.includes('/token')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axios(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        isRefreshing = false
        clearTokens()
        router.push({ name: 'login' })
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('/token/refresh/', { refresh: refreshToken })
        const newAccessToken = data.access
        // Mantém o token na mesma storage onde já estava (persiste se estava em localStorage)
        setTokens({ access: newAccessToken, refresh: refreshToken }, !!localStorage.getItem('access_token'))
        processQueue(null, newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axios(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        router.push({ name: 'login' })
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default axios
