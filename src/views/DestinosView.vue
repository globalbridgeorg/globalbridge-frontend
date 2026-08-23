<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/services/axios'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import PaisCard from '@/components/catalog/PaisCard.vue'
import AgenciaCard from '@/components/catalog/AgenciaCard.vue'

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
const renderKey = ref('inicial')
const primeiraCarga = ref(true)
const carregandoFiltro = ref(false)
const erro = ref(false)

const regiaoAtiva = computed(() => route.query.regiao ?? '')

function selecionarRegiao(valor) {
  if (valor === regiaoAtiva.value) return
  router.push({ path: '/destinos', query: valor ? { regiao: valor } : {} })
}

async function carregarPaises() {
  erro.value = false
  const alvo = regiaoAtiva.value
  try {
    const params = alvo ? { regiao: alvo } : {}
    const { data } = await axios.get('/paises/', { params })
    // só troca o conteúdo (e dispara a transição) quando o resultado já
    // está pronto — a grade antiga fica parada na tela durante o fetch
    // em vez de piscar um estado vazio no meio do caminho.
    paises.value = Array.isArray(data) ? data : (data.results ?? [])
    renderKey.value = alvo || 'todos'
  } catch (e) {
    console.error('Erro ao buscar destinos:', e)
    erro.value = true
  } finally {
    primeiraCarga.value = false
    carregandoFiltro.value = false
  }
}

watch(regiaoAtiva, () => {
  carregandoFiltro.value = true
  carregarPaises()
})

onMounted(carregarPaises)
</script>

<template>
  <div class="destinos-view gb-section">
    <div class="hero">
      <span class="hero-eyebrow">Explore o mapa</span>
      <h1 class="gb-heading">Todos os <span class="accent">destinos</span></h1>
      <p>Filtre por região pra achar o próximo passo — e conheça a agência em destaque de cada um.</p>
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
      <SectionEyebrow :label="primeiraCarga ? 'Carregando' : `${paises.length} destino${paises.length === 1 ? '' : 's'} encontrado${paises.length === 1 ? '' : 's'}`" />

      <div v-if="primeiraCarga" class="pais-skeleton" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </div>

      <div v-else-if="erro" class="estado-erro">
        <p>Não conseguimos carregar os destinos agora.</p>
        <button class="btn-tentar-novamente" @click="carregarPaises">Tentar novamente</button>
      </div>

      <p v-else-if="!paises.length" class="estado-vazio">
        Ainda não há destinos cadastrados{{ regiaoAtiva ? ' pra essa região' : '' }}.
      </p>

      <Transition v-else name="filtro-fade" mode="out-in">
        <div :key="renderKey" class="destinos-grid" :class="{ 'is-loading': carregandoFiltro }">
          <article v-for="pais in paises" :key="pais.id" class="destino-par">
            <PaisCard
              :nome="pais.nome"
              :regiao="pais.regiao"
              :idioma="pais.idioma"
              :custo-de-vida="pais.custo_de_vida"
              :programas-count="pais.programas_count ?? 0"
              :to="{ name: 'pais', params: { id: pais.id } }"
            />
            <AgenciaCard
              v-if="pais.agencia_destaque"
              :nome="pais.agencia_destaque.nome"
              :descricao="pais.agencia_destaque.descricao"
              :cidade="pais.agencia_destaque.cidade"
              :nota-media="pais.agencia_destaque.nota_media"
              :to="{ name: 'agencia', params: { id: pais.agencia_destaque.id } }"
            />
          </article>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.destinos-view {
  padding: 120px 5% 72px;
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
  min-height: 60px;
  transition: opacity 0.15s ease;
}

.destinos-grid.is-loading {
  opacity: 0.5;
  pointer-events: none;
}

.destino-par {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filtro-fade-enter-active, .filtro-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.filtro-fade-enter-from, .filtro-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
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
  .filtro-fade-enter-active, .filtro-fade-leave-active { transition: none; }
}

.estado-erro, .estado-vazio {
  padding: 40px 0;
  color: var(--gb-ink-soft);
  font-size: 0.95rem;
}

.estado-erro {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}

.btn-tentar-novamente {
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 11px 22px;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
}

.btn-tentar-novamente:hover {
  background: rgba(46, 10, 46, 0.04);
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
