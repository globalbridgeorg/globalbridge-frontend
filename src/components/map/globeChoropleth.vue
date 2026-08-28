<script setup>
import { ref, reactive, computed, defineAsyncComponent } from 'vue'
import axios from '@/services/axios'
import MapFilterPanel from './MapFilterPanel.vue'
import AgenciesPanel from './AgenciesPanel.vue'
import HelpModal from '@/components/common/HelpModal.vue'

const isLoading = ref(true)
const erroGlobo = ref(false)
const chaveGlobo = ref(0)
const mostrarAjuda = ref(false)

function onGlobeError() {
  isLoading.value = false
  erroGlobo.value = true
}

function tentarNovoGlobo() {
  erroGlobo.value = false
  isLoading.value = true
  // Muda a key do componente pra forçar recriação do zero (o estado
  // interno do globo/globe.gl não tem um jeito limpo de "reiniciar" sem
  // desmontar e montar de novo).
  chaveGlobo.value++
}

// O globo puxa globe.gl + d3 + topojson (as libs pesadas). Carregando ele
// como componente assíncrono, isso vira um chunk separado que baixa em
// paralelo enquanto os painéis (leves) já aparecem na tela. onError cobre o
// caso do PRÓPRIO arquivo .js falhar ao baixar (ex.: alguém com a aba aberta
// bem na hora de um deploy novo, pedindo um hash de arquivo que já não
// existe mais) — sem isso, o site ficava preso pra sempre na tela de
// carregando, porque o componente nunca chegava a montar pra avisar nada.
const GlobeCanvas = defineAsyncComponent({
  loader: () => import('./GlobeCanvas.vue'),
  onError(error, retry, fail) {
    console.error('Erro ao baixar o componente do globo 3D:', error)
    onGlobeError()
    fail()
  },
})

// ─── Categorias do painel de filtros ────────────────────────────────────────
// Os rótulos ficam aqui (são fixos), mas os países/agências e a contagem de
// cada opção vêm da API — nada abaixo é mais mock.
const FILTER_LABELS = {
  emprego: { label: 'Emprego', options: { tech: 'Tecnologia', saude: 'Saúde', engenharia: 'Engenharia', financas: 'Finanças', educacao: 'Educação', artes: 'Artes & Design' } },
  universidade: { label: 'Universidade', options: { top100: 'Top 100 Mundial', bolsas: 'Oferece Bolsas', intercambio: 'Intercâmbio', publicas: 'Públicas', privadas: 'Privadas', ead: 'EAD / Online' } },
  idioma: { label: 'Idioma', options: { ingles: 'Inglês', espanhol: 'Espanhol', frances: 'Francês', alemao: 'Alemão', mandarin: 'Mandarim', japones: 'Japonês', portugues: 'Português' } },
  cultura: { label: 'Cultura', options: { gastronomia: 'Gastronomia', musica: 'Música', esportes: 'Esportes', religiao: 'Diversidade Religiosa', festivais: 'Festivais', natureza: 'Natureza & Aventura' } }
}

const activeFilters = reactive({ emprego: [], universidade: [], idioma: [], cultura: [] })

// ─── Dados reais (país/agência) ─────────────────────────────────────────────
const agencies = ref([])
const countryMeta = ref({})
const nomePtPorNomeIngles = ref({})
const carregandoDados = ref(true)
const selectedCountry = ref(null) // { nomeIngles, nomePt }

function agruparTagsPorCategoria(tags) {
  const grupos = {}
  for (const tag of tags ?? []) {
    if (!grupos[tag.categoria]) grupos[tag.categoria] = []
    grupos[tag.categoria].push(tag.valor)
  }
  return grupos
}

async function carregarDadosDoMapa() {
  carregandoDados.value = true
  try {
    const [resPaises, resAgencias] = await Promise.all([
      axios.get('/paises/'),
      axios.get('/agencia/')
    ])
    const paises = Array.isArray(resPaises.data) ? resPaises.data : (resPaises.data.results ?? [])
    const agenciasApi = Array.isArray(resAgencias.data) ? resAgencias.data : (resAgencias.data.results ?? [])

    const meta = {}
    const nomesPt = {}
    for (const pais of paises) {
      if (!pais.nome_ingles) continue
      meta[pais.nome_ingles] = agruparTagsPorCategoria(pais.tags)
      nomesPt[pais.nome_ingles] = pais.nome
    }
    countryMeta.value = meta
    nomePtPorNomeIngles.value = nomesPt

    agencies.value = agenciasApi.map((a) => ({
      id: a.id,
      name: a.nome,
      stars: Math.round(a.nota_media ?? 0),
      description: a.descricao,
      location: a.cidade && a.pais ? `${a.cidade}, ${a.pais}` : (a.pais ?? ''),
      paisNomeIngles: a.pais_nome_ingles,
      tags: agruparTagsPorCategoria(a.tags)
    }))
  } catch (e) {
    console.error('Erro ao buscar dados do mapa:', e)
  } finally {
    carregandoDados.value = false
  }
}

carregarDadosDoMapa()

const filters = computed(() =>
  Object.entries(FILTER_LABELS).map(([id, { label, options }]) => ({
    id,
    label,
    options: Object.entries(options).map(([value, optLabel]) => ({
      value,
      label: optLabel,
      count: agencies.value.filter((a) => (a.tags?.[id] ?? []).includes(value)).length
    }))
  }))
)

const totalActiveFilters = computed(() =>
  Object.values(activeFilters).reduce((acc, arr) => acc + arr.length, 0)
)

// Contagem real de agências por país (nome em inglês, pra bater com o
// dataset do globo) — é isso que colore o mapa agora, no lugar do
// número fixo de universidades.
const agencyCountByCountry = computed(() => {
  const contagem = {}
  for (const agencia of agencies.value) {
    if (!agencia.paisNomeIngles) continue
    contagem[agencia.paisNomeIngles] = (contagem[agencia.paisNomeIngles] ?? 0) + 1
  }
  return contagem
})

const filteredAgencies = computed(() => {
  let lista = agencies.value
  if (selectedCountry.value) {
    lista = lista.filter((agency) => agency.paisNomeIngles === selectedCountry.value.nomeIngles)
  }
  if (totalActiveFilters.value === 0) return lista
  return lista.filter(agency => {
    for (const [cat, selected] of Object.entries(activeFilters)) {
      if (selected.length === 0) continue
      const values = agency.tags?.[cat] ?? []
      if (!selected.some(v => values.includes(v))) return false
    }
    return true
  })
})

function clearSelectedCountry() {
  selectedCountry.value = null
}

function onCountryClick(nomeIngles) {
  selectedCountry.value = {
    nomeIngles,
    nomePt: nomePtPorNomeIngles.value[nomeIngles] ?? nomeIngles
  }
}

function toggleFilter(sectionId, value) {
  const arr = activeFilters[sectionId]
  const idx = arr.indexOf(value)
  idx === -1 ? arr.push(value) : arr.splice(idx, 1)
}

function clearFilters() {
  Object.keys(activeFilters).forEach(k => (activeFilters[k] = []))
}
</script>

<template>
  <!-- Loading overlay -->
  <Transition name="fade">
    <div v-if="isLoading" class="globe-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">Carregando mapa...</p>
    </div>
    <div v-else-if="erroGlobo" class="globe-loading">
      <p class="loading-text">Não conseguimos carregar o mapa agora.</p>
      <button class="btn-tentar-novamente" @click="tentarNovoGlobo">Tentar novamente</button>
    </div>
  </Transition>

  <MapFilterPanel
    :filters="filters"
    :active-filters="activeFilters"
    @toggle-filter="toggleFilter"
    @clear-filters="clearFilters"
  />

  <AgenciesPanel
    :agencies="filteredAgencies"
    :loading="carregandoDados"
    :selected-country="selectedCountry"
    @clear-country="clearSelectedCountry"
  />

  <div class="active-badge" v-if="totalActiveFilters > 0">{{ totalActiveFilters }} filtro{{ totalActiveFilters === 1 ? '' : 's' }} ativo{{ totalActiveFilters === 1 ? '' : 's' }}</div>

  <GlobeCanvas
    v-if="!erroGlobo"
    :key="chaveGlobo"
    :country-meta="countryMeta"
    :active-filters="activeFilters"
    :agency-counts="agencyCountByCountry"
    @country-click="onCountryClick"
    @ready="isLoading = false"
    @error="onGlobeError"
  />

  <button type="button" class="help-btn" aria-label="Como funciona o mapa" @click="mostrarAjuda = true">
    <span aria-hidden="true">?</span>
  </button>

  <HelpModal v-model="mostrarAjuda" title="Como funciona o globo" video-src="/videos/mapview-explainer.mp4" />
</template>

<style>
/* ── Loading ─────────────────────────────────────────────────────────── */
.globe-loading {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--gb-purple-deep);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(176,31,176,0.25);
  border-top-color: var(--gb-magenta);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading-text {
  font-family: var(--gb-font-eyebrow);
  font-size: 12px;
  font-weight: 700;
  color: var(--gb-accent-light);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.btn-tentar-novamente {
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 11px 22px;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
}
.btn-tentar-novamente:hover { background: rgba(255, 255, 255, 0.1); }
@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Shared panel heading (usado por MapFilterPanel e AgenciesPanel) ───── */
.panel-heading {
  padding: 32px 24px 20px;
  border-bottom: 1px solid var(--gb-purple-deep-16);
  flex-shrink: 0;
}
.panel-eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
}
.panel-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 22px;
  color: var(--gb-dark);
  margin: 8px 0 0;
}

.active-badge {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gb-magenta);
  color: #fff;
  font-family: var(--gb-font-eyebrow);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 9px 20px;
  border-radius: var(--gb-radius-pill);
  box-shadow: 0 8px 24px rgba(176,31,176,0.4);
  z-index: 150;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(6px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Empurra o badge pra cima do painel de agências quando ele vira uma folha
   no rodapé do celular (ver media query em AgenciesPanel.vue). */
@media (max-width: 768px) {
  .active-badge {
    bottom: calc(38vh + 74px + 14px);
  }
}

/* ── Botão de ajuda ──────────────────────────────────────────────────── */
.help-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 1px solid var(--gb-purple-deep-16);
  box-shadow: 0 8px 24px rgba(23, 17, 26, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 22px;
  color: var(--gb-magenta);
  cursor: pointer;
  z-index: 120;
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.help-btn:hover {
  box-shadow: 0 10px 28px rgba(23, 17, 26, 0.34);
}
.help-btn:active {
  transform: scale(0.96);
}
.help-btn:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

/* No celular o rodapé já tem a folha de agências + a barra de abas, então o
   botão migra pro topo, espelhando o pill de "Filtros" do outro lado. */
@media (max-width: 768px) {
  .help-btn {
    top: 88px;
    right: 12px;
    bottom: auto;
    width: 40px;
    height: 40px;
    font-size: 17px;
    box-shadow: 0 4px 16px rgba(23, 17, 26, 0.14);
  }
}
</style>
