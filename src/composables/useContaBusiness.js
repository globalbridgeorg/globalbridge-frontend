import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'

const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

// Checagem comum ao painel e ao editor business: precisa estar logado,
// ser conta "agencia" e já ter a agência aprovada (senão vai pra tela de
// análise). Só depois disso chama carregarDados(agenciaId) da tela.
export function useContaBusiness(mensagemErro) {
  const router = useRouter()
  const carregando = ref(true)
  const erro = ref('')

  async function carregarConta(carregarDados) {
    carregando.value = true
    erro.value = ''

    if (!getStoredToken()) {
      router.replace({ name: 'login' })
      return
    }

    try {
      const { data: eu } = await axios.get('/usuarios/me/')
      if (eu.tipo !== 'agencia') {
        erro.value = 'Essa área é só pra contas business verificadas.'
        return
      }
      if (!eu.agencia_id) {
        router.replace({ name: 'business-analise' })
        return
      }
      await carregarDados(eu.agencia_id)
    } catch (e) {
      console.error('Erro ao carregar painel business:', e)
      erro.value = mensagemErro
    } finally {
      carregando.value = false
    }
  }

  return { carregando, erro, carregarConta }
}
