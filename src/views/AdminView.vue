<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getAdminDados,
  getDocumentoAssinadoUrl,
  aprovarSolicitacaoAgencia,
  recusarSolicitacaoAgencia,
  aprovarPaisAdicional,
  recusarPaisAdicional,
  marcarMensagemLida,
} from '@/services/api'
import { useContaAtual } from '@/composables/useContaAtual'
import { useAuth } from '@/composables/useAuth'
import { sanitizarUrl } from '@/utils/url'
import { formatarData } from '@/components/business/formatarData'

const router = useRouter()
const { estado: conta, carregarConta } = useContaAtual()
const { logout } = useAuth()

const carregando = ref(true)
const erro = ref('')
const feedback = ref('')
const aba = ref('agencias')

const solicitacoesAgencia = ref([])
const solicitacoesPais = ref([])
const mensagens = ref([])

const processandoId = ref(null)
const recusandoChave = ref(null)
const motivoRecusa = ref('')

const pendentesAgencias = computed(() => solicitacoesAgencia.value.filter((s) => s.status === 'pendente').length)
const pendentesPaises = computed(() => solicitacoesPais.value.filter((s) => s.status === 'pendente').length)
const mensagensNaoLidas = computed(() => mensagens.value.filter((m) => !m.lida).length)

async function carregarTudo() {
  erro.value = ''
  try {
    const dados = await getAdminDados()
    solicitacoesAgencia.value = dados.solicitacoesAgencia
    solicitacoesPais.value = dados.solicitacoesPais
    mensagens.value = dados.mensagens
  } catch (e) {
    console.error('Erro ao carregar dados do admin:', e)
    erro.value = 'Não foi possível carregar os dados administrativos agora.'
  }
}

async function abrirDocumento(path) {
  erro.value = ''
  try {
    const url = await getDocumentoAssinadoUrl(path)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (e) {
    console.error('Erro ao abrir documento:', e)
    erro.value = 'Não foi possível gerar o link do comprovante.'
  }
}

async function aprovarAgencia(sol) {
  processandoId.value = `ag-${sol.id}`
  erro.value = ''
  feedback.value = ''
  try {
    await aprovarSolicitacaoAgencia(sol.id)
    feedback.value = `Agência "${sol.nome}" aprovada e conta business liberada.`
    await carregarTudo()
  } catch (e) {
    console.error('Erro ao aprovar solicitação:', e)
    erro.value = e?.message || 'Não foi possível aprovar a solicitação.'
  } finally {
    processandoId.value = null
  }
}

function iniciarRecusa(chave) {
  recusandoChave.value = chave
  motivoRecusa.value = ''
}

function cancelarRecusa() {
  recusandoChave.value = null
  motivoRecusa.value = ''
}

async function confirmarRecusaAgencia(sol) {
  processandoId.value = `ag-${sol.id}`
  erro.value = ''
  feedback.value = ''
  try {
    await recusarSolicitacaoAgencia(sol.id, motivoRecusa.value.trim())
    cancelarRecusa()
    feedback.value = `Solicitação de "${sol.nome}" recusada.`
    await carregarTudo()
  } catch (e) {
    console.error('Erro ao recusar solicitação:', e)
    erro.value = e?.message || 'Não foi possível recusar a solicitação.'
  } finally {
    processandoId.value = null
  }
}

async function aprovarPais(sol) {
  processandoId.value = `pais-${sol.id}`
  erro.value = ''
  feedback.value = ''
  try {
    await aprovarPaisAdicional(sol.id)
    feedback.value = `País ${sol.pais?.nome || ''} liberado para ${sol.agencia?.nome || 'a agência'}.`
    await carregarTudo()
  } catch (e) {
    console.error('Erro ao aprovar país adicional:', e)
    erro.value = e?.message || 'Não foi possível aprovar o país adicional.'
  } finally {
    processandoId.value = null
  }
}

async function confirmarRecusaPais(sol) {
  processandoId.value = `pais-${sol.id}`
  erro.value = ''
  feedback.value = ''
  try {
    await recusarPaisAdicional(sol.id, motivoRecusa.value.trim())
    cancelarRecusa()
    feedback.value = `Solicitação de país recusada.`
    await carregarTudo()
  } catch (e) {
    console.error('Erro ao recusar país adicional:', e)
    erro.value = e?.message || 'Não foi possível recusar a solicitação.'
  } finally {
    processandoId.value = null
  }
}

async function alternarLida(msg) {
  processandoId.value = `msg-${msg.id}`
  try {
    const novo = !msg.lida
    await marcarMensagemLida(msg.id, novo)
    msg.lida = novo
  } catch (e) {
    console.error('Erro ao atualizar mensagem:', e)
    erro.value = 'Não foi possível atualizar o status da mensagem.'
  } finally {
    processandoId.value = null
  }
}

onMounted(async () => {
  const atual = await carregarConta(true)
  if (!atual.logado) {
    router.replace({ name: 'login' })
    return
  }
  if (atual.is_admin) {
    await carregarTudo()
  }
  carregando.value = false
})
</script>

<template>
  <div class="admin-page">
    <div class="top-banner"><span>Painel administrativo</span></div>

    <div class="content gb-section">
      <div v-if="carregando" class="estado-caixa">Carregando painel administrativo...</div>

      <div v-else-if="!conta.is_admin" class="estado-caixa estado-erro">
        <p>Acesso restrito a administradores da GlobalBridge.</p>
        <router-link :to="conta.tipo === 'agencia' ? '/business' : '/profile'" class="link-voltar">
          Voltar para minha conta
        </router-link>
      </div>

      <template v-else>
        <div class="admin-header">
          <div>
            <h1>Moderação GlobalBridge</h1>
            <p>Aprove novas agências, libere países adicionais e acompanhe mensagens de contato.</p>
          </div>
          <div class="admin-header-acoes">
            <button type="button" class="btn-sec" @click="carregarTudo">Atualizar</button>
            <button type="button" class="btn-sec btn-sec--danger" @click="logout">Sair</button>
          </div>
        </div>

        <p v-if="erro" class="alerta alerta--erro" role="alert">{{ erro }}</p>
        <p v-if="feedback" class="alerta alerta--ok" role="status">{{ feedback }}</p>

        <div class="tabs" role="tablist">
          <button type="button" role="tab" :aria-selected="aba === 'agencias'" class="tab-btn" :class="{ active: aba === 'agencias' }" @click="aba = 'agencias'">
            Agências
            <span v-if="pendentesAgencias" class="badge-count">{{ pendentesAgencias }}</span>
          </button>
          <button type="button" role="tab" :aria-selected="aba === 'paises'" class="tab-btn" :class="{ active: aba === 'paises' }" @click="aba = 'paises'">
            Países adicionais
            <span v-if="pendentesPaises" class="badge-count">{{ pendentesPaises }}</span>
          </button>
          <button type="button" role="tab" :aria-selected="aba === 'mensagens'" class="tab-btn" :class="{ active: aba === 'mensagens' }" @click="aba = 'mensagens'">
            Mensagens de contato
            <span v-if="mensagensNaoLidas" class="badge-count">{{ mensagensNaoLidas }}</span>
          </button>
        </div>

        <!-- Aba 1: Solicitações de Agência -->
        <section v-if="aba === 'agencias'" role="tabpanel" aria-label="Solicitações de Agências" class="lista">
          <p v-if="!solicitacoesAgencia.length" class="vazio">Nenhuma solicitação de agência registrada.</p>
          <article v-for="sol in solicitacoesAgencia" :key="sol.id" class="item-card">
            <div class="item-top">
              <div>
                <div class="item-titulo-row">
                  <h2>{{ sol.nome }}</h2>
                  <span class="status-pill" :class="`status-${sol.status}`">{{ sol.status }}</span>
                </div>
                <p class="item-meta">
                  {{ sol.cidade }}<template v-if="sol.pais_sede?.nome">, {{ sol.pais_sede.nome }}</template>
                  <template v-if="sol.ano_fundacao"> · fundada em {{ sol.ano_fundacao }}</template>
                  · enviada em {{ formatarData(sol.criado_em) }}
                </p>
              </div>
              <button v-if="sol.documento_path" type="button" class="btn-sec" @click="abrirDocumento(sol.documento_path)">
                Ver comprovante
              </button>
            </div>

            <div class="item-detalhes">
              <span><strong>Responsável:</strong> {{ sol.nome_responsavel }} <template v-if="sol.cargo_responsavel">({{ sol.cargo_responsavel }})</template></span>
              <span><strong>E-mail:</strong> {{ sol.email_responsavel }}</span>
              <span v-if="sanitizarUrl(sol.site)">
                <strong>Site:</strong>
                <a :href="sanitizarUrl(sol.site)" target="_blank" rel="noopener noreferrer">{{ sol.site }}</a>
              </span>
            </div>

            <p v-if="sol.descricao" class="item-texto">{{ sol.descricao }}</p>
            <p v-if="sol.motivo_recusa" class="item-motivo"><strong>Motivo da recusa:</strong> {{ sol.motivo_recusa }}</p>

            <div v-if="sol.status === 'pendente'" class="item-acoes">
              <template v-if="recusandoChave === `ag-${sol.id}`">
                <input v-model="motivoRecusa" type="text" class="inp-motivo" aria-label="Motivo da recusa" placeholder="Motivo da recusa (opcional)" />
                <button type="button" class="btn-danger" :disabled="processandoId === `ag-${sol.id}`" @click="confirmarRecusaAgencia(sol)">Confirmar recusa</button>
                <button type="button" class="btn-sec" @click="cancelarRecusa">Cancelar</button>
              </template>
              <template v-else>
                <button type="button" class="btn-aprovar" :disabled="processandoId === `ag-${sol.id}`" @click="aprovarAgencia(sol)">
                  {{ processandoId === `ag-${sol.id}` ? 'Aprovando...' : 'Aprovar agência' }}
                </button>
                <button type="button" class="btn-danger-outline" :disabled="processandoId === `ag-${sol.id}`" @click="iniciarRecusa(`ag-${sol.id}`)">
                  Recusar
                </button>
              </template>
            </div>
          </article>
        </section>

        <!-- Aba 2: Países Adicionais -->
        <section v-else-if="aba === 'paises'" role="tabpanel" aria-label="Países adicionais" class="lista">
          <p v-if="!solicitacoesPais.length" class="vazio">Nenhuma solicitação de país adicional.</p>
          <article v-for="sol in solicitacoesPais" :key="sol.id" class="item-card">
            <div class="item-top">
              <div>
                <div class="item-titulo-row">
                  <h2>{{ sol.agencia?.nome || 'Agência' }} → {{ sol.pais?.nome || 'País' }}</h2>
                  <span class="status-pill" :class="`status-${sol.status}`">{{ sol.status }}</span>
                </div>
                <p class="item-meta">Pedido em {{ formatarData(sol.criado_em) }}</p>
              </div>
            </div>

            <p v-if="sol.motivo_recusa" class="item-motivo"><strong>Motivo da recusa:</strong> {{ sol.motivo_recusa }}</p>

            <div v-if="sol.status === 'pendente'" class="item-acoes">
              <template v-if="recusandoChave === `pais-${sol.id}`">
                <input v-model="motivoRecusa" type="text" class="inp-motivo" aria-label="Motivo da recusa" placeholder="Motivo da recusa (opcional)" />
                <button type="button" class="btn-danger" :disabled="processandoId === `pais-${sol.id}`" @click="confirmarRecusaPais(sol)">Confirmar recusa</button>
                <button type="button" class="btn-sec" @click="cancelarRecusa">Cancelar</button>
              </template>
              <template v-else>
                <button type="button" class="btn-aprovar" :disabled="processandoId === `pais-${sol.id}`" @click="aprovarPais(sol)">
                  {{ processandoId === `pais-${sol.id}` ? 'Aprovando...' : 'Aprovar país' }}
                </button>
                <button type="button" class="btn-danger-outline" :disabled="processandoId === `pais-${sol.id}`" @click="iniciarRecusa(`pais-${sol.id}`)">
                  Recusar
                </button>
              </template>
            </div>
          </article>
        </section>

        <!-- Aba 3: Mensagens de Contato -->
        <section v-else role="tabpanel" aria-label="Mensagens de contato" class="lista">
          <p v-if="!mensagens.length" class="vazio">Nenhuma mensagem de contato recebida ainda.</p>
          <article v-for="msg in mensagens" :key="msg.id" class="item-card" :class="{ 'item-nao-lida': !msg.lida }">
            <div class="item-top">
              <div>
                <div class="item-titulo-row">
                  <h2>{{ msg.assunto }}</h2>
                  <span class="status-pill" :class="msg.lida ? 'status-lida' : 'status-pendente'">
                    {{ msg.lida ? 'Lida' : 'Nova' }}
                  </span>
                  <span class="tag-publico">{{ msg.publico === 'agencia' ? 'Agência' : 'Estudante' }}</span>
                </div>
                <p class="item-meta">
                  {{ msg.nome }}
                  <template v-if="msg.nome_agencia"> · {{ msg.nome_agencia }}</template>
                  · <a :href="`mailto:${msg.email}`">{{ msg.email }}</a>
                  · {{ formatarData(msg.criado_em) }}
                </p>
              </div>
              <button type="button" class="btn-sec" :disabled="processandoId === `msg-${msg.id}`" @click="alternarLida(msg)">
                {{ msg.lida ? 'Marcar como nova' : 'Marcar como lida' }}
              </button>
            </div>
            <p class="item-texto">{{ msg.mensagem }}</p>
          </article>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #fff;
}

.top-banner {
  width: 100%;
  height: 190px;
  background: linear-gradient(120deg, var(--gb-purple-deep) 0%, var(--gb-dark) 100%);
  display: flex;
  align-items: flex-end;
  padding: 0 5%;
}

.top-banner span {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  padding-bottom: 16px;
}

.content {
  padding: 32px 24px 90px;
}

.estado-caixa {
  padding: 20px;
  border-radius: var(--gb-radius-card);
  background: var(--gb-cream);
  color: var(--gb-ink-soft);
  font-weight: 600;
}

.estado-erro {
  background: #fff4f4;
  color: #7f1d1d;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.link-voltar {
  color: var(--gb-magenta);
  font-weight: 600;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.admin-header h1 {
  margin: 0;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 1.5rem;
  color: var(--gb-dark);
}

.admin-header p {
  margin: 4px 0 0;
  font-size: 0.88rem;
  color: var(--gb-ink-soft);
}

.admin-header-acoes {
  display: flex;
  gap: 10px;
}

.alerta {
  margin: 0 0 16px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.86rem;
  font-weight: 600;
}

.alerta--erro {
  background: #fff4f4;
  border: 1px solid rgba(179, 38, 30, 0.25);
  color: #b3261e;
}

.alerta--ok {
  background: rgba(61, 154, 75, 0.1);
  border: 1px solid rgba(61, 154, 75, 0.3);
  color: #266b30;
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 22px;
  border-bottom: 1px solid var(--gb-purple-deep-16);
  padding-bottom: 14px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--gb-purple-deep-16);
  background: #fff;
  color: var(--gb-dark);
  padding: 9px 16px;
  border-radius: var(--gb-radius-pill);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.tab-btn.active {
  background: var(--gb-dark);
  color: #fff;
  border-color: var(--gb-dark);
}

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 99px;
  background: var(--gb-magenta);
  color: #fff;
  font-size: 10.5px;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.vazio {
  color: var(--gb-ink-faint);
  font-size: 0.9rem;
}

.item-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 20px 24px;
}

.item-nao-lida {
  border-left: 4px solid var(--gb-magenta);
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.item-titulo-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.item-card h2 {
  margin: 0;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 1rem;
  color: var(--gb-dark);
}

.item-meta {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--gb-ink-faint);
}

.item-meta a {
  color: var(--gb-magenta-strong);
}

.status-pill,
.tag-publico {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: var(--gb-radius-pill);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.status-pendente {
  background: rgba(240, 101, 30, 0.14);
  color: #b4470b;
}

.status-aprovado {
  background: rgba(61, 154, 75, 0.14);
  color: var(--gb-green);
}

.status-recusado {
  background: rgba(179, 38, 30, 0.12);
  color: #b3261e;
}

.status-lida {
  background: var(--gb-cream);
  color: var(--gb-ink-faint);
}

.tag-publico {
  background: rgba(46, 10, 46, 0.07);
  color: var(--gb-dark);
}

.item-detalhes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 12px;
  font-size: 0.84rem;
  color: var(--gb-ink-soft);
}

.item-detalhes a {
  color: var(--gb-magenta-strong);
  margin-left: 4px;
}

.item-texto {
  margin: 12px 0 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--gb-dark);
  white-space: pre-wrap;
}

.item-motivo {
  margin: 10px 0 0;
  font-size: 0.83rem;
  color: #b3261e;
}

.item-acoes {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(46, 10, 46, 0.08);
}

.inp-motivo {
  flex: 1;
  min-width: 220px;
  padding: 9px 12px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 9px;
  font-size: 0.85rem;
  font-family: 'Montserrat', sans-serif;
}

.btn-aprovar {
  background: var(--gb-green);
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 9px 16px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-danger {
  background: #b3261e;
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 9px 16px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-danger-outline {
  background: #fff;
  color: #b3261e;
  border: 1px solid #b3261e;
  border-radius: 9px;
  padding: 8px 15px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-sec {
  background: #fff;
  color: var(--gb-dark);
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 9px;
  padding: 8px 14px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-sec--danger {
  color: #b3261e;
  border-color: rgba(179, 38, 30, 0.3);
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

@media (max-width: 768px) {
  .top-banner {
    height: 92px;
  }
}
</style>
