<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, computed } from 'vue'
import Globe from 'globe.gl'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import universitiesByCountry from '@/stores/universitiesByCountry'

// ─── Cache de módulo: só faz fetch uma vez por sessão ───────────────────────
let _worldCache = null
async function getWorldData() {
  if (_worldCache) return _worldCache
  _worldCache = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json').then(r => r.json())
  return _worldCache
}

// ─── Refs & estado ──────────────────────────────────────────────────────────
const globeEl = ref(null)
const panelCollapsed = ref(false)
const isLoading = ref(true)

let globe = null
let hoverD = null
let resizeTimer = null
let animationFrame = null
let initFrame = null
let initFrame2 = null
let handleResize = null
let countriesFeatures = []

const openSections = reactive({ emprego: true, universidade: false, idioma: false, cultura: false })
const activeFilters = reactive({ emprego: [], universidade: [], idioma: [], cultura: [] })

// ─── Dados estáticos ────────────────────────────────────────────────────────
const filters = [
  { id: 'emprego', label: 'Emprego', options: [{ value: 'tech', label: 'Tecnologia', count: '4.2k' },{ value: 'saude', label: 'Saúde', count: '1.8k' },{ value: 'engenharia', label: 'Engenharia', count: '2.1k' },{ value: 'financas', label: 'Finanças', count: '900' },{ value: 'educacao', label: 'Educação', count: '3.4k' },{ value: 'artes', label: 'Artes & Design', count: '650' }] },
  { id: 'universidade', label: 'Universidade', options: [{ value: 'top100', label: 'Top 100 Mundial' },{ value: 'bolsas', label: 'Oferece Bolsas' },{ value: 'intercambio', label: 'Intercâmbio' },{ value: 'publicas', label: 'Públicas' },{ value: 'privadas', label: 'Privadas' },{ value: 'ead', label: 'EAD / Online' }] },
  { id: 'idioma', label: 'Idioma', options: [{ value: 'ingles', label: 'Inglês' },{ value: 'espanhol', label: 'Espanhol' },{ value: 'frances', label: 'Francês' },{ value: 'alemao', label: 'Alemão' },{ value: 'mandarin', label: 'Mandarim' },{ value: 'japones', label: 'Japonês' },{ value: 'portugues', label: 'Português' }] },
  { id: 'cultura', label: 'Cultura', options: [{ value: 'gastronomia', label: 'Gastronomia' },{ value: 'musica', label: 'Música' },{ value: 'esportes', label: 'Esportes' },{ value: 'religiao', label: 'Diversidade Religiosa' },{ value: 'festivais', label: 'Festivais' },{ value: 'natureza', label: 'Natureza & Aventura' }] }
]

const agencies = [
  { id: 1, name: 'Japan Express', stars: 5, description: 'Especializada em intercâmbio no Japão com suporte completo em português, visto e moradia.', location: 'Tokyo, Japão', tags: { idioma: ['japones'], universidade: ['intercambio', 'bolsas'] } },
  { id: 2, name: 'Living Japan', stars: 4, description: 'Programas de imersão cultural e linguística em diversas cidades japonesas.', location: 'Osaka, Japão', tags: { idioma: ['japones'], cultura: ['gastronomia', 'festivais'] } },
  { id: 3, name: 'MEXT', stars: 3, description: 'Bolsas governamentais japonesas para graduação e pós-graduação no exterior.', location: 'Kyoto, Japão', tags: { universidade: ['top100', 'bolsas', 'publicas'], idioma: ['japones'] } },
  { id: 4, name: 'EF Education', stars: 5, description: 'Cursos de idiomas em mais de 50 países com certificação internacional reconhecida.', location: 'Londres, Reino Unido', tags: { idioma: ['ingles', 'frances', 'alemao'], universidade: ['intercambio'] } },
  { id: 5, name: 'Campus France', stars: 4, description: 'Agência oficial francesa para estudantes internacionais com bolsas e vistos.', location: 'Paris, França', tags: { idioma: ['frances'], universidade: ['top100', 'bolsas', 'publicas'] } },
  { id: 6, name: 'DAAD Brasil', stars: 5, description: 'Serviço Alemão de Intercâmbio Acadêmico com bolsas para universidades alemãs.', location: 'Berlim, Alemanha', tags: { idioma: ['alemao'], universidade: ['top100', 'bolsas', 'publicas'] } },
  { id: 7, name: 'Study USA', stars: 4, description: 'Intercâmbio nos EUA: high school, college e programas de trabalho.', location: 'Nova York, EUA', tags: { idioma: ['ingles'], universidade: ['top100', 'intercambio', 'privadas'], emprego: ['tech', 'financas'] } },
  { id: 8, name: 'Ibero Intercâmbio', stars: 3, description: 'Programas na Espanha e América Latina com foco em cultura e gastronomia.', location: 'Madrid, Espanha', tags: { idioma: ['espanhol'], cultura: ['gastronomia', 'festivais', 'musica'] } }
]

const countryMeta = {
  'United States of America': { emprego: ['tech','financas','saude','engenharia','educacao','artes'], idioma: ['ingles'], cultura: ['gastronomia','musica','esportes','festivais'], universidade: ['top100','privadas','intercambio'] },
  'United Kingdom': { emprego: ['tech','financas','saude','educacao'], idioma: ['ingles'], cultura: ['musica','festivais','gastronomia'], universidade: ['top100','intercambio'] },
  'Canada': { emprego: ['tech','saude','engenharia','educacao'], idioma: ['ingles','frances'], cultura: ['natureza','esportes'], universidade: ['top100','intercambio','bolsas'] },
  'Australia': { emprego: ['tech','saude','engenharia'], idioma: ['ingles'], cultura: ['natureza','esportes'], universidade: ['intercambio','bolsas'] },
  'Germany': { emprego: ['engenharia','tech','saude'], idioma: ['alemao'], cultura: ['festivais','gastronomia','musica'], universidade: ['top100','publicas','bolsas'] },
  'France': { emprego: ['artes','educacao','financas'], idioma: ['frances'], cultura: ['gastronomia','festivais','musica'], universidade: ['top100','bolsas','publicas'] },
  'Japan': { emprego: ['tech','engenharia'], idioma: ['japones'], cultura: ['gastronomia','festivais','musica'], universidade: ['top100','intercambio'] },
  'China': { emprego: ['tech','engenharia','financas'], idioma: ['mandarin'], cultura: ['gastronomia','festivais'], universidade: ['top100','publicas'] },
  'India': { emprego: ['tech','engenharia','educacao'], idioma: ['ingles'], cultura: ['festivais','gastronomia','religiao'], universidade: ['publicas','privadas'] },
  'Brazil': { emprego: ['engenharia','educacao','artes'], idioma: ['portugues'], cultura: ['musica','esportes','festivais','gastronomia'], universidade: ['publicas','privadas','ead'] },
  'Portugal': { emprego: ['educacao','artes'], idioma: ['portugues'], cultura: ['gastronomia','musica','festivais'], universidade: ['bolsas','intercambio'] },
  'Spain': { emprego: ['artes','educacao'], idioma: ['espanhol'], cultura: ['gastronomia','festivais','musica'], universidade: ['intercambio','bolsas'] },
  'Mexico': { emprego: ['engenharia','educacao'], idioma: ['espanhol'], cultura: ['gastronomia','festivais','musica'], universidade: ['publicas','privadas'] },
  'Argentina': { emprego: ['educacao','artes'], idioma: ['espanhol'], cultura: ['esportes','gastronomia','musica'], universidade: ['publicas'] },
  'Netherlands': { emprego: ['tech','financas','engenharia'], idioma: ['ingles'], cultura: ['festivais'], universidade: ['top100','intercambio'] },
  'Sweden': { emprego: ['tech','engenharia','saude'], idioma: ['ingles'], cultura: ['natureza'], universidade: ['top100','bolsas','publicas'] },
  'Norway': { emprego: ['engenharia','saude'], idioma: ['ingles'], cultura: ['natureza'], universidade: ['bolsas','publicas'] },
  'Switzerland': { emprego: ['financas','saude','tech'], idioma: ['alemao','frances'], universidade: ['top100'], cultura: [] },
  'South Korea': { emprego: ['tech','engenharia'], idioma: ['ingles'], cultura: ['musica','gastronomia'], universidade: ['top100','intercambio'] },
  'New Zealand': { emprego: ['saude','educacao'], idioma: ['ingles'], cultura: ['natureza','esportes'], universidade: ['intercambio','bolsas'] },
  'Ireland': { emprego: ['tech','financas'], idioma: ['ingles'], cultura: ['musica','festivais'], universidade: ['intercambio'] },
  'Singapore': { emprego: ['tech','financas','engenharia'], idioma: ['ingles'], universidade: ['top100'], cultura: [] },
  'Finland': { emprego: ['tech','educacao'], idioma: ['ingles'], cultura: ['natureza'], universidade: ['top100','bolsas','publicas'] },
  'Denmark': { emprego: ['tech','saude','engenharia'], idioma: ['ingles'], cultura: ['natureza'], universidade: ['bolsas','publicas'] },
  'Italy': { emprego: ['artes','educacao'], idioma: ['ingles'], cultura: ['gastronomia','musica','festivais'], universidade: ['top100','intercambio'] }
}

let colorScale

// ─── Computed ────────────────────────────────────────────────────────────────
const totalActiveFilters = computed(() =>
  Object.values(activeFilters).reduce((acc, arr) => acc + arr.length, 0)
)

const filteredAgencies = computed(() => {
  if (totalActiveFilters.value === 0) return agencies
  return agencies.filter(agency => {
    for (const [cat, selected] of Object.entries(activeFilters)) {
      if (selected.length === 0) continue
      const values = agency.tags?.[cat] ?? []
      if (!selected.some(v => values.includes(v))) return false
    }
    return true
  })
})

// ─── Lógica de filtros ───────────────────────────────────────────────────────
function countryMatchesFilters(name) {
  if (totalActiveFilters.value === 0) return true
  const meta = countryMeta[name]
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
  // 1. Busca dados (usa cache se já foi carregado antes)
  const world = await getWorldData()
  const countries = topojson.feature(world, world.objects.countries)
  countries.features.forEach(d => {
    d.properties.universities = universitiesByCountry[d.properties.name] ?? 0
  })
  countriesFeatures = countries.features

  const maxUniv = Math.max(...countries.features.map(d => d.properties.universities), 1)
  colorScale = d3.scaleSequentialSqrt(d3.interpolateRgb('#4A1F52', '#B01FB0')).domain([0, maxUniv])

  // 2. Limpa instância anterior se existir
  if (globeEl.value) {
    while (globeEl.value.firstChild) globeEl.value.removeChild(globeEl.value.firstChild)
  }

  // 3. Inicializa o globo SEM polígonos primeiro (WebGL sobe mais rápido)
  globe = Globe()(globeEl.value)
    .width(window.innerWidth)
    .height(window.innerHeight)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .backgroundColor('#2E0A2E')

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
        .polygonSideColor(() => 'rgba(176,31,176,0.25)')
        .polygonStrokeColor(() => '#2E0A2E')
        .polygonLabel(d => `<b>${d.properties.name}</b><br/>Universidades: ${d.properties.universities}`)
        .onPolygonHover(d => { hoverD = d; refreshGlobe() })
        .onPolygonClick(d => {
          const [lng, lat] = d3.geoCentroid(d)
          globe.pointOfView({ lat, lng, altitude: 1.4 }, 1000)
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
})

onBeforeUnmount(() => {
  if (initFrame) { cancelAnimationFrame(initFrame); initFrame = null }
  if (initFrame2) { cancelAnimationFrame(initFrame2); initFrame2 = null }
  if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null }
  if (resizeTimer) { clearTimeout(resizeTimer); resizeTimer = null }
  if (handleResize) { window.removeEventListener('resize', handleResize); handleResize = null }

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

  <aside class="filter-panel" :class="{ collapsed: panelCollapsed }">
    <button class="collapse-btn" @click="panelCollapsed = !panelCollapsed" :aria-label="panelCollapsed ? 'Expandir filtros' : 'Recolher filtros'">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" :style="{ transform: panelCollapsed ? 'rotate(180deg)' : 'none' }">
        <path d="M10 3L5 8L10 13" stroke="#17111A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <div class="panel-inner">
      <div class="panel-heading">
        <span class="panel-eyebrow">Explorar por</span>
        <h2 class="panel-title">Filtros</h2>
      </div>

      <div class="filter-section" v-for="section in filters" :key="section.id">
        <div class="section-header" @click="toggleSection(section.id)">
          <span class="section-label">{{ section.label }}</span>
          <span class="section-count" v-if="activeFilters[section.id]?.length">{{ activeFilters[section.id].length }}</span>
          <svg class="section-arrow" :class="{ open: openSections[section.id] }" width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="#757067" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="section-options" :class="{ open: openSections[section.id] }">
          <div v-for="opt in section.options" :key="opt.value" class="option-item" :class="{ active: activeFilters[section.id]?.includes(opt.value) }" @click="toggleFilter(section.id, opt.value)">
            <span class="option-check">
              <svg v-if="activeFilters[section.id]?.includes(opt.value)" width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L4.8 8.8L10 3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="option-text">{{ opt.label }}</span>
            <span class="option-count" v-if="opt.count">{{ opt.count }}</span>
          </div>
        </div>
      </div>
      <button class="clear-btn" @click="clearFilters">Limpar filtros</button>
    </div>
  </aside>

  <aside class="agencies-panel">
    <div class="panel-heading">
      <span class="panel-eyebrow">{{ filteredAgencies.length }} encontrada{{ filteredAgencies.length === 1 ? '' : 's' }}</span>
      <h2 class="panel-title">Agências</h2>
    </div>
    <div class="agencies-list">
      <div v-for="agency in filteredAgencies" :key="agency.id" class="agency-card">
        <div class="agency-header">
          <span class="agency-name">{{ agency.name }}</span>
          <span class="agency-stars">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= agency.stars }">★</span>
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
          <button class="agency-btn">Acessar</button>
        </div>
      </div>
      <p v-if="filteredAgencies.length === 0" class="no-agencies">Nenhuma agência para os filtros selecionados.</p>
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
  background: var(--gb-cream);
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
  padding: 16px 8px;
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
  padding: 9px 8px 9px 4px;
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
  background: var(--gb-cream);
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
}
.agency-btn:hover { background: var(--gb-magenta); }
.no-agencies {
  font-size: 12px;
  color: var(--gb-ink-faint);
  text-align: center;
  padding: 20px 0;
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
</style>