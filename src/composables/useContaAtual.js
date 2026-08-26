import { reactive } from 'vue'
import axios from '@/services/axios'

// Estado compartilhado — evita chamar /usuarios/me/ de novo toda vez que
// o header/tabbar re-renderiza. É assim que o menu sabe se deve mandar
// "Perfil" pra /profile (estudante) ou /business (conta business), em
// vez de sempre assumir estudante.
const estado = reactive({ tipo: null, carregando: false, carregado: false })

const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

export function useContaAtual() {
  async function carregarConta() {
    if (!getStoredToken() || estado.carregado || estado.carregando) return
    estado.carregando = true
    try {
      const { data } = await axios.get('/usuarios/me/')
      estado.tipo = data.tipo
      estado.carregado = true
    } catch (e) {
      // Token inválido/expirado — deixa o interceptor do axios cuidar do
      // redirect pro login, aqui só não trava o menu.
    } finally {
      estado.carregando = false
    }
  }

  function resetarConta() {
    estado.tipo = null
    estado.carregado = false
  }

  return { estado, carregarConta, resetarConta }
}
