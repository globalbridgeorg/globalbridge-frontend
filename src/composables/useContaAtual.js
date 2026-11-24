import { reactive } from 'vue'
import { supabase } from '@/services/supabase'
import { getContaAtual } from '@/services/api'

const estado = reactive({
  logado: false,
  carregando: false,
  carregado: false,
  id: null,
  email: '',
  username: '',
  name: '',
  avatar_url: '',
  tipo: null,
  agencia_id: null,
  is_admin: false,
})

let promessaEmAndamento = null

function limparDados() {
  estado.logado = false
  estado.id = null
  estado.email = ''
  estado.username = ''
  estado.name = ''
  estado.avatar_url = ''
  estado.tipo = null
  estado.agencia_id = null
  estado.is_admin = false
}

function preencher(conta) {
  if (!conta) {
    limparDados()
    return
  }
  estado.logado = true
  estado.id = conta.id
  estado.email = conta.email
  estado.username = conta.username
  estado.name = conta.name
  estado.avatar_url = conta.avatar_url
  estado.tipo = conta.tipo
  estado.agencia_id = conta.agencia_id
  estado.is_admin = conta.is_admin
}

export async function carregarConta(forcar = false) {
  if (!forcar && estado.carregado) return estado
  if (promessaEmAndamento && !forcar) return promessaEmAndamento

  estado.carregando = true
  promessaEmAndamento = getContaAtual()
    .then((conta) => {
      preencher(conta)
      estado.carregado = true
      return estado
    })
    .catch(() => {
      limparDados()
      estado.carregado = true
      return estado
    })
    .finally(() => {
      estado.carregando = false
      promessaEmAndamento = null
    })

  return promessaEmAndamento
}

export function resetarConta() {
  limparDados()
  estado.carregado = false
}

// Mantém o estado sincronizado com qualquer login/logout/refresh do Supabase Auth
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    limparDados()
    estado.carregado = true
  } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
    carregarConta(true)
  }
})

export function useContaAtual() {
  return { estado, carregarConta, resetarConta }
}
