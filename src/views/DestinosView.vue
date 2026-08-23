<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import PaisCard from '@/components/catalog/PaisCard.vue'

gsap.registerPlugin(ScrollTrigger)

const REGIOES = [
  { valor: 'asia', label: 'Ásia' },
  { valor: 'europa', label: 'Europa' },
  { valor: 'america_norte', label: 'América do Norte' },
  { valor: 'america_sul', label: 'América do Sul' },
  { valor: 'oceania', label: 'Oceania' },
  { valor: 'africa', label: 'África' }
]

const route = useRoute()
const router = useRouter()

const paises = ref([])
const carregando = ref(true)
const erro = ref(false)

const regiaoAtiva = computed(() => route.query.regiao ?? '')

function selecionarRegiao(valor) {
  router.push({ path: '/destinos', query: valor ? { regiao: valor } : {} })
}

async function carregarPaises() {
  carregando.value = true
  erro.value = false
  try {
    const params = regiaoAtiva.value ? { regiao: regiaoAtiva.value } : {}
    const { data } = await axios.get('/paises/', { params })
    paises.value = Array.isArray(data) ? data : (data.results ?? [])
  } catch (e) {
    console.error('Erro ao buscar destinos:', e)
    erro.value = true
  } finally {
    carregando.value = false
  }
}

let ctx
function animarGrid() {
  if (prefersReducedMotion()) return
  ctx?.revert()
  ctx = gsap.context(() => {
    const grid = document.querySelector('.destinos-grid')
    if (!grid) return
    gsap.from(grid.children, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.out'
    })
  })
}

watch(regiaoAtiva, carregarPaises)

onMounted(async () => {
  await carregarPaises()
  await nextTick()
  animarGrid()
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="destinos-view gb-section">
    <div class="hero">
      <span class="hero-eyebrow">Explore o mapa</span>
      <h1 class="gb-heading">Todos os <span class="accent">destinos</span></h1>
      <p>Filtre por região pra achar o próximo passo.</p>
    </div>

    <div class="region-filters" role="group" aria-label="Filtrar por região">
      <button class="region-chip" :class="{ active: !regiaoAtiva }" @click="selecionarRegiao('')">Todos</button>
      <button
        v-for="regiao in REGIOES"
        :key="regiao.valor"
        class="region-chip"
        :class="{ active: regiaoAtiva === regiao.valor }"
        @click="selecionarRegiao(regiao.valor)"
      >
        {{ regiao.label }}
      </button>
    </div>

    <div class="destinos">
      <SectionEyebrow :label="carregando ? 'Carregando' : `${paises.length} destino${paises.length === 1 ? '' : 's'} encontrado${paises.length === 1 ? '' : 's'}`" />

      <div v-if="carregando" class="pais-skeleton" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </div>

      <p v-else-if="erro" class="estado-erro">Não conseguimos carregar os destinos agora. Tente novamente em instantes.</p>

      <p v-else-if="!paises.length" class="estado-vazio">Nenhum destino cadastrado pra essa região ainda.</p>

      <div v-else class="destinos-grid">
        <PaisCard
          v-for="pais in paises"
          :key="pais.id"
          :nome="pais.nome"
          :regiao="pais.regiao"
          :idioma="pais.idioma"
          :custo-de-vida="pais.custo_de_vida"
          :programas-count="pais.programas_count ?? 0"
          :to="{ name: 'pais', params: { id: pais.id } }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.destinos-view {
  padding: 28px 5% 72px;
}

.hero {
  max-width: 680px;
  margin-bottom: 8px;
}

.hero-eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-mauve);
}

.hero h1 {
  margin: 12px 0 14px;
}

.hero p {
  font-size: 1rem;
  line-height: 1.65;
  color: var(--gb-ink-soft);
  margin: 0;
}

.region-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 28px 0 40px;
}

.region-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.04em;
  padding: 9px 16px;
  border-radius: var(--gb-radius-pill);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.region-chip:hover {
  border-color: var(--gb-magenta);
}

.region-chip.active {
  background: var(--gb-dark);
  color: #fff;
  border-color: var(--gb-dark);
}

.destinos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.pais-skeleton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.skeleton-card {
  height: 220px;
  border-radius: var(--gb-radius-card);
  background: linear-gradient(90deg, rgba(46,10,46,0.06) 25%, rgba(46,10,46,0.1) 37%, rgba(46,10,46,0.06) 63%);
  background-size: 400% 100%;
  animation: gb-skeleton-shimmer 1.6s ease-in-out infinite;
}

@keyframes gb-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card { animation: none; }
}

.estado-erro, .estado-vazio {
  padding: 40px 0;
  color: var(--gb-ink-soft);
  font-size: 0.95rem;
}

@media (max-width: 1200px) {
  .destinos-grid, .pais-skeleton { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 900px) {
  .destinos-grid, .pais-skeleton { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 560px) {
  .destinos-grid, .pais-skeleton { grid-template-columns: 1fr; }
}
</style>
