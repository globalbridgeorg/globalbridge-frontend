<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import ProgramaCard from '@/components/catalog/ProgramaCard.vue'
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
const pais = ref(null)
const carregando = ref(true)
const erro = ref(false)

const regiaoLabel = computed(() => pais.value ? (REGIAO_LABELS[pais.value.regiao] ?? pais.value.regiao) : '')

async function carregarPais() {
  carregando.value = true
  erro.value = false
  try {
    const { data } = await axios.get(`/paises/${route.params.id}/`)
    pais.value = data
  } catch (e) {
    console.error('Erro ao buscar país:', e)
    erro.value = true
  } finally {
    carregando.value = false
  }
}

let ctx
function animarEntrada() {
  if (prefersReducedMotion()) return
  ctx = gsap.context(() => {
    gsap.from('.reveal-section', {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.pais-view', start: 'top 70%' }
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

onMounted(async () => {
  await carregarPais()
  if (!erro.value) {
    await new Promise((r) => requestAnimationFrame(r))
    animarEntrada()
  }
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="pais-view gb-section">
    <div v-if="carregando" class="estado-skeleton" aria-hidden="true">
      <div class="skeleton-hero"></div>
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
    </div>

    <p v-else-if="erro" class="estado-erro">
      Não conseguimos carregar esse destino agora. <router-link to="/destinos">Volte para todos os destinos</router-link>.
    </p>

    <template v-else-if="pais">
      <nav class="breadcrumb" aria-label="Caminho de navegação">
        <router-link to="/destinos">Destinos</router-link>
        <span>/</span>
        <router-link v-if="pais.regiao" :to="{ name: 'regiao', params: { regiao: pais.regiao } }">{{ regiaoLabel }}</router-link>
        <span v-if="pais.regiao">/</span>
        <span class="current">{{ pais.nome }}</span>
      </nav>

      <section class="hero reveal-section">
        <span class="hero-eyebrow">Destino{{ regiaoLabel ? ` · ${regiaoLabel}` : '' }}</span>
        <h1 class="hero-title">{{ pais.nome }}</h1>
        <p class="hero-desc">{{ pais.descricao }}</p>
        <div class="hero-pills">
          <span v-if="pais.idioma" class="hero-pill">Idioma: {{ pais.idioma }}</span>
          <span v-if="pais.custo_de_vida" class="hero-pill">Custo de vida: {{ pais.custo_de_vida }}</span>
        </div>
      </section>

      <section class="stats reveal-section">
        <div class="stat"><span class="stat-num">{{ pais.intercambistas.toLocaleString('pt-BR') }}</span><span class="stat-label">Intercambistas atendidos</span></div>
        <div class="stat"><span class="stat-num">{{ pais.universidades }}</span><span class="stat-label">Universidades parceiras</span></div>
        <div class="stat"><span class="stat-num">{{ pais.agencias.length }}</span><span class="stat-label">Agências parceiras</span></div>
        <div class="stat"><span class="stat-num">{{ pais.programas.length }}</span><span class="stat-label">Programas no catálogo</span></div>
      </section>

      <section v-if="pais.cultura" class="sobre reveal-section">
        <SectionEyebrow label="Cultura e cotidiano" />
        <p>{{ pais.cultura }}</p>
      </section>

      <section v-if="pais.cidades.length" class="cidades reveal-section">
        <SectionEyebrow label="Onde estudar" />
        <h2 class="gb-heading">Cidades com<br />agências parceiras</h2>
        <div class="cidades-grid reveal-grid">
          <article v-for="cidade in pais.cidades" :key="cidade.id" class="cidade-card">
            <h3 class="cidade-nome">{{ cidade.cidade_principal }}</h3>
            <p class="cidade-estado">{{ cidade.nome }}</p>
          </article>
        </div>
      </section>

      <section v-if="pais.programas.length" class="catalogo reveal-section">
        <SectionEyebrow label="Catálogo" />
        <h2 class="gb-heading">Programas em<br />destaque</h2>
        <div class="catalogo-grid reveal-grid">
          <ProgramaCard
            v-for="programa in pais.programas"
            :key="programa.id"
            :nome="programa.nome"
            :descricao="programa.descricao"
            tag="Programa"
            :duracao="`${programa.duracao_min} a ${programa.duracao_max} meses`"
            :to="{ path: '/destinos' }"
          />
        </div>
      </section>
      <p v-else class="estado-vazio reveal-section">Ainda não há programas cadastrados pra esse destino.</p>

      <section v-if="pais.agencias.length" class="agencias reveal-section">
        <SectionEyebrow :label="`${pais.agencias.length} encontrada${pais.agencias.length === 1 ? '' : 's'}`" />
        <h2 class="gb-heading">Agências parceiras<br />em {{ pais.nome }}</h2>
        <div class="agencias-grid reveal-grid">
          <AgenciaCard
            v-for="agencia in pais.agencias"
            :key="agencia.id"
            :nome="agencia.nome"
            :descricao="agencia.descricao"
            :cidade="agencia.cidade"
            :nota-media="agencia.nota_media"
            :to="{ name: 'agencia', params: { id: agencia.id } }"
          />
        </div>
      </section>
      <p v-else class="estado-vazio reveal-section">Ainda não há agências parceiras cadastradas pra esse destino.</p>
    </template>
  </div>
</template>

<style scoped>
.pais-view {
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
  padding: 40px 44px;
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
  margin-bottom: 12px;
}

.hero-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(2.2rem, 1.4rem + 3.4vw, 3.6rem);
  line-height: 0.98;
  margin: 0 0 16px;
}

.hero-desc {
  color: rgba(255, 255, 255, 0.78);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 620px;
  margin: 0;
}

.hero-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 13px;
  border-radius: var(--gb-radius-pill);
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

.sobre, .cidades, .catalogo, .agencias {
  padding: 48px 0 0;
}

.sobre p {
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--gb-ink-soft);
  max-width: 720px;
  margin: 12px 0 0;
}

.gb-heading {
  margin: 8px 0 24px;
}

.cidades-grid, .catalogo-grid, .agencias-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.cidade-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 20px;
}

.cidade-nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 1.1rem;
  text-transform: uppercase;
  margin: 0 0 4px;
  color: var(--gb-dark);
}

.cidade-estado {
  font-size: 0.85rem;
  color: var(--gb-ink-faint);
  margin: 0;
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

.skeleton-hero { height: 320px; }
.skeleton-row { height: 88px; }

@keyframes gb-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-hero, .skeleton-row { animation: none; }
}

@media (max-width: 1100px) {
  .cidades-grid, .catalogo-grid, .agencias-grid { grid-template-columns: repeat(2, 1fr); }
  .stats { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 720px) {
  .cidades-grid, .catalogo-grid, .agencias-grid { grid-template-columns: 1fr; }
  .stats { grid-template-columns: 1fr; }
  .hero { padding: 32px 24px; }
}
</style>
