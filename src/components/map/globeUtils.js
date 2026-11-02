import axios from '@/services/axios'

// ─── Cache de módulo: só faz fetch uma vez por sessão ───────────────────────
let _worldCache = null
export async function getWorldData() {
  if (_worldCache) return _worldCache
  _worldCache = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json').then(r => r.json())
  return _worldCache
}

// Sem filtro ativo tudo passa; com filtro, precisa bater ao menos um valor
// selecionado em CADA categoria filtrada. Vale pra países e agências.
export function matchesFilters(tags, activeFilters) {
  for (const [cat, selected] of Object.entries(activeFilters)) {
    if (!selected?.length) continue
    const values = tags?.[cat] ?? []
    if (!selected.some(v => values.includes(v))) return false
  }
  return true
}

function agruparTagsPorCategoria(tags) {
  const grupos = {}
  for (const tag of tags ?? []) {
    if (!grupos[tag.categoria]) grupos[tag.categoria] = []
    grupos[tag.categoria].push(tag.valor)
  }
  return grupos
}

const lista = (data) => (Array.isArray(data) ? data : (data.results ?? []))

// Busca países e agências da API e já devolve no formato que o mapa usa.
export async function fetchMapData() {
  const [resPaises, resAgencias] = await Promise.all([
    axios.get('/paises/'),
    axios.get('/agencia/')
  ])

  const countryMeta = {}
  const nomesPt = {}
  for (const pais of lista(resPaises.data)) {
    if (!pais.nome_ingles) continue
    countryMeta[pais.nome_ingles] = agruparTagsPorCategoria(pais.tags)
    nomesPt[pais.nome_ingles] = pais.nome
  }

  const agencies = lista(resAgencias.data).map((a) => ({
    id: a.id,
    name: a.nome,
    stars: Math.round(a.nota_media ?? 0),
    description: a.descricao,
    location: a.cidade && a.pais ? `${a.cidade}, ${a.pais}` : (a.pais ?? ''),
    paisNomeIngles: a.pais_nome_ingles,
    tags: agruparTagsPorCategoria(a.tags)
  }))

  return { countryMeta, nomesPt, agencies }
}

// Libera WebGL, controles e DOM de uma instância do globe.gl
export function destroyGlobe(globe, el) {
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
  if (el) {
    while (el.firstChild) el.removeChild(el.firstChild)
  }
  globe._destructor?.()
}
