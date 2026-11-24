<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { getMinhaSolicitacaoAgencia } from '@/services/api'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { useContaAtual } from '@/composables/useContaAtual'

const { estado: conta, carregarConta } = useContaAtual()

const viewRef = ref(null)
let ctx

const carregando = ref(true)
const erro = ref(false)
const precisaLogin = ref(false)
const solicitacao = ref(null)

function animarEntrada() {
  if (prefersReducedMotion() || !viewRef.value) return
  ctx?.revert()
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } })
    const icone = viewRef.value.querySelector('.icone-status')
    if (icone) tl.from(icone, { opacity: 0, y: 14, duration: 0.45 })
    tl.from('.eyebrow, .gb-heading, .desc, .estado-tela > *', {
      opacity: 0,
      y: 16,
      duration: 0.45,
      stagger: 0.07,
    }, icone ? '-=0.25' : 0)
    const etapas = viewRef.value.querySelectorAll('.etapa')
    if (etapas.length) {
      tl.from(etapas, { opacity: 0, x: -16, duration: 0.42, stagger: 0.1 }, '-=0.2')
    }
    const acoes = viewRef.value.querySelector('.acoes')
    if (acoes) {
      tl.from(acoes, { opacity: 0, y: 12, duration: 0.35 }, '-=0.18')
    }
  }, viewRef.value)
}

async function carregar() {
  carregando.value = true
  erro.value = false
  precisaLogin.value = false

  const atual = await carregarConta(true)
  if (!atual.logado) {
    precisaLogin.value = true
    carregando.value = false
    await nextTick()
    animarEntrada()
    return
  }

  try {
    const data = await getMinhaSolicitacaoAgencia()
    if (!data) {
      erro.value = true
    } else {
      solicitacao.value = data
    }
  } catch (e) {
    console.error('Erro ao buscar status da solicitação:', e)
    erro.value = true
  } finally {
    carregando.value = false
    await nextTick()
    animarEntrada()
  }
}

const dataFormatada = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''

onMounted(carregar)
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="viewRef" class="analise-view gb-section">
    <div v-if="carregando" class="estado-tela">Carregando status do seu pedido...</div>

    <div v-else-if="precisaLogin" class="estado-tela">
      <h1 class="gb-heading">Acompanhar<br />solicitação</h1>
      <p>Entre com a conta criada no seu pedido de verificação para acompanhar o status.</p>
      <router-link to="/login" class="link-acao">Ir para o login</router-link>
      <router-link to="/business/solicitar" class="link-acao-secundaria">Ainda não enviou pedido? Solicitar verificação</router-link>
    </div>

    <div v-else-if="erro" class="estado-tela">
      <h1 class="gb-heading">Nenhum pedido<br />encontrado</h1>
      <p>Não encontramos nenhum pedido de verificação associado à sua conta.</p>
      <router-link v-if="conta.tipo === 'agencia'" to="/business" class="link-acao">Abrir painel da agência</router-link>
      <router-link v-else to="/business/solicitar" class="link-acao">Fazer um novo pedido</router-link>
    </div>

    <template v-else-if="solicitacao">
      <div class="icone-status" :class="solicitacao.status">
        <svg v-if="solicitacao.status === 'pendente'" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
        <svg v-else-if="solicitacao.status === 'aprovado'" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/></svg>
        <svg v-else width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
      </div>

      <span class="eyebrow">{{ solicitacao.nome }}</span>

      <h1 v-if="solicitacao.status === 'pendente'" class="gb-heading">Seu pedido está<br />em análise</h1>
      <h1 v-else-if="solicitacao.status === 'aprovado'" class="gb-heading">Sua agência<br />foi aprovada!</h1>
      <h1 v-else class="gb-heading">Seu pedido não<br />foi aprovado</h1>

      <p v-if="solicitacao.status === 'pendente'" class="desc">
        Recebemos tudo certinho e alguém do nosso time vai conferir os dados. A análise costuma levar até 5 dias úteis — não precisa ficar atualizando essa página.
      </p>
      <p v-else-if="solicitacao.status === 'aprovado'" class="desc">
        Sua conta business já foi liberada! Você já pode acessar o painel da sua agência para editar dados, cadastrar programas e montar sua página pública.
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
        <router-link v-if="solicitacao.status === 'aprovado'" :to="conta.logado ? '/business' : '/login'" class="link-acao">
          {{ conta.logado ? 'Abrir painel da agência' : 'Ir pro login' }}
        </router-link>
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
  min-height: calc(100dvh - 220px);
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  color: var(--gb-green);
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

@media (max-width: 768px) {
  .analise-view {
    padding: 16px 16px 72px;
  }
}
</style>
