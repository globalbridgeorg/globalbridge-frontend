<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { logout } = useAuth()

const carregando = ref(true)
const erro = ref('')
const agencia = ref(null)
const painel = ref(null)
const formularioAberto = ref(false)
const paisSelecionado = ref('')
const paisesDisponiveis = ref([])
const enviandoPedido = ref(false)
const mensagemPedido = ref('')

const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

const iniciais = computed(() => {
  if (!agencia.value?.nome) return '?'
  const partes = agencia.value.nome.trim().split(/\s+/)
  return (partes[0]?.[0] || '') + (partes[1]?.[0] || '')
})

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function tempoRelativo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 60) return `há ${min || 1} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  return formatarData(iso)
}

function estrelas(nota) {
  return '★'.repeat(nota) + '☆'.repeat(5 - nota)
}

async function carregar() {
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
      carregando.value = false
      return
    }
    if (!eu.agencia_id) {
      router.replace({ name: 'business-analise' })
      return
    }

    const [{ data: dadosAgencia }, { data: dadosPainel }, { data: todosPaises }] = await Promise.all([
      axios.get(`/agencia/${eu.agencia_id}/`),
      axios.get(`/agencia/${eu.agencia_id}/painel/`),
      axios.get('/paises/'),
    ])
    agencia.value = dadosAgencia
    painel.value = dadosPainel

    const idsOcupados = new Set([
      ...dadosPainel.paises_atendidos.map((p) => p.id),
      ...dadosPainel.paises_pendentes.map((p) => p.id),
    ])
    paisesDisponiveis.value = (Array.isArray(todosPaises) ? todosPaises : todosPaises.results || [])
      .filter((p) => !idsOcupados.has(p.id))
  } catch (e) {
    console.error('Erro ao carregar painel business:', e)
    erro.value = 'Não conseguimos carregar seu painel agora.'
  } finally {
    carregando.value = false
  }
}

function irParaEditor() {
  router.push({ name: 'business-editor' })
}

async function enviarPedidoPais() {
  if (!paisSelecionado.value) return
  enviandoPedido.value = true
  mensagemPedido.value = ''
  try {
    await axios.post(`/agencia/${agencia.value.id}/paises/solicitar/`, { pais: paisSelecionado.value })
    mensagemPedido.value = 'Pedido enviado — vai aparecer como pendente até o time aprovar.'
    formularioAberto.value = false
    paisSelecionado.value = ''
    await carregar()
  } catch (e) {
    mensagemPedido.value = e.response?.data?.detail || 'Não conseguimos enviar o pedido agora.'
  } finally {
    enviandoPedido.value = false
  }
}

// Entrada em cascata — mesmo vocabulário de animação do resto do site
// (ver AgenciaView): gsap.from com clearProps pra não deixar transform/
// opacity grudados no elemento depois, o que quebra o layout em
// re-render. Só roda depois dos dados chegarem, senão anima o vazio.
let ctx
function animarEntrada() {
  if (prefersReducedMotion()) return
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'transform,opacity' } })
    tl.from('.cabecalho', { opacity: 0, y: 16, duration: 0.45 })
      .from('.grid-stats .stat', { opacity: 0, y: 12, scale: 0.97, duration: 0.4, stagger: 0.05 }, '-=0.25')
      .from('.conteudo > *:not(.cabecalho):not(.grid-stats)', { opacity: 0, y: 16, duration: 0.45, stagger: 0.06 }, '-=0.2')
  })
}

onMounted(async () => {
  await carregar()
  if (agencia.value && painel.value) {
    await nextTick()
    animarEntrada()
  }
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="painel-view">
    <div v-if="carregando" class="estado-tela">Carregando seu painel...</div>

    <div v-else-if="erro && !agencia" class="estado-tela">
      <p>{{ erro }}</p>
      <router-link to="/profile" class="link-voltar">Voltar pro meu perfil</router-link>
    </div>

    <template v-else-if="agencia && painel">
      <div class="topbar">
        <div class="topbar-info">
          <span class="logo">Global<span>Bridge</span></span>
          <span class="divisor"></span>
          <span class="titulo-editando">Painel — {{ agencia.nome }}</span>
        </div>
        <div class="topbar-actions">
          <router-link :to="{ name: 'agencia', params: { id: agencia.id } }" target="_blank" class="link-ver-pagina">Ver página pública</router-link>
          <button type="button" class="link-sair" @click="logout">Sair da conta</button>
          <button class="btn-editar" @click="irParaEditor">Editar minha página</button>
        </div>
      </div>

      <div class="conteudo">
        <!-- Cabeçalho -->
        <div class="card cabecalho">
          <div class="avatar">{{ iniciais }}</div>
          <div class="cabecalho-info">
            <div class="cabecalho-linha">
              <h1>{{ agencia.nome }}</h1>
              <span class="badge-verificada">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                Verificada
              </span>
              <span v-if="painel.ranking" class="badge-ranking">{{ painel.ranking.posicao }}º de {{ painel.ranking.total }} em {{ painel.ranking.pais }}</span>
            </div>
            <p class="cabecalho-sub">
              Sede em {{ agencia.cidade }}, {{ agencia.pais }}
              <template v-if="painel.verificacao"> · verificada em {{ formatarData(painel.verificacao.aprovado_em) }}</template>
            </p>
          </div>
        </div>

        <!-- Estatísticas -->
        <div class="grid-stats">
          <div class="card stat">
            <span class="stat-numero">{{ painel.stats.nota ?? '—' }}</span>
            <span class="stat-label">Nota média · {{ painel.stats.total_avaliacoes }} avaliações</span>
          </div>
          <div class="card stat">
            <span class="stat-numero">{{ painel.stats.favoritos }}</span>
            <span class="stat-label">Favoritaram · {{ painel.stats.favoritos_30_dias }} nos últimos 30 dias</span>
          </div>
          <div class="card stat">
            <span class="stat-numero">{{ painel.stats.programas }}</span>
            <span class="stat-label">Programas cadastrados</span>
          </div>
          <div class="card stat">
            <span class="stat-numero">{{ painel.stats.paises }}</span>
            <span class="stat-label">Países atendidos</span>
          </div>
        </div>

        <!-- Distribuição + completude -->
        <div class="grid-duas">
          <div class="card">
            <h2 class="card-titulo">Distribuição de notas</h2>
            <div v-if="painel.stats.total_avaliacoes === 0" class="vazio-pequeno">Ainda sem avaliações.</div>
            <div v-else v-for="linha in painel.distribuicao_notas" :key="linha.estrelas" class="linha-nota">
              <span class="linha-nota-label">{{ linha.estrelas }}★</span>
              <div class="linha-nota-barra"><div class="linha-nota-preenchido" :style="{ width: linha.largura + '%' }"></div></div>
              <span class="linha-nota-qtd">{{ linha.quantidade }}</span>
            </div>
          </div>

          <div class="card">
            <div class="completude-head">
              <h2 class="card-titulo">Completude da página</h2>
              <span class="completude-percentual">{{ painel.completude.percentual }}%</span>
            </div>
            <div class="completude-barra"><div class="completude-preenchido" :style="{ width: painel.completude.percentual + '%' }"></div></div>
            <div v-for="item in painel.completude.itens" :key="item.texto" class="completude-item">
              <svg v-if="item.feito" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3D9A4B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4D4D8" stroke-width="3"><circle cx="12" cy="12" r="9"/></svg>
              <span :class="{ pendente: !item.feito }">{{ item.texto }}</span>
            </div>
          </div>
        </div>

        <!-- Países atendidos -->
        <div class="card">
          <div class="card-head">
            <h2 class="card-titulo">Países atendidos</h2>
            <button class="btn-adicionar" :aria-expanded="formularioAberto" aria-controls="form-pais-solicitar" @click="formularioAberto = !formularioAberto">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Solicitar novo país
            </button>
          </div>
          <p class="card-desc">Baseado nos países aprovados no seu cadastro. Pra atender um novo país, o time da GlobalBridge confirma antes — igual foi na verificação inicial.</p>

          <div class="chips-paises">
            <span v-for="pais in painel.paises_atendidos" :key="pais.id" class="chip-pais">
              <span class="chip-sigla">{{ pais.sigla }}</span>{{ pais.nome }}
            </span>
            <span v-for="pais in painel.paises_pendentes" :key="'p' + pais.id" class="chip-pais pendente">
              <span class="chip-sigla pendente">{{ pais.sigla }}</span>{{ pais.nome }}
              <span class="chip-pendente-tag">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
                Pendente
              </span>
            </span>
          </div>

          <p v-if="mensagemPedido" class="mensagem-pedido" role="status">{{ mensagemPedido }}</p>

          <!-- grid-template-rows 0fr→1fr é o truque que deixa a altura
               animar sem precisar saber o tamanho do conteúdo (height:auto
               não é animável). O wrapper interno com overflow:hidden é o
               que faz o conteúdo ser cortado enquanto abre. -->
          <div id="form-pais-solicitar" class="form-pais-wrap" :class="{ aberta: formularioAberto }">
            <div class="form-pais-inner">
              <div class="form-pais">
                <label for="select-novo-pais">Escolher país pra solicitar</label>
                <div class="form-pais-linha">
                  <select id="select-novo-pais" v-model="paisSelecionado">
                    <option value="">Selecione um país...</option>
                    <option v-for="p in paisesDisponiveis" :key="p.id" :value="p.id">{{ p.nome }}</option>
                  </select>
                  <button :disabled="!paisSelecionado || enviandoPedido" @click="enviarPedidoPais">{{ enviandoPedido ? 'Enviando...' : 'Enviar pedido' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Catálogo de programas -->
        <div class="card">
          <div class="card-head">
            <h2 class="card-titulo">Catálogo de programas</h2>
          </div>
          <div v-if="!painel.planos.length" class="vazio-pequeno">Nenhum programa cadastrado ainda.</div>
          <template v-else>
            <div role="table" aria-label="Catálogo de programas">
              <div class="tabela-head" role="row">
                <span role="columnheader">Programa</span><span role="columnheader">Duração</span><span role="columnheader">Preço</span>
              </div>
              <div v-for="plano in painel.planos" :key="plano.id" class="tabela-linha" role="row">
                <span class="tabela-nome" role="cell">{{ plano.nome }}</span>
                <span role="cell">{{ plano.duracao }}</span>
                <span role="cell">{{ plano.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Especialidades -->
        <div class="card">
          <h2 class="card-titulo" style="margin-bottom: 14px;">Especialidades</h2>
          <div v-if="!painel.tags.length" class="vazio-pequeno">Nenhuma especialidade marcada ainda.</div>
          <div v-else class="chips-tags">
            <span v-for="tag in painel.tags" :key="tag" class="chip-tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Contato + verificação -->
        <div class="grid-duas">
          <div class="card">
            <h2 class="card-titulo" style="margin-bottom: 14px;">Informações de contato</h2>
            <div class="linha-info"><span>E-mail</span><strong>{{ painel.contato.email || '—' }}</strong></div>
            <div class="linha-info"><span>Telefone</span><strong>{{ painel.contato.telefone || '—' }}</strong></div>
            <div class="linha-info"><span>Site</span><strong>{{ painel.contato.site || '—' }}</strong></div>
            <div class="linha-info"><span>Endereço</span><strong>{{ painel.contato.endereco }}</strong></div>
          </div>

          <div class="card">
            <h2 class="card-titulo" style="margin-bottom: 14px;">Dados da verificação</h2>
            <template v-if="painel.verificacao">
              <div class="linha-info"><span>Responsável</span><strong>{{ painel.verificacao.responsavel }}</strong></div>
              <div class="linha-info"><span>Cargo</span><strong>{{ painel.verificacao.cargo || '—' }}</strong></div>
              <div class="linha-info"><span>Pedido enviado em</span><strong>{{ formatarData(painel.verificacao.enviado_em) }}</strong></div>
              <div class="linha-info"><span>Aprovado em</span><strong>{{ formatarData(painel.verificacao.aprovado_em) }}</strong></div>
            </template>
            <div v-else class="vazio-pequeno">Sem registro de verificação (conta cadastrada diretamente).</div>
          </div>
        </div>

        <!-- Avaliações recentes -->
        <div class="card">
          <h2 class="card-titulo" style="margin-bottom: 8px;">Avaliações recentes</h2>
          <div v-if="!painel.avaliacoes_recentes.length" class="vazio-pequeno">Ainda sem avaliações.</div>
          <div v-for="(av, i) in painel.avaliacoes_recentes" :key="i" class="linha-avaliacao">
            <div class="avatar-pequeno">{{ av.nome.slice(0, 2).toUpperCase() }}</div>
            <div class="avaliacao-corpo">
              <strong>{{ av.nome }}</strong>
              <span class="avaliacao-nota">{{ estrelas(av.nota) }}</span>
              <p>{{ av.comentario }}</p>
            </div>
          </div>
        </div>

        <!-- Atividade de favoritos -->
        <div class="card">
          <h2 class="card-titulo" style="margin-bottom: 8px;">Atividade de favoritos</h2>
          <div v-if="!painel.favoritos_recentes.length" class="vazio-pequeno">Ainda sem favoritos.</div>
          <div v-for="(fav, i) in painel.favoritos_recentes" :key="i" class="linha-favorito">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#B01FB0" stroke="#B01FB0" stroke-width="1"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4.5 6 4c2-.3 3.7.7 6 3 2.3-2.3 4-3.3 6-3 3.7.5 5.6 4.1 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
            <span class="favorito-texto">{{ fav.nome }} favoritou sua agência</span>
            <span class="favorito-quando">{{ tempoRelativo(fav.quando) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* padding-top compensa o header do site, que é fixed só no desktop e
   flutua por cima de tudo — sem isso o topbar dark próprio dessa
   página ficava tampado atrás dele. 96px = altura real do header
   (80px + 16px de margin-top que ele tem), medido no navegador. No
   celular ele entra no fluxo normal (ver App.vue), não precisa de nada
   aqui. */
.painel-view { min-height: 100vh; background: #FFFFFF; font-family: 'Montserrat', sans-serif; padding-top: 96px; }

@media (max-width: 768px) {
  .painel-view { padding-top: 0; }
}

.estado-tela {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; color: var(--gb-ink-soft); text-align: center; padding: 24px;
}
.link-voltar { color: var(--gb-magenta); font-weight: 600; }

.topbar {
  height: 64px; background: var(--gb-dark); display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; color: #fff;
}
.topbar-info { display: flex; align-items: center; gap: 16px; }
.logo { font-family: var(--gb-font-display); font-weight: 900; font-size: 15px; letter-spacing: -0.02em; text-transform: uppercase; }
.logo span { color: var(--gb-accent-light, #FF7DEE); }
.divisor { width: 1px; height: 20px; background: rgba(255, 255, 255, 0.2); }
.titulo-editando { font-size: 0.85rem; color: rgba(255, 255, 255, 0.7); }
.topbar-actions { display: flex; align-items: center; gap: 20px; }
.link-ver-pagina { font-size: 0.82rem; color: rgba(255, 255, 255, 0.75); text-decoration: underline; }
.link-sair { font-family: inherit; font-size: 0.82rem; color: rgba(255, 255, 255, 0.75); text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0; }
.link-sair:hover { color: #fff; }
.btn-editar {
  background: var(--gb-magenta); color: #fff; border: none; border-radius: 8px; padding: 9px 18px;
  font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
}

.conteudo { max-width: 1100px; margin: 0 auto; padding: 32px 24px 90px; display: flex; flex-direction: column; gap: 20px; }

.card { background: #fff; border: 1px solid var(--gb-purple-deep-16); border-radius: 16px; padding: 24px; }
.card-titulo { display: block; margin: 0; font-weight: 700; font-size: 0.98rem; color: var(--gb-dark); }
.card-desc { margin: 0 0 16px; font-size: 0.82rem; color: var(--gb-ink-faint); }
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 10px; }
.vazio-pequeno { color: var(--gb-ink-faint); font-size: 0.85rem; }

.cabecalho { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--gb-dark); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--gb-font-display); font-weight: 800; font-size: 22px; flex-shrink: 0; }
.cabecalho-info { flex: 1; min-width: 220px; }
.cabecalho-linha { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cabecalho-linha h1 { margin: 0; font-family: var(--gb-font-display); font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; color: var(--gb-dark); font-size: 22px; }
.badge-verificada { display: inline-flex; align-items: center; gap: 5px; background: rgba(61,154,75,0.12); color: #3D9A4B; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
.badge-ranking { display: inline-flex; align-items: center; background: rgba(176,31,176,0.08); color: var(--gb-magenta-strong); font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
.cabecalho-sub { margin: 6px 0 0; color: var(--gb-ink-soft); font-size: 0.9rem; }

.grid-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stat { padding: 18px 20px; }
.stat-numero { display: block; font-family: var(--gb-font-display); font-weight: 800; font-size: 26px; color: var(--gb-dark); }
.stat-label { display: block; margin-top: 4px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gb-ink-faint); }

.grid-duas { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; }
@media (max-width: 820px) { .grid-duas, .grid-stats { grid-template-columns: 1fr 1fr; } }

.linha-nota { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.linha-nota-label { width: 34px; font-size: 0.8rem; font-weight: 700; color: var(--gb-ink-soft); flex-shrink: 0; }
.linha-nota-barra { flex: 1; height: 10px; background: #F4F4F5; border-radius: 6px; overflow: hidden; }
.linha-nota-preenchido { height: 100%; background: var(--gb-orange); border-radius: 6px; }
.linha-nota-qtd { width: 26px; text-align: right; font-size: 0.78rem; color: var(--gb-ink-faint); flex-shrink: 0; }

.completude-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.completude-percentual { font-family: var(--gb-font-display); font-weight: 800; font-size: 15px; color: var(--gb-magenta-strong); }
.completude-barra { height: 8px; background: #F4F4F5; border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
.completude-preenchido { height: 100%; background: var(--gb-magenta); border-radius: 6px; }
.completude-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 0.83rem; color: var(--gb-dark); }
.completude-item .pendente { color: var(--gb-ink-faint); }

.chips-paises { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-pais { display: inline-flex; align-items: center; gap: 6px; background: rgba(176,31,176,0.06); color: var(--gb-magenta-strong); border-radius: 20px; padding: 7px 14px 7px 8px; font-size: 0.84rem; font-weight: 600; }
.chip-pais.pendente { background: #F4F4F5; color: var(--gb-ink-soft); }
.chip-sigla { width: 20px; height: 20px; border-radius: 50%; background: var(--gb-dark); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; }
.chip-sigla.pendente { background: #D4D4D8; color: var(--gb-ink-soft); }
.chip-pendente-tag { display: inline-flex; align-items: center; gap: 3px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 9px; letter-spacing: 0.04em; text-transform: uppercase; }

.btn-adicionar { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1.5px dashed var(--gb-purple-deep-16); border-radius: 20px; padding: 7px 14px; font-size: 0.8rem; font-weight: 600; color: var(--gb-ink-soft); cursor: pointer; }
.mensagem-pedido { margin: 12px 0 0; font-size: 0.82rem; color: var(--gb-magenta-strong); }

.form-pais-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(.4, 0, .2, 1);
}
.form-pais-wrap.aberta { grid-template-rows: 1fr; }
.form-pais-inner { overflow: hidden; }
.form-pais-wrap .form-pais {
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.22s ease 0.06s, transform 0.22s ease 0.06s;
}
.form-pais-wrap.aberta .form-pais { opacity: 1; transform: translateY(0); }

.form-pais { border-top: 1px solid var(--gb-purple-deep-16); padding-top: 16px; margin-top: 16px; }
.form-pais label { display: block; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gb-ink-faint); margin-bottom: 8px; }
.form-pais-linha { display: flex; gap: 10px; flex-wrap: wrap; }
.form-pais-linha select { flex: 1; min-width: 200px; padding: 10px 12px; border: 1px solid var(--gb-purple-deep-16); border-radius: 10px; font-size: 0.85rem; font-family: var(--gb-font-display); color: var(--gb-dark); background: #fff; }
.form-pais-linha button { background: var(--gb-dark); color: #fff; border: none; border-radius: 10px; padding: 0 20px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11.5px; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; }
.form-pais-linha button:disabled { opacity: 0.5; cursor: default; }

.tabela-head { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; padding: 0 0 8px; border-bottom: 1px solid rgba(46,10,46,0.12); font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gb-ink-faint); }
.tabela-linha { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(46,10,46,0.06); align-items: center; font-size: 0.86rem; color: var(--gb-ink-soft); }
.tabela-nome { font-weight: 600; color: var(--gb-dark); }

.chips-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-tag { background: #F4F4F5; color: var(--gb-ink-soft); border-radius: 20px; padding: 7px 14px; font-size: 0.82rem; font-weight: 600; }

.linha-info { display: flex; justify-content: space-between; gap: 10px; font-size: 0.86rem; padding: 5px 0; }
.linha-info span { color: var(--gb-ink-faint); }
.linha-info strong { color: var(--gb-dark); font-weight: 600; text-align: right; }

.linha-avaliacao { display: flex; gap: 14px; padding: 14px 0; border-top: 1px solid rgba(46,10,46,0.1); }
.linha-avaliacao:first-of-type { border-top: none; }
.avatar-pequeno { width: 36px; height: 36px; border-radius: 50%; background: #F4F4F5; color: var(--gb-ink-soft); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
.avaliacao-corpo { flex: 1; }
.avaliacao-corpo strong { font-size: 0.88rem; color: var(--gb-dark); }
.avaliacao-nota { display: block; margin: 2px 0 6px; color: var(--gb-orange); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; }
.avaliacao-corpo p { margin: 0; font-size: 0.86rem; color: var(--gb-ink-soft); line-height: 1.5; }

@media (prefers-reduced-motion: reduce) {
  .form-pais-wrap,
  .form-pais-wrap .form-pais { transition: none; }
}

.linha-favorito { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(46,10,46,0.08); }
.linha-favorito:first-of-type { border-top: none; }
.favorito-texto { flex: 1; font-size: 0.86rem; color: var(--gb-dark); }
.favorito-quando { font-size: 0.78rem; color: var(--gb-ink-faint); }
</style>
