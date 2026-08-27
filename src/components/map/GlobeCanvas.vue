<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Globe from 'globe.gl'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const props = defineProps({
  // { [nomeIngles]: { [categoria]: [valores] } } — tags do país, vindas da API.
  countryMeta: { type: Object, default: () => ({}) },
  activeFilters: {
    type: Object,
    default: () => ({ emprego: [], universidade: [], idioma: [], cultura: [] })
  },
  // { [nomeIngles]: quantidade } — quantas agências reais tem em cada país,
  // vindas da API. É isso que colore o mapa agora (antes era um número fixo
  // de universidades, sem relação com dado real da plataforma).
  agencyCounts: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['ready', 'error', 'country-click'])

// ─── Cache de módulo: só faz fetch uma vez por sessão ───────────────────────
let _worldCache = null
async function getWorldData() {
  if (_worldCache) return _worldCache
  _worldCache = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json').then(r => r.json())
  return _worldCache
}

const globeEl = ref(null)

let globe = null
let hoverD = null
let resizeTimer = null
let animationFrame = null
let initFrame = null
let initFrame2 = null
let handleResize = null
let handleVisibility = null
let countriesFeatures = []
let colorScale

function totalActiveFilters() {
  return Object.values(props.activeFilters).reduce((acc, arr) => acc + (arr?.length ?? 0), 0)
}

function countryMatchesFilters(name) {
  if (totalActiveFilters() === 0) return true
  const meta = props.countryMeta[name]
  if (!meta) return false
  for (const [cat, selected] of Object.entries(props.activeFilters)) {
    if (!selected?.length) continue
    const values = meta[cat] ?? []
    if (!selected.some(v => values.includes(v))) return false
  }
  return true
}

function updateCountryMatches() {
  const hasFilters = totalActiveFilters() > 0
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
      .polygonCapColor(d => d.properties.matchesFilter ? colorScale(d.properties.agencias) : 'rgba(20,5,30,0.35)')
      .polygonAltitude(getPolygonAltitude)
    animationFrame = null
  })
}

// As agências chegam da API depois do globo já estar de pé (fetch
// assíncrono no componente pai) — recalcula a contagem por país e reescala
// as cores quando `agencyCounts` chegar ou mudar.
function updateAgencyCounts() {
  if (!countriesFeatures.length) return
  countriesFeatures.forEach(d => {
    d.properties.agencias = props.agencyCounts[d.properties.name] ?? 0
  })
  const max = Math.max(...countriesFeatures.map(d => d.properties.agencias), 1)
  colorScale = d3.scaleSequentialSqrt(d3.interpolatePurples).domain([0, max])
}

// Reage a mudanças vindas do componente pai (filtros ativos, tags e
// contagem de agências dos países chegando da API).
watch(() => [props.activeFilters, props.countryMeta, props.agencyCounts], () => {
  updateAgencyCounts()
  updateCountryMatches()
  refreshGlobe()
}, { deep: true })

onMounted(async () => {
  try {
    await montarGlobo()
  } catch (e) {
    // Sem isso, qualquer falha aqui (CDN externo fora do ar, WebGL
    // bloqueado, etc.) deixava a tela de "Carregando mapa..." girando pra
    // sempre — nada nunca chamava emit('ready') pra tirar ela dali.
    console.error('Erro ao montar o globo 3D:', e)
    emit('error', e)
  }
})

async function montarGlobo() {
  // 1. Busca dados (usa cache se já foi carregado antes)
  const world = await getWorldData()
  const countries = topojson.feature(world, world.objects.countries)
  countriesFeatures = countries.features
  updateAgencyCounts()

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
      try {
        globe
          .polygonsData(countries.features)
          .polygonAltitude(getPolygonAltitude)
          .polygonCapColor(d => d.properties.matchesFilter ? colorScale(d.properties.agencias) : 'rgba(20,5,30,0.35)')
          .polygonSideColor(() => 'rgba(128,0,128,0.25)')
          .polygonStrokeColor(() => '#2d004b')
          .polygonLabel(d => `<b>${d.properties.name}</b><br/>${d.properties.agencias} agência${d.properties.agencias === 1 ? '' : 's'}`)
          .onPolygonHover(d => { hoverD = d; refreshGlobe() })
          .onPolygonClick(d => {
            const [lng, lat] = d3.geoCentroid(d)
            globe.pointOfView({ lat, lng, altitude: 1.4 }, 1000)
            emit('country-click', d.properties.name)
          })

        // Avisa o pai que pode remover a tela de loading
        emit('ready')
      } catch (e) {
        // Roda dentro de requestAnimationFrame — um try/catch lá fora em
        // volta de montarGlobo() não pega erro daqui, porque essa parte
        // não é aguardada (await), só agendada.
        console.error('Erro ao montar os polígonos do globo 3D:', e)
        emit('error', e)
      }
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
}

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
</style>
