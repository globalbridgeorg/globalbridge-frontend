const ACCESS_KEY = 'gb_access_token'
const REFRESH_KEY = 'gb_refresh_token'
const KEEP_LOGGED_KEY = 'gb_keep_logged'

function normalizarApiBase() {
  const raw = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || '').trim().replace(/\/+$/, '')
  if (raw) {
    const comProtocolo = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    return comProtocolo.endsWith('/api') ? comProtocolo : `${comProtocolo}/api`
  }
  return '/api'
}

export const API_BASE = normalizarApiBase()

const authListeners = new Set()

export function onAuthChange(callback) {
  authListeners.add(callback)
  return {
    unsubscribe: () => authListeners.delete(callback),
  }
}

export function emitAuthChange(event) {
  for (const cb of authListeners) {
    try {
      cb(event)
    } catch {
      // ignora erro isolado de listener
    }
  }
}

export function setKeepLogged(keep) {
  try {
    localStorage.setItem(KEEP_LOGGED_KEY, keep ? '1' : '0')
  } catch {
    // storage indisponível
  }
}

function preferLocalStorage() {
  try {
    return localStorage.getItem(KEEP_LOGGED_KEY) === '1'
  } catch {
    return true
  }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY) || ''
  } catch {
    return ''
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY) || ''
  } catch {
    return ''
  }
}

export function hasStoredSession() {
  return Boolean(getAccessToken() || getRefreshToken())
}

export function setTokens({ access, refresh }, keepLogged = null) {
  if (keepLogged !== null) setKeepLogged(keepLogged)
  const target = preferLocalStorage() ? localStorage : sessionStorage
  const other = preferLocalStorage() ? sessionStorage : localStorage
  try {
    if (access) {
      target.setItem(ACCESS_KEY, access)
      other.removeItem(ACCESS_KEY)
    }
    if (refresh) {
      target.setItem(REFRESH_KEY, refresh)
      other.removeItem(REFRESH_KEY)
    }
  } catch {
    // storage indisponível
  }
}

export function clearTokens() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      store.removeItem(ACCESS_KEY)
      store.removeItem(REFRESH_KEY)
    } catch {
      // ignora
    }
  }
}

function extrairMensagemErro(data, fallback) {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return String(data.non_field_errors[0])
  }
  for (const val of Object.values(data)) {
    if (typeof val === 'string' && val.trim()) return val
    if (Array.isArray(val) && val.length) return String(val[0])
  }
  return fallback
}

let refreshInFlight = null

async function renovarAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) return null
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = fetch(`${API_BASE}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh }),
  })
    .then(async (resp) => {
      if (!resp.ok) throw new Error('Refresh expirado')
      const data = await resp.json()
      if (!data?.access) throw new Error('Refresh inválido')
      setTokens({ access: data.access })
      return data.access
    })
    .catch(() => {
      clearTokens()
      emitAuthChange('SIGNED_OUT')
      return null
    })
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

export async function apiRequest(path, { method = 'GET', body, formData, auth = true, retry = true } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const headers = { Accept: 'application/json' }

  if (auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let payload
  if (formData !== undefined) {
    payload = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const resp = await fetch(url, { method, headers, body: payload })

  if (resp.status === 401 && auth && retry && !path.includes('/token/') && getRefreshToken()) {
    const novoToken = await renovarAccessToken()
    if (novoToken) {
      return apiRequest(path, { method, body, formData, auth, retry: false })
    }
  }

  if (resp.status === 204) return null

  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await resp.json().catch(() => null)
    : await resp.text().catch(() => null)

  if (!resp.ok) {
    const msg = extrairMensagemErro(data, `Erro HTTP ${resp.status}`)
    const err = new Error(msg)
    err.status = resp.status
    err.data = data
    throw err
  }

  return data
}
