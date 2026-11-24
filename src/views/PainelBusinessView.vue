<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { getAgenciaDetalhe, getPainelAgencia, getPaises } from '@/services/api'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { useAuth } from '@/composables/useAuth'
import { useContaAtual } from '@/composables/useContaAtual'
import { useContaBusiness } from '@/composables/useContaBusiness'
import { useTrocaAnimada } from '@/composables/useTrocaAnimada'
import { formatarData } from '@/components/business/formatarData'
import PainelResumo from '@/components/business/PainelResumo.vue'
import DadosAgenciaPanel from '@/components/business/DadosAgenciaPanel.vue'
import PlanosPanel from '@/components/business/PlanosPanel.vue'
import PaisesAtendidosCard from '@/components/business/PaisesAtendidosCard.vue'
import ExcluirContaCard from '@/components/business/ExcluirContaCard.vue'

const router = useRouter()
const { logout } = useAuth()
const { estado: conta } = useContaAtual()
const { carregando, erro, carregarConta } = useContaBusiness('Não conseguimos carregar seu painel agora.')

const pageRef = ref(null)
const agencia = ref(null)
const painel = ref(null)
const todosPaises = ref([])
const mensagemPedido = ref('')

const secao = ref('resumo')
const panelShell = ref(null)
const selecionarSecao = useTrocaAnimada(panelShell, secao)

const iniciais = computed(() => {
  if (!agencia.value?.nome) return '?'
  const partes = agencia.value.nome.trim().split(/\s+/)
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase()
})

const abas = computed(() => [
  {
    key: 'resumo',
    label: 'Resumo',
    meta: painel.value
      ? `${painel.value.stats.nota ?? '—'} ★ · ${painel.value.stats.total_avaliacoes} avaliaç${painel.value.stats.total_avaliacoes === 1 ? 'ão' : 'ões'}`
      : 'Visão geral',
  },
  {
    key: 'dados',
    label: 'Dados da agência',
    meta: 'Perfil, textos e contato',
  },
  {
    key: 'programas',
    label: 'Programas',
    meta: `${agencia.value?.planos?.length ?? 0} cadastrado${(agencia.value?.planos?.length ?? 0) === 1 ? '' : 's'}`,
  },
  {
    key: 'paises',
    label: 'Países e tags',
    meta: `${painel.value?.stats?.paises ?? 0} ${(painel.value?.stats?.paises ?? 0) === 1 ? 'país atendido' : 'países atendidos'}`,
  },
  {
    key: 'conta',
    label: 'Verificação e conta',
    meta: 'Status e exclusão',
  },
])

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

const carregar = () => carregarConta(async (agenciaId) => {
  const [dadosAgencia, dadosPainel, paises] = await Promise.all([
    getAgenciaDetalhe(agenciaId),
    getPainelAgencia(agenciaId),
    getPaises(),
  ])
  agencia.value = dadosAgencia
  painel.value = dadosPainel
  todosPaises.value = paises
})

async function recarregarDados() {
  if (!agencia.value?.id) return
  try {
    const [dadosAgencia, dadosPainel] = await Promise.all([
      getAgenciaDetalhe(agencia.value.id),
      getPainelAgencia(agencia.value.id),
    ])
    agencia.value = dadosAgencia
    painel.value = dadosPainel
  } catch (e) {
    console.error('Erro ao atualizar painel:', e)
  }
}

function aoAtualizarAgencia(atualizada) {
  agencia.value = atualizada
  recarregarDados()
}

function navegarChecklist(destino) {
  if (destino.rota) {
    router.push({ name: destino.rota })
  } else if (destino.aba) {
    selecionarSecao(destino.aba)
  }
}

let ctx
let ctxAba

function animarAba() {
  if (prefersReducedMotion() || !panelShell.value) return
  ctxAba?.revert()
  ctxAba = gsap.context(() => {
    const cards = panelShell.value.querySelectorAll('.card')
    if (cards.length) {
      gsap.from(cards, {
        opacity: 0,
        y: 18,
        duration: 0.45,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      })
    }

    const barras = panelShell.value.querySelectorAll('.completude-preenchido, .linha-nota-preenchido')
    if (barras.length) {
      gsap.from(barras, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.75,
        stagger: 0.05,
        delay: 0.15,
        ease: 'power3.out',
        clearProps: 'transform',
      })
    }

    const itensLista = panelShell.value.querySelectorAll(
      '.completude-item, .plano-item, .chip-pais, .chip-tag, .linha-avaliacao, .linha-favorito, .linha-info',
    )
    if (itensLista.length) {
      gsap.from(itensLista, {
        opacity: 0,
        x: -10,
        duration: 0.36,
        stagger: 0.035,
        delay: 0.1,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      })
    }

    panelShell.value.querySelectorAll('.stat-numero[data-valor]').forEach((el) => {
      const bruto = el.getAttribute('data-valor')
      if (bruto === '' || bruto === null) return
      const alvo = Number(bruto)
      if (!Number.isFinite(alvo) || alvo <= 0) return
      const decimais = Number(el.getAttribute('data-decimal') || 0)
      const obj = { v: 0 }
      gsap.to(obj, {
        v: alvo,
        duration: 0.75,
        delay: 0.12,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = decimais ? obj.v.toFixed(decimais) : String(Math.round(obj.v))
        },
        onComplete: () => {
          el.textContent = decimais ? String(alvo) : String(Math.round(alvo))
        },
      })
    })

    const pctEl = panelShell.value.querySelector('.completude-percentual[data-percentual]')
    if (pctEl) {
      const alvoPct = Number(pctEl.getAttribute('data-percentual'))
      if (Number.isFinite(alvoPct) && alvoPct > 0) {
        const obj = { v: 0 }
        gsap.to(obj, {
          v: alvoPct,
          duration: 0.75,
          delay: 0.15,
          ease: 'power2.out',
          onUpdate: () => { pctEl.textContent = `${Math.round(obj.v)}%` },
          onComplete: () => { pctEl.textContent = `${alvoPct}%` },
        })
      }
    }
  }, panelShell.value)
}

function animarEntrada() {
  if (prefersReducedMotion() || !pageRef.value) return
  ctx?.revert()
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } })
    tl.from('.top-banner span', { opacity: 0, x: -22, duration: 0.48 })
      .from('.agency-identity', { opacity: 0, y: 16, duration: 0.45 }, '-=0.3')
      .from('.agency-actions > *', { opacity: 0, y: 12, duration: 0.36, stagger: 0.06 }, '-=0.3')
      .from('.side-nav', { opacity: 0, x: -16, duration: 0.42 }, '-=0.28')
      .from('.side-nav .side-item', { opacity: 0, x: -8, duration: 0.3, stagger: 0.04 }, '-=0.28')
  }, pageRef.value)
  animarAba()
}

watch(secao, async () => {
  await nextTick()
  animarAba()
})

onMounted(async () => {
  await carregar()
  if (agencia.value && painel.value) {
    await nextTick()
    animarEntrada()
  }
})

onBeforeUnmount(() => {
  ctx?.revert()
  ctxAba?.revert()
})
</script>

<template>
  <div ref="pageRef" class="painel-page">
    <div class="top-banner"><span>Painel da agência</span></div>

    <div class="content gb-section">
      <div v-if="carregando" class="estado-caixa">Carregando seu painel...</div>

      <div v-else-if="erro && !agencia" class="estado-caixa estado-erro">
        <p>{{ erro }}</p>
        <router-link to="/profile" class="link-voltar">Voltar pro meu perfil</router-link>
      </div>

      <template v-else-if="agencia && painel">
        <div class="agency-header">
          <div class="agency-identity">
            <div class="avatar" aria-hidden="true">{{ iniciais }}</div>
            <div class="agency-who">
              <div class="agency-title-row">
                <h1>{{ agencia.nome }}</h1>
                <span class="badge-verificada">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                  Verificada
                </span>
                <span v-if="painel.ranking" class="badge-ranking">
                  {{ painel.ranking.posicao }}º de {{ painel.ranking.total }} em {{ painel.ranking.pais }}
                </span>
              </div>
              <p class="agency-sub">
                Sede em {{ agencia.cidade }}, {{ agencia.pais }}
                <template v-if="painel.verificacao"> · verificada em {{ formatarData(painel.verificacao.aprovado_em) }}</template>
              </p>
            </div>
          </div>

          <div class="agency-actions">
            <router-link
              v-if="conta.is_admin"
              to="/admin"
              class="btn-secundario"
            >
              Admin
            </router-link>
            <router-link
              :to="{ name: 'agencia', params: { id: agencia.id } }"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secundario"
            >
              Ver página pública
            </router-link>
            <button type="button" class="btn-primario" @click="router.push({ name: 'business-editor' })">
              Editar minha página
            </button>
          </div>
        </div>

        <div class="layout">
          <nav class="side-nav" aria-label="Seções do painel da agência">
            <button
              v-for="aba in abas"
              :key="aba.key"
              type="button"
              class="side-item"
              :class="{ active: secao === aba.key }"
              :aria-current="secao === aba.key ? 'true' : undefined"
              @click="selecionarSecao(aba.key)"
            >
              <div class="side-icon" aria-hidden="true">
                <svg v-if="aba.key === 'resumo'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
                <svg v-else-if="aba.key === 'dados'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V8l6-4v16"/><path d="M10 20V10l8 3v7"/><path d="M3 20h18"/></svg>
                <svg v-else-if="aba.key === 'programas'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
                <svg v-else-if="aba.key === 'paises'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"/></svg>
              </div>
              <div class="side-text">
                <span class="side-label">{{ aba.label }}</span>
                <span class="side-meta">{{ aba.meta }}</span>
              </div>
            </button>

            <button type="button" class="side-logout" @click="logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
              Sair da conta
            </button>
          </nav>

          <div class="panel-shell" ref="panelShell">
            <!-- Resumo -->
            <div v-if="secao === 'resumo'" class="stack">
              <PainelResumo :painel="painel" @ir-para="navegarChecklist" />

              <div class="card">
                <h2 class="card-titulo" style="margin-bottom: 10px;">Avaliações recentes</h2>
                <div v-if="!painel.avaliacoes_recentes.length" class="vazio-pequeno">Ainda sem avaliações.</div>
                <div v-for="(av, i) in painel.avaliacoes_recentes" :key="i" class="linha-avaliacao">
                  <div class="avatar-pequeno" aria-hidden="true">{{ av.nome.slice(0, 2).toUpperCase() }}</div>
                  <div class="avaliacao-corpo">
                    <strong>{{ av.nome }}</strong>
                    <span class="avaliacao-nota" :aria-label="`${av.nota} de 5 estrelas`">{{ estrelas(av.nota) }}</span>
                    <p>{{ av.comentario }}</p>
                  </div>
                </div>
              </div>

              <div class="card">
                <h2 class="card-titulo" style="margin-bottom: 10px;">Atividade de favoritos</h2>
                <div v-if="!painel.favoritos_recentes.length" class="vazio-pequeno">Ainda sem favoritos.</div>
                <div v-for="(fav, i) in painel.favoritos_recentes" :key="i" class="linha-favorito">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--gb-magenta)" stroke="var(--gb-magenta)" stroke-width="1" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4.5 6 4c2-.3 3.7.7 6 3 2.3-2.3 4-3.3 6-3 3.7.5 5.6 4.1 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
                  <span class="favorito-texto">{{ fav.nome }} favoritou sua agência</span>
                  <span class="favorito-quando">{{ tempoRelativo(fav.quando) }}</span>
                </div>
              </div>
            </div>

            <!-- Dados da agência -->
            <div v-else-if="secao === 'dados'" class="stack">
              <DadosAgenciaPanel :agencia="agencia" @atualizado="aoAtualizarAgencia" />
            </div>

            <!-- Programas -->
            <div v-else-if="secao === 'programas'" class="stack">
              <PlanosPanel :agencia-id="agencia.id" :planos="agencia.planos || []" @atualizar="recarregarDados" />
            </div>

            <!-- Países e tags -->
            <div v-else-if="secao === 'paises'" class="stack">
              <PaisesAtendidosCard
                v-model:mensagem="mensagemPedido"
                :agencia-id="agencia.id"
                :painel="painel"
                :todos-paises="todosPaises"
                @atualizar="recarregarDados"
              />

              <div class="card">
                <h2 class="card-titulo" style="margin-bottom: 14px;">Especialidades</h2>
                <div v-if="!painel.tags.length" class="vazio-pequeno">Nenhuma especialidade marcada ainda — as especialidades são definidas pela curadoria GlobalBridge.</div>
                <div v-else class="chips-tags">
                  <span v-for="tag in painel.tags" :key="tag" class="chip-tag">{{ tag }}</span>
                </div>
              </div>
            </div>

            <!-- Conta e verificação -->
            <div v-else-if="secao === 'conta'" class="stack">
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

              <ExcluirContaCard />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped src="../components/business/painelCard.css"></style>
<style scoped>
.painel-page {
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

.agency-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.agency-identity {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 22px;
  flex-shrink: 0;
}

.agency-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.agency-who h1 {
  margin: 0;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: var(--gb-dark);
  font-size: clamp(1.3rem, 1.1rem + 0.7vw, 1.65rem);
}

.agency-sub {
  margin: 5px 0 0;
  font-size: 0.86rem;
  color: var(--gb-ink-soft);
}

.badge-verificada {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(61, 154, 75, 0.12);
  color: var(--gb-green);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: var(--gb-radius-pill);
}

.badge-ranking {
  display: inline-flex;
  align-items: center;
  background: rgba(176, 31, 176, 0.08);
  color: var(--gb-magenta-strong);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: var(--gb-radius-pill);
}

.agency-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-primario {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 10px 18px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-primario:hover {
  background: var(--gb-magenta);
}

.btn-secundario {
  display: inline-flex;
  align-items: center;
  background: #fff;
  color: var(--gb-dark);
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 9px;
  padding: 9px 15px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.btn-secundario:hover {
  border-color: var(--gb-magenta);
  color: var(--gb-magenta);
}

.layout {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 24px;
  align-items: start;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 10px;
}

.side-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.15s ease;
}

.side-item:hover {
  background: rgba(46, 10, 46, 0.04);
}

.side-item.active {
  background: var(--gb-dark);
}

.side-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gb-dark);
  flex-shrink: 0;
}

.side-icon svg {
  width: 18px;
  height: 18px;
}

.side-item.active .side-icon {
  color: #fff;
}

.side-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.side-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.side-item.active .side-label {
  color: #fff;
}

.side-meta {
  font-size: 11px;
  color: var(--gb-ink-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-item.active .side-meta {
  color: rgba(255, 255, 255, 0.6);
}

.side-logout {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 6px;
  padding: 11px 10px;
  border-radius: 8px;
  border: none;
  border-top: 1px solid var(--gb-purple-deep-16);
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.86rem;
  color: #dc2626;
  transition: background 0.15s ease;
}

.side-logout:hover {
  background: rgba(220, 38, 38, 0.06);
}

.panel-shell {
  transition: height 0.28s ease;
  min-width: 0;
}

.panel-shell.resizing {
  overflow: hidden;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.chips-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-tag {
  background: var(--gb-cream);
  color: var(--gb-ink-soft);
  border-radius: var(--gb-radius-pill);
  padding: 7px 14px;
  font-size: 0.82rem;
  font-weight: 600;
}

.linha-info {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.86rem;
  padding: 7px 0;
  border-top: 1px solid rgba(46, 10, 46, 0.08);
}

.linha-info:first-of-type {
  border-top: none;
  padding-top: 0;
}

.linha-info span {
  color: var(--gb-ink-faint);
}

.linha-info strong {
  color: var(--gb-dark);
  font-weight: 600;
  text-align: right;
}

.linha-avaliacao {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid rgba(46, 10, 46, 0.1);
}

.linha-avaliacao:first-of-type {
  border-top: none;
  padding-top: 4px;
}

.avatar-pequeno {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gb-cream);
  color: var(--gb-ink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.avaliacao-corpo {
  flex: 1;
}

.avaliacao-corpo strong {
  font-size: 0.88rem;
  color: var(--gb-dark);
}

.avaliacao-nota {
  display: block;
  margin: 2px 0 6px;
  color: var(--gb-orange);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.avaliacao-corpo p {
  margin: 0;
  font-size: 0.86rem;
  color: var(--gb-ink-soft);
  line-height: 1.5;
}

.linha-favorito {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid rgba(46, 10, 46, 0.08);
}

.linha-favorito:first-of-type {
  border-top: none;
  padding-top: 4px;
}

.favorito-texto {
  flex: 1;
  font-size: 0.86rem;
  color: var(--gb-dark);
}

.favorito-quando {
  font-size: 0.78rem;
  color: var(--gb-ink-faint);
}

@media (max-width: 768px) {
  .top-banner {
    height: 92px;
  }

  .layout {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel-shell {
    transition: none;
  }
}
</style>
