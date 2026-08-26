<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/services/axios'

const route = useRoute()

const carregando = ref(true)
const erro = ref(false)
const solicitacao = ref(null)

const solicitacaoId = computed(() => route.query.id || localStorage.getItem('solicitacao_agencia_id'))
const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

async function carregar() {
  carregando.value = true
  erro.value = false

  // Caminho principal: quem já tem conta (criada junto com o pedido, ou
  // uma conta business mais antiga) só precisa estar logado — não
  // depende de guardar um link. O id na URL/localStorage é só um atalho
  // pra logo depois de enviar o formulário, antes de qualquer coisa.
  if (getStoredToken()) {
    try {
      const { data } = await axios.get('/solicitacoes-agencia/minha/')
      solicitacao.value = data
      carregando.value = false
      return
    } catch (e) {
      // 404 aqui é normal pra quem nunca passou por esse fluxo (ex.:
      // agência seed, sem SolicitacaoAgencia) — cai pro fallback por id.
    }
  }

  if (!solicitacaoId.value) {
    erro.value = true
    carregando.value = false
    return
  }

  try {
    const { data } = await axios.get(`/solicitacoes-agencia/${solicitacaoId.value}/`)
    solicitacao.value = data
  } catch (e) {
    console.error('Erro ao buscar status da solicitação:', e)
    erro.value = true
  } finally {
    carregando.value = false
  }
}

const dataFormatada = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''

onMounted(carregar)
</script>

<template>
  <div class="analise-view gb-section">
    <div v-if="carregando" class="estado-tela">Carregando status do seu pedido...</div>

    <div v-else-if="erro" class="estado-tela">
      <p>Não encontramos nenhum pedido de verificação associado a esse link.</p>
      <router-link to="/business/solicitar" class="link-acao">Fazer um novo pedido</router-link>
    </div>

    <template v-else-if="solicitacao">
      <div class="icone-status" :class="solicitacao.status">
        <svg v-if="solicitacao.status === 'pendente'" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
        <svg v-else-if="solicitacao.status === 'aprovado'" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/></svg>
        <svg v-else width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
      </div>

      <span class="eyebrow">{{ solicitacao.nome }}</span>

      <h1 v-if="solicitacao.status === 'pendente'" class="gb-heading">Seu pedido está<br />em análise</h1>
      <h1 v-else-if="solicitacao.status === 'aprovado'" class="gb-heading">Sua agência<br />foi aprovada!</h1>
      <h1 v-else class="gb-heading">Seu pedido não<br />foi aprovado</h1>

      <p v-if="solicitacao.status === 'pendente'" class="desc">
        Recebemos tudo certinho e um alguém do nosso time vai conferir os dados. A análise costuma levar até 5 dias úteis — não precisa ficar atualizando essa página.
      </p>
      <p v-else-if="solicitacao.status === 'aprovado'" class="desc">
        Sua conta business já foi criada e um e-mail de confirmação foi enviado pra você. Já pode logar com o e-mail e a senha que você escolheu no pedido.
      </p>
      <p v-else class="desc">
        {{ solicitacao.motivo_recusa || 'Não conseguimos aprovar o pedido com as informações enviadas.' }}
      </p>

      <div class="linha-tempo">
        <div class="etapa">
          <span class="ponto feito"></span>
          <div><strong>Pedido enviado</strong><span class="quando">{{ dataFormatada(solicitacao.criado_em) }}</span></div>
        </div>
        <div class="etapa">
          <span class="ponto" :class="{ feito: solicitacao.status !== 'pendente' }"></span>
          <div>
            <strong v-if="solicitacao.status === 'pendente'">Verificando documentos e site oficial</strong>
            <strong v-else-if="solicitacao.status === 'aprovado'">Conta business liberada</strong>
            <strong v-else>Pedido recusado</strong>
            <span class="quando">{{ solicitacao.revisado_em ? dataFormatada(solicitacao.revisado_em) : 'Em andamento' }}</span>
          </div>
        </div>
      </div>

      <div class="acoes">
        <router-link v-if="solicitacao.status === 'aprovado'" to="/login" class="link-acao">Ir pro login</router-link>
        <router-link v-else-if="solicitacao.status === 'recusado'" to="/business/solicitar" class="link-acao">Enviar um novo pedido</router-link>
        <router-link v-else to="/contato" class="link-acao-secundaria">Precisa corrigir alguma informação? Fale com a gente</router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
.analise-view {
  padding: 120px 5% 90px;
  max-width: 560px;
  text-align: center;
}

.estado-tela {
  padding: 80px 0;
  color: var(--gb-ink-soft);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.icone-status {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  background: rgba(176, 31, 176, 0.1);
  color: var(--gb-magenta-strong);
}

.icone-status.aprovado {
  background: rgba(61, 154, 75, 0.12);
  color: #3D9A4B;
}

.icone-status.recusado {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-mauve);
}

.gb-heading {
  margin: 12px 0 12px;
  font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2.2rem);
}

.desc {
  font-size: 1rem;
  color: var(--gb-ink-soft);
  line-height: 1.6;
  margin-bottom: 40px;
}

.linha-tempo {
  text-align: left;
  margin-bottom: 32px;
}

.etapa {
  display: flex;
  gap: 16px;
  padding: 18px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.etapa:last-child {
  border-bottom: 1px solid var(--gb-purple-deep-16);
}

.ponto {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gb-purple-deep-16);
  flex-shrink: 0;
  margin-top: 2px;
}

.ponto.feito {
  background: var(--gb-magenta);
}

.etapa strong {
  display: block;
  font-size: 0.92rem;
  color: var(--gb-dark);
}

.quando {
  font-size: 0.8rem;
  color: var(--gb-ink-faint);
}

.acoes {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.link-acao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 28px;
  background: var(--gb-dark);
  color: #fff;
  border-radius: 12px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
}

.link-acao-secundaria {
  font-size: 0.85rem;
  color: var(--gb-magenta);
  font-weight: 600;
}
</style>
