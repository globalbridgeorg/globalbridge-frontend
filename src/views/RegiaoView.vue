<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import PaisCard from '@/components/catalog/PaisCard.vue'
import AgenciaCard from '@/components/catalog/AgenciaCard.vue'

gsap.registerPlugin(ScrollTrigger)

const REGIAO_LABELS = {
  asia: 'Ásia',
  europa: 'Europa',
  america_norte: 'América do Norte',
  america_sul: 'América do Sul',
  oceania: 'Oceania',
  africa: 'África'
}

const route = useRoute()

const paises = ref([])
const agencias = ref([])
const carregando = ref(true)
const erro = ref(false)

const regiaoLabel = computed(() => REGIAO_LABELS[route.params.regiao] ?? route.params.regiao)

const intercambistasTotal = computed(() =>
  paises.value.reduce((soma, p) => soma + (p.intercambistas ?? 0), 0)
)

const notaMediaRegiao = computed(() => {
  const notas = agencias.value.map((a) => a.nota_media).filter((n) => n !== null && n !== undefined)
  if (!notas.length) return null
  return Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10
})

async function carregarRegiao() {
  carregando.value = true
  erro.value = false
  try {
    const params = { regiao: route.params.regiao }
    const [resPaises, resAgencias] = await Promise.all([
      axios.get('/paises/', { params }),
      axios.get('/agencia/', { params })
    ])
    paises.value = Array.isArray(resPaises.data) ? resPaises.data : (resPaises.data.results ?? [])
    agencias.value = Array.isArray(resAgencias.data) ? resAgencias.data : (resAgencias.data.results ?? [])
  } catch (e) {
    console.error('Erro ao buscar região:', e)
    erro.value = true
  } finally {
    carregando.value = false
  }
}

let ctx
function animarEntrada() {
  if (prefersReducedMotion()) return
  ctx?.revert()
  ctx = gsap.context(() => {
    gsap.from('.reveal-section', {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.regiao-view', start: 'top 70%' }
    })
    gsap.utils.toArray('.reveal-grid').forEach((grid) => {
      gsap.from(grid.children, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: grid, start: 'top 85%' }
      })
    })
  })
}

watch(() => route.params.regiao, async () => {
  await carregarRegiao()
  await nextTick()
  animarEntrada()
})

onMounted(async () => {
  await carregarRegiao()
  await nextTick()
  animarEntrada()
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="regiao-view gb-section">
    <div v-if="carregando" class="estado-skeleton" aria-hidden="true">
      <div class="skeleton-hero"></div>
      <div class="skeleton-row"></div>
    </div>

    <div v-else-if="erro" class="estado-erro">
      <p>Não conseguimos carregar essa região agora.</p>
      <div class="estado-erro-acoes">
        <button class="btn-tentar-novamente" @click="carregarRegiao">Tentar novamente</button>
        <router-link to="/destinos">Voltar para todos os destinos</router-link>
      </div>
    </div>

    <template v-else>
      <nav class="breadcrumb" aria-label="Caminho de navegação">
        <router-link to="/destinos">Destinos</router-link>
        <span>/</span>
        <span class="current">{{ regiaoLabel }}</span>
      </nav>

      <section class="hero reveal-section">
        <span class="hero-eyebrow">Região</span>
        <h1 class="hero-title">{{ regiaoLabel }}</h1>
        <p class="hero-desc">Compare os destinos disponíveis em {{ regiaoLabel }} antes de escolher pra onde ir.</p>
      </section>

      <section class="stats reveal-section">
        <div class="stat"><span class="stat-num">{{ paises.length }}</span><span class="stat-label">Destinos disponíveis</span></div>
        <div class="stat"><span class="stat-num">{{ agencias.length }}</span><span class="stat-label">Agências parceiras</span></div>
        <div class="stat"><span class="stat-num">{{ intercambistasTotal.toLocaleString('pt-BR') }}</span><span class="stat-label">Intercambistas atendidos</span></div>
        <div class="stat"><span class="stat-num">{{ notaMediaRegiao !== null ? notaMediaRegiao.toFixed(1) : '—' }}</span><span class="stat-label">Nota média das agências</span></div>
      </section>

      <section v-if="paises.length" class="countries reveal-section">
        <SectionEyebrow label="Destinos na região" />
        <h2 class="gb-heading">Países de<br />{{ regiaoLabel }}</h2>
        <div class="countries-grid reveal-grid">
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

        <div class="comparativo">
          <div class="table-head">
            <span>País</span><span>Custo de vida</span><span>Idioma</span><span>Universidades</span><span>Intercambistas</span>
          </div>
          <div v-for="pais in paises" :key="`comp-${pais.id}`" class="comp-row">
            <span class="pais-nome">{{ pais.nome }}</span>
            <span>{{ pais.custo_de_vida }}</span>
            <span>{{ pais.idioma }}</span>
            <span>{{ pais.universidades }}</span>
            <span>{{ pais.intercambistas.toLocaleString('pt-BR') }}</span>
          </div>
        </div>
      </section>
      <p v-else class="estado-vazio reveal-section">Ainda não há destinos cadastrados pra essa região.</p>

      <section v-if="agencias.length" class="agencias reveal-section">
        <SectionEyebrow :label="`${agencias.length} encontrada${agencias.length === 1 ? '' : 's'}`" />
        <h2 class="gb-heading">Agências que atendem<br />a região</h2>
        <div class="agencias-grid reveal-grid">
          <AgenciaCard
            v-for="agencia in agencias"
            :key="agencia.id"
            :nome="agencia.nome"
            :descricao="agencia.descricao"
            :cidade="agencia.cidade"
            :nota-media="agencia.nota_media"
            :to="{ name: 'agencia', params: { id: agencia.id } }"
          />
        </div>
      </section>
      <p v-else class="estado-vazio reveal-section">Ainda não há agências parceiras cadastradas pra essa região.</p>
    </template>
  </div>
</template>

<style scoped>
.regiao-view {
  padding: 120px 5% 72px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  margin-bottom: 20px;
}

.breadcrumb a {
  color: var(--gb-ink-faint);
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--gb-magenta);
}

.breadcrumb .current {
  color: var(--gb-dark);
}

.hero {
  background: var(--gb-purple-deep);
  border-radius: 24px;
  padding: 36px 44px;
  color: #fff;
}

.hero-eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-pink);
  display: block;
  margin-bottom: 10px;
}

.hero-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(2.2rem, 1.4rem + 3.4vw, 3.8rem);
  line-height: 0.98;
  margin: 0 0 14px;
}

.hero-desc {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.98rem;
  line-height: 1.6;
  max-width: 620px;
  margin: 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--gb-purple-deep-16);
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  margin: 28px 0 0;
}

.stat {
  background: #fff;
  padding: 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-num {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: clamp(1.6rem, 1.1rem + 1.2vw, 2.2rem);
  line-height: 1;
  color: var(--gb-magenta);
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gb-ink-faint);
}

.countries, .agencias {
  padding: 48px 0 0;
}

.gb-heading {
  margin: 8px 0 24px;
}

.countries-grid, .agencias-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.agencias-grid {
  grid-template-columns: repeat(3, 1fr);
}

.comparativo {
  margin-top: 40px;
}

.table-head, .comp-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr 1.2fr;
  gap: 20px;
  align-items: center;
}

.table-head {
  padding-bottom: 16px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
}

.comp-row {
  padding: 18px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.comp-row:last-child {
  border-bottom: 1px solid var(--gb-purple-deep-16);
}

.comp-row .pais-nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 1rem;
  color: var(--gb-dark);
}

.comp-row span:not(.pais-nome) {
  font-size: 0.88rem;
  color: #44404A;
}

.estado-vazio {
  padding: 40px 0 0;
  color: var(--gb-ink-soft);
  font-size: 0.95rem;
}

.estado-erro {
  padding: 80px 0;
  text-align: center;
  color: var(--gb-ink-soft);
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.estado-erro-acoes {
  display: flex;
  align-items: center;
  gap: 18px;
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

.estado-erro a {
  color: var(--gb-magenta);
  font-weight: 600;
}

.estado-skeleton {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px 0;
}

.skeleton-hero, .skeleton-row {
  border-radius: var(--gb-radius-card);
  background: linear-gradient(90deg, rgba(46,10,46,0.06) 25%, rgba(46,10,46,0.1) 37%, rgba(46,10,46,0.06) 63%);
  background-size: 400% 100%;
  animation: gb-skeleton-shimmer 1.6s ease-in-out infinite;
}

.skeleton-hero { height: 260px; }
.skeleton-row { height: 88px; }

@keyframes gb-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-hero, .skeleton-row { animation: none; }
}

@media (max-width: 1200px) {
  .countries-grid { grid-template-columns: repeat(3, 1fr); }
  .agencias-grid { grid-template-columns: repeat(2, 1fr); }
  .stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .countries-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 720px) {
  .countries-grid, .agencias-grid { grid-template-columns: 1fr; }
  .stats { grid-template-columns: 1fr; }
  .hero { padding: 28px 24px; }
  .table-head { display: none; }
  .comp-row { grid-template-columns: 1fr; gap: 4px; }
}
</style>
