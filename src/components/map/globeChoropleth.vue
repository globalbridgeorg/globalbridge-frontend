<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, computed } from 'vue'
import Globe from 'globe.gl'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import universitiesByCountry from '@/stores/universitiesByCountry'
import axios from '@/services/axios'

// ─── Cache de módulo: só faz fetch uma vez por sessão ───────────────────────
let _worldCache = null
async function getWorldData() {
  if (_worldCache) return _worldCache
  _worldCache = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json').then(r => r.json())
  return _worldCache
}

// ─── Refs & estado ──────────────────────────────────────────────────────────
const globeEl = ref(null)
// No celular o painel de filtros começa fechado (é um overlay que desliza por
// cima do globo, não uma coluna fixa ao lado como no desktop).
const panelCollapsed = ref(window.matchMedia('(max-width: 768px)').matches)
// Painel de agências no celular: começa "espiando" (peek) embaixo do globo;
// tocar no cabeçalho expande pra ver a lista inteira.
const agenciesExpanded = ref(false)
const isLoading = ref(true)

let globe = null
let hoverD = null
let resizeTimer = null
let animationFrame = null
let initFrame = null
let initFrame2 = null
let handleResize = null
let handleVisibility = null
let countriesFeatures = []

const openSections = reactive({ emprego: true, universidade: false, idioma: false, cultura: false })
const activeFilters = reactive({ emprego: [], universidade: [], idioma: [], cultura: [] })

// ─── Categorias do painel de filtros ────────────────────────────────────────
// Os rótulos ficam aqui (são fixos), mas os países/agências e a contagem de
// cada opção vêm da API — nada abaixo é mais mock.
const FILTER_LABELS = {
  emprego: { label: 'Emprego', options: { tech: 'Tecnologia', saude: 'Saúde', engenharia: 'Engenharia', financas: 'Finanças', educacao: 'Educação', artes: 'Artes & Design' } },
  universidade: { label: 'Universidade', options: { top100: 'Top 100 Mundial', bolsas: 'Oferece Bolsas', intercambio: 'Intercâmbio', publicas: 'Públicas', privadas: 'Privadas', ead: 'EAD / Online' } },
  idioma: { label: 'Idioma', options: { ingles: 'Inglês', espanhol: 'Espanhol', frances: 'Francês', alemao: 'Alemão', mandarin: 'Mandarim', japones: 'Japonês', portugues: 'Português' } },
  cultura: { label: 'Cultura', options: { gastronomia: 'Gastronomia', musica: 'Música', esportes: 'Esportes', religiao: 'Diversidade Religiosa', festivais: 'Festivais', natureza: 'Natureza & Aventura' } }
}

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
    updateCountryMatches()
    refreshGlobe()
  }
}

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

let colorScale

// ─── Computed ────────────────────────────────────────────────────────────────
const totalActiveFilters = computed(() =>
  Object.values(activeFilters).reduce((acc, arr) => acc + arr.length, 0)
)

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

// ─── Lógica de filtros ───────────────────────────────────────────────────────
function countryMatchesFilters(name) {
  if (totalActiveFilters.value === 0) return true
  const meta = countryMeta.value[name]
  if (!meta) return false
  for (const [cat, selected] of Object.entries(activeFilters)) {
    if (selected.length === 0) continue
    const values = meta[cat] ?? []
    if (!selected.some(v => values.includes(v))) return false
  }
  return true
}

function updateCountryMatches() {
  const hasFilters = totalActiveFilters.value > 0
  countriesFeatures.forEach(d => {
    d.properties.matchesFilter = hasFilters ? countryMatchesFilters(d.properties.name) : true
  })
}

function getPolygonAltitude(d) {
  if (!d.properties.matchesFilter) return 0.005
  return d === hoverD ? 0.06 : 0.02
}

function refreshGlobe() {
  if (!globe || !countriesFeatures.length) return
  if (animationFrame) cancelAnimationFrame(animationFrame)
  animationFrame = requestAnimationFrame(() => {
    if (!globe) return
    globe
      .polygonCapColor(d => d.properties.matchesFilter ? colorScale(d.properties.universities) : 'rgba(20,5,30,0.35)')
      .polygonAltitude(getPolygonAltitude)
    animationFrame = null
  })
}

function toggleSection(id) { openSections[id] = !openSections[id] }

function toggleFilter(sectionId, value) {
  const arr = activeFilters[sectionId]
  const idx = arr.indexOf(value)
  idx === -1 ? arr.push(value) : arr.splice(idx, 1)
  updateCountryMatches()
  refreshGlobe()
}

function clearFilters() {
  Object.keys(activeFilters).forEach(k => (activeFilters[k] = []))
  updateCountryMatches()
  refreshGlobe()
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  // 0. Busca países/agências reais em paralelo — não bloqueia o globo, só o
  //    painel de filtros e a lista de agências (ficam vazios até chegar).
  carregarDadosDoMapa()

  // 1. Busca dados (usa cache se já foi carregado antes)
  const world = await getWorldData()
  const countries = topojson.feature(world, world.objects.countries)
  countries.features.forEach(d => {
    d.properties.universities = universitiesByCountry[d.properties.name] ?? 0
  })
  countriesFeatures = countries.features

  const maxUniv = Math.max(...countries.features.map(d => d.properties.universities), 1)
  colorScale = d3.scaleSequentialSqrt(d3.interpolatePurples).domain([0, maxUniv])

  // 2. Limpa instância anterior se existir
  if (globeEl.value) {
    while (globeEl.value.firstChild) globeEl.value.removeChild(globeEl.value.firstChild)
  }

  // 3. Inicializa o globo SEM polígonos primeiro (WebGL sobe mais rápido)
  // powerPreference força o navegador a usar a GPU dedicada em notebooks
  // com chip híbrido, em vez da integrada (que é a causa mais comum de
  // um WebGL "pesado" sem motivo aparente) — não afeta a qualidade visual.
  globe = Globe({ rendererConfig: { powerPreference: 'high-performance' } })(globeEl.value)
    .width(window.innerWidth)
    .height(window.innerHeight)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .backgroundColor('#3b1060')

  const renderer = globe.renderer?.()
  if (renderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))

  // Configura controles imediatamente
  const controls = globe.controls()
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.3
  controls.enableZoom = true
  controls.enablePan = true
  controls.maxDistance = globe.getGlobeRadius() * 3.5
  controls.minDistance = globe.getGlobeRadius() * 2.5

  updateCountryMatches()

  // 4. Adiciona polígonos em dois frames — deixa o WebGL renderizar o globo
  //    base antes de computar todos os países (evita o freeze na entrada)
  initFrame = requestAnimationFrame(() => {
    initFrame2 = requestAnimationFrame(() => {
      initFrame2 = null
      if (!globe) return
      globe
        .polygonsData(countries.features)
        .polygonAltitude(getPolygonAltitude)
        .polygonCapColor(d => d.properties.matchesFilter ? colorScale(d.properties.universities) : 'rgba(20,5,30,0.35)')
        .polygonSideColor(() => 'rgba(128,0,128,0.25)')
        .polygonStrokeColor(() => '#2d004b')
        .polygonLabel(d => `<b>${d.properties.name}</b><br/>Universidades: ${d.properties.universities}`)
        .onPolygonHover(d => { hoverD = d; refreshGlobe() })
        .onPolygonClick(d => {
          const [lng, lat] = d3.geoCentroid(d)
          globe.pointOfView({ lat, lng, altitude: 1.4 }, 1000)
          const nomeIngles = d.properties.name
          selectedCountry.value = {
            nomeIngles,
            nomePt: nomePtPorNomeIngles.value[nomeIngles] ?? nomeIngles
          }
        })

      // Remove tela de loading após polígonos carregarem
      isLoading.value = false
    })
    initFrame = null
  })

  // 5. Resize com throttle
  handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (globe) globe.width(window.innerWidth).height(window.innerHeight)
    }, 150)
  }
  window.addEventListener('resize', handleResize)

  // 6. Pausa o loop de render (e a auto-rotação) quando a aba não está
  //    visível — o globo continua rodando em segundo plano se não fizermos
  //    isso, gastando GPU/CPU à toa enquanto ninguém está olhando.
  handleVisibility = () => {
    if (!globe) return
    if (document.hidden) {
      globe.pauseAnimation()
    } else {
      globe.resumeAnimation()
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)
})

onBeforeUnmount(() => {
  if (initFrame) { cancelAnimationFrame(initFrame); initFrame = null }
  if (initFrame2) { cancelAnimationFrame(initFrame2); initFrame2 = null }
  if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null }
  if (resizeTimer) { clearTimeout(resizeTimer); resizeTimer = null }
  if (handleResize) { window.removeEventListener('resize', handleResize); handleResize = null }
  if (handleVisibility) { document.removeEventListener('visibilitychange', handleVisibility); handleVisibility = null }

  if (globe) {
    if (globe.controls) {
      const controls = globe.controls()
      controls.autoRotate = false
      controls.dispose?.()
    }
    const renderer = globe.renderer?.()
    if (renderer) {
      renderer.dispose()
      renderer.domElement?.remove()
    }
    if (globeEl.value) {
      while (globeEl.value.firstChild) globeEl.value.removeChild(globeEl.value.firstChild)
    }
    globe._destructor?.()
    globe = null
  }
})
</script>

<template>
  <!-- Loading overlay -->
  <Transition name="fade">
    <div v-if="isLoading" class="globe-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">Carregando mapa...</p>
    </div>
  </Transition>

  <!-- Botão flutuante e fundo escurecido: só existem visualmente no celular
       (ver media query no <style>), onde o painel de filtros vira um overlay
       que desliza por cima do globo em vez de uma coluna fixa ao lado. -->
  <button class="mobile-filter-toggle" @click="panelCollapsed = !panelCollapsed" :aria-label="panelCollapsed ? 'Abrir filtros' : 'Fechar filtros'">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17111A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>
    <span>Filtros</span>
    <span v-if="totalActiveFilters > 0" class="badge">{{ totalActiveFilters }}</span>
  </button>
  <div v-if="!panelCollapsed" class="filter-backdrop" @click="panelCollapsed = true"></div>

  <aside class="filter-panel" :class="{ collapsed: panelCollapsed }">
    <button class="collapse-btn" @click="panelCollapsed = !panelCollapsed" :aria-label="panelCollapsed ? 'Expandir filtros' : 'Recolher filtros'">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" :style="{ transform: panelCollapsed ? 'rotate(180deg)' : 'none' }">
        <path d="M10 3L5 8L10 13" stroke="#17111A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <div class="panel-inner" data-lenis-prevent>
      <div class="panel-heading">
        <span class="panel-eyebrow">Explorar por</span>
        <h2 class="panel-title">Filtros</h2>
      </div>

      <div class="filter-section" v-for="section in filters" :key="section.id">
        <button
          type="button"
          class="section-header"
          @click="toggleSection(section.id)"
          :aria-expanded="openSections[section.id]"
          :aria-controls="`filtro-opcoes-${section.id}`"
        >
          <span class="section-label">{{ section.label }}</span>
          <span class="section-count" v-if="activeFilters[section.id]?.length">{{ activeFilters[section.id].length }}</span>
          <svg class="section-arrow" :class="{ open: openSections[section.id] }" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6L8 10L12 6" stroke="#757067" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div :id="`filtro-opcoes-${section.id}`" class="section-options" :class="{ open: openSections[section.id] }">
          <button
            v-for="opt in section.options"
            :key="opt.value"
            type="button"
            class="option-item"
            :class="{ active: activeFilters[section.id]?.includes(opt.value) }"
            :aria-pressed="activeFilters[section.id]?.includes(opt.value)"
            @click="toggleFilter(section.id, opt.value)"
          >
            <span class="option-check" aria-hidden="true">
              <svg v-if="activeFilters[section.id]?.includes(opt.value)" width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L4.8 8.8L10 3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="option-text">{{ opt.label }}</span>
            <span class="option-count" v-if="opt.count">{{ opt.count }}</span>
          </button>
        </div>
      </div>
      <button class="clear-btn" @click="clearFilters">Limpar filtros</button>
    </div>
  </aside>

  <aside class="agencies-panel" :class="{ expanded: agenciesExpanded }">
    <!-- No celular esse painel é uma folha que "espia" embaixo do globo;
         tocar no cabeçalho expande pra ver a lista inteira (no desktop o
         clique não muda nada visualmente, já mostra tudo). -->
    <div
      class="panel-heading"
      role="button"
      tabindex="0"
      :aria-expanded="agenciesExpanded"
      aria-label="Expandir ou recolher a lista de agências"
      @click="agenciesExpanded = !agenciesExpanded"
      @keydown.enter="agenciesExpanded = !agenciesExpanded"
      @keydown.space.prevent="agenciesExpanded = !agenciesExpanded"
    >
      <span class="panel-eyebrow">{{ filteredAgencies.length }} encontrada{{ filteredAgencies.length === 1 ? '' : 's' }}</span>
      <h2 class="panel-title">Agências</h2>
      <div v-if="selectedCountry" class="country-badge">
        <span>{{ selectedCountry.nomePt }}</span>
        <button class="country-badge-clear" @click.stop="clearSelectedCountry" aria-label="Ver agências de todos os países">✕</button>
      </div>
    </div>
    <div class="agencies-list" data-lenis-prevent>
      <p v-if="carregandoDados" class="agencies-loading">Carregando agências...</p>
      <div v-for="agency in filteredAgencies" :key="agency.id" class="agency-card">
        <div class="agency-header">
          <span class="agency-name">{{ agency.name }}</span>
          <span class="agency-stars" role="img" :aria-label="`${agency.stars} de 5 estrelas`">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= agency.stars }" aria-hidden="true">{{ i <= agency.stars ? '★' : '☆' }}</span>
          </span>
        </div>
        <p class="agency-desc">{{ agency.description }}</p>
        <div class="agency-footer">
          <span class="agency-location">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="#757067" stroke-width="1.3" />
              <circle cx="8" cy="6" r="1.6" stroke="#757067" stroke-width="1.3" />
            </svg>
            {{ agency.location }}
          </span>
          <router-link :to="{ name: 'agencia', params: { id: agency.id } }" class="agency-btn">Acessar</router-link>
        </div>
      </div>
      <p v-if="!carregandoDados && filteredAgencies.length === 0" class="no-agencies">
        {{ selectedCountry ? `Ainda não há agências cadastradas em ${selectedCountry.nomePt}.` : 'Nenhuma agência para os filtros selecionados.' }}
      </p>
    </div>
  </aside>

  <div class="active-badge" v-if="totalActiveFilters > 0">{{ totalActiveFilters }} filtro{{ totalActiveFilters === 1 ? '' : 's' }} ativo{{ totalActiveFilters === 1 ? '' : 's' }}</div>
  <div ref="globeEl" class="globe-wrap"></div>
</template>

<style>
.globe-wrap {
  position: fixed;
  inset: 0;
  z-index: 0;
  cursor: grab;
}
.globe-wrap:active { cursor: grabbing; }

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
@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Shared panel heading ────────────────────────────────────────────── */
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

/* ── Filter panel ────────────────────────────────────────────────────── */
.filter-panel {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 300px;
  background: white;
  border-right: 1px solid var(--gb-purple-deep-16);
  transition: transform 0.35s cubic-bezier(.4,0,.2,1);
  z-index: 100;
  display: flex;
  flex-direction: column;
}
.filter-panel.collapsed { transform: translateX(-268px); }
.collapse-btn {
  position: absolute;
  top: 50%;
  right: -16px;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(23,17,26,0.14);
  z-index: 101;
}
.collapse-btn:hover { background: var(--gb-cream); }
.collapse-btn svg { transition: transform 0.25s ease; }
.panel-inner {
  padding: 8px 16px 16px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.filter-section { border-bottom: 1px solid var(--gb-purple-deep-16); }
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 16px 8px;
  background: none;
  border: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.section-header:hover .section-label { color: var(--gb-magenta); }
.section-label {
  flex: 1;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.1em;
  color: var(--gb-dark);
  text-transform: uppercase;
  transition: color 0.15s ease;
}
.section-count {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  color: #fff;
  background: var(--gb-magenta);
  border-radius: var(--gb-radius-pill);
  padding: 2px 8px;
}
.section-arrow {
  flex-shrink: 0;
  transition: transform 0.25s;
}
.section-arrow.open { transform: rotate(180deg); }
.section-options {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(.4,0,.2,1);
}
.section-options.open { max-height: 400px; }
.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 8px 9px 4px;
  background: none;
  border: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
}
.option-item:hover { background: rgba(46,10,46,0.04); }
.option-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1.5px solid var(--gb-purple-deep-16);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.option-item.active .option-check {
  background: var(--gb-magenta);
  border-color: transparent;
}
.option-text {
  flex: 1;
  font-size: 13px;
  color: var(--gb-dark);
}
.option-count {
  font-family: var(--gb-font-eyebrow);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--gb-ink-faint);
  background: var(--gb-purple-deep-16);
  padding: 2px 8px;
  border-radius: var(--gb-radius-pill);
}
.clear-btn {
  margin: 20px 8px 4px;
  padding: 11px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 12px;
  background: transparent;
  color: var(--gb-dark);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.08em;
  cursor: pointer;
  text-transform: uppercase;
}
.clear-btn:hover { background: rgba(46,10,46,0.04); }

/* ── Agencies panel ──────────────────────────────────────────────────── */
.agencies-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 320px;
  background: white;
  border-left: 1px solid var(--gb-purple-deep-16);
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.agencies-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.agency-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.agency-card:hover {
  box-shadow: 0 8px 20px rgba(23,17,26,0.08);
  border-color: var(--gb-magenta);
}
.agency-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.agency-name {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 14px;
  color: var(--gb-dark);
  text-transform: uppercase;
}
.agency-stars { white-space: nowrap; }
.star { font-size: 12px; color: var(--gb-purple-deep-16); }
.star.filled { color: var(--gb-magenta); }
.agency-desc { font-size: 12px; color: var(--gb-ink-soft); line-height: 1.55; margin: 0; }
.agency-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
.agency-location {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--gb-ink-faint);
}
.agency-btn {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  border-radius: var(--gb-radius-pill);
  padding: 6px 14px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  cursor: pointer;
  text-transform: uppercase;
  white-space: nowrap;
  text-decoration: none;
  display: inline-block;
}
.agency-btn:hover { background: var(--gb-magenta); }
.no-agencies {
  font-size: 12px;
  color: var(--gb-ink-faint);
  text-align: center;
  padding: 20px 0;
}
.agencies-loading {
  font-size: 12px;
  color: var(--gb-ink-faint);
  text-align: center;
  padding: 20px 0;
}
.country-badge {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--gb-pink);
  color: var(--gb-magenta-strong);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 5px 6px 5px 12px;
  border-radius: var(--gb-radius-pill);
}
.country-badge-clear {
  background: rgba(122, 15, 116, 0.14);
  border: none;
  color: var(--gb-magenta-strong);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.country-badge-clear:hover {
  background: rgba(122, 15, 116, 0.24);
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

/* ── Mobile ──────────────────────────────────────────────────────────────
   No desktop os dois painéis são colunas fixas de 300/320px lado a lado
   com o globo. Isso não cabe num celular, então aqui: o painel de filtros
   vira um overlay que desliza da esquerda (aberto por um botão flutuante,
   com fundo escurecido atrás), e o painel de agências vira uma folha que
   "espia" embaixo do globo — toca no cabeçalho pra expandir. */
.mobile-filter-toggle,
.filter-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .mobile-filter-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    position: fixed;
    top: 88px;
    left: 12px;
    z-index: 60;
    background: #fff;
    border: 1px solid var(--gb-purple-deep-16);
    border-radius: var(--gb-radius-pill);
    padding: 10px 16px;
    font-family: var(--gb-font-eyebrow);
    font-weight: 700;
    font-size: 11.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--gb-dark);
    box-shadow: 0 4px 16px rgba(23, 17, 26, 0.14);
    cursor: pointer;
  }
  .mobile-filter-toggle .badge {
    background: var(--gb-magenta);
    color: #fff;
    font-size: 10.5px;
    font-weight: 700;
    border-radius: 999px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
  }

  .filter-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(23, 17, 26, 0.45);
    z-index: 99;
  }

  .filter-panel {
    width: 86vw;
    max-width: 340px;
    height: auto;
    top: 0;
    bottom: 74px;
    box-shadow: 8px 0 30px rgba(0, 0, 0, 0.25);
  }
  .filter-panel.collapsed {
    transform: translateX(-100%);
  }
  .collapse-btn {
    /* substituído pelo botão flutuante + fundo escurecido no celular */
    display: none;
  }

  .agencies-panel {
    top: auto;
    left: 0;
    right: 0;
    bottom: 74px;
    width: 100%;
    height: 38vh;
    max-height: 38vh;
    border-left: none;
    border-top: 1px solid var(--gb-purple-deep-16);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.25);
    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 90;
  }
  .agencies-panel.expanded {
    height: 80vh;
    max-height: 80vh;
  }
  .agencies-panel .panel-heading {
    position: relative;
    padding: 22px 20px 14px;
    cursor: pointer;
  }
  .agencies-panel .panel-heading::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    border-radius: 3px;
    background: var(--gb-purple-deep-16);
  }

  .active-badge {
    bottom: calc(38vh + 74px + 14px);
  }
}
</style>