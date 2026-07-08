import axios from 'axios'
import router from '@/router'

const normalizeBaseUrl = (url) => {
  if (!url) return url
  let normalized = url.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`
  }
  return normalized
}

const getStoredValue = (key) => {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
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
    const token = getStoredValue('access_token')
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

      const refreshToken = getStoredValue('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        router.push({ name: 'login' })
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('/token/refresh/', { refresh: refreshToken })
        const newAccessToken = data.access
        localStorage.setItem('access_token', newAccessToken)
        sessionStorage.setItem('access_token', newAccessToken)
        processQueue(null, newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axios(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
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
