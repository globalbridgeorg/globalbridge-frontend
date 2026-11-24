import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.')
}

const KEEP_LOGGED_KEY = 'gb_keep_logged'

export function setKeepLogged(keep) {
  try {
    if (keep) {
      localStorage.setItem(KEEP_LOGGED_KEY, '1')
    } else {
      localStorage.removeItem(KEEP_LOGGED_KEY)
    }
  } catch {
    // storage indisponível
  }
}

// Armazena sessão em localStorage quando "Manter conectado" está ativo, ou em
// sessionStorage no login temporário — sempre lendo dos dois pra não perder sessão.
const authStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      const keep = localStorage.getItem(KEEP_LOGGED_KEY) === '1'
      const destino = keep ? localStorage : sessionStorage
      const outro = keep ? sessionStorage : localStorage
      destino.setItem(key, value)
      outro.removeItem(key)
    } catch {
      // ignora em ambiente sem storage
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      // ignora
    }
  },
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
})
