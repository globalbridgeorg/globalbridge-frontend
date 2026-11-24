import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { carregarConta as carregarContaAtual } from '@/composables/useContaAtual'
import { getMinhaSolicitacaoAgencia } from '@/services/api'

// Checagem comum ao painel e ao editor business: precisa estar logado e já ter
// agência aprovada; se tiver pedido em análise/recusado, redireciona pro status.
export function useContaBusiness(mensagemErro) {
  const router = useRouter()
  const carregando = ref(true)
  const erro = ref('')

  async function carregarConta(carregarDados) {
    carregando.value = true
    erro.value = ''

    try {
      const eu = await carregarContaAtual(true)
      if (!eu.logado) {
        router.replace({ name: 'login' })
        return
      }
      if (!eu.agencia_id) {
        const pedido = await getMinhaSolicitacaoAgencia().catch(() => null)
        if (pedido) {
          router.replace({ name: 'business-analise' })
          return
        }
        erro.value = 'Essa área é só pra contas business verificadas.'
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
