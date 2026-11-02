<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import ProgramaCard from '@/components/catalog/ProgramaCard.vue'
import AgenciaHero from '@/components/agencia/AgenciaHero.vue'
import AgenciaAvaliacoes from '@/components/agencia/AgenciaAvaliacoes.vue'
import AgenciaSecaoConteudo from '@/components/agencia/AgenciaSecaoConteudo.vue'
import { useFavoritos } from '@/composables/useFavoritos'

gsap.registerPlugin(ScrollTrigger)

const { carregarFavoritos } = useFavoritos()

const REGIAO_LABELS = {
  asia: 'Ásia',
  europa: 'Europa',
  america_norte: 'América do Norte',
  america_sul: 'América do Sul',
  oceania: 'Oceania',
  africa: 'África'
}

// Layout padrão de sempre, pra agência que ainda não mexeu no editor da
// conta business (agencia.layout vazio). O hero fica sempre primeiro —
// só a variante dele é escolhível, a ordem das outras três seções é que
// pode mudar.
const LAYOUT_PADRAO = [
  { tipo: 'hero', variante: 'foto' },
  { tipo: 'como_funciona', variante: 'texto' },
  { tipo: 'catalogo', variante: 'grade' },
  { tipo: 'avaliacoes', variante: 'grade' }
]

const route = useRoute()
const agencia = ref(null)
const carregando = ref(true)
const erro = ref(false)

const regiaoLabel = computed(() => REGIAO_LABELS[agencia.value?.regiao] ?? agencia.value?.regiao)
const layoutFinal = computed(() => agencia.value?.layout?.length ? agencia.value.layout : LAYOUT_PADRAO)

async function carregarAgencia() {
  carregando.value = true
  erro.value = false
  try {
    const { data } = await axios.get(`/agencia/${route.params.id}/`)
    agencia.value = data
  } catch (e) {
    console.error('Erro ao buscar agência:', e)
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
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '.agencia-view', start: 'top 70%' }
    })
    gsap.utils.toArray('.reveal-grid').forEach((grid) => {
      gsap.from(grid.children, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: grid, start: 'top 85%' }
      })
    })
  })
}

onMounted(async () => {
  // Espera pelo menos o tempo da transição de troca de página terminar
  // antes de medir posições pro ScrollTrigger — ele mira no próprio
  // elemento raiz da página, que a transição ainda está escalando/
  // desfocando nesse meio-tempo; medir antes disso acabar deixa a
  // animação de entrada com posições erradas.
  await Promise.all([carregarAgencia(), carregarFavoritos(), new Promise((r) => setTimeout(r, 260))])
  if (!erro.value) {
    animarEntrada()
  }
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="agencia-view gb-section">
    <div v-if="carregando" class="estado-skeleton" aria-hidden="true">
      <div class="skeleton-hero"></div>
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
    </div>

    <div v-else-if="erro" class="estado-erro">
      <p>Não conseguimos carregar essa agência agora.</p>
      <div class="estado-erro-acoes">
        <button class="btn-tentar-novamente" @click="carregarAgencia">Tentar novamente</button>
        <router-link to="/destinos">Voltar para todos os destinos</router-link>
      </div>
    </div>

    <template v-else-if="agencia">
      <nav class="breadcrumb" aria-label="Caminho de navegação">
        <router-link to="/destinos">Destinos</router-link>
        <template v-if="agencia.regiao">
          <span>/</span>
          <router-link :to="{ name: 'regiao', params: { regiao: agencia.regiao } }">{{ regiaoLabel }}</router-link>
        </template>
        <template v-if="agencia.pais_id">
          <span>/</span>
          <router-link :to="{ name: 'pais', params: { id: agencia.pais_id } }">{{ agencia.pais }}</router-link>
        </template>
        <span>/</span>
        <span class="current">{{ agencia.nome }}</span>
      </nav>

      <template v-for="bloco in layoutFinal" :key="bloco.tipo">
      <AgenciaHero v-if="bloco.tipo === 'hero'" :agencia="agencia" :variante="bloco.variante" />

      <section v-else-if="bloco.tipo === 'como_funciona'" class="como-funciona reveal-section" :class="{ 'como-funciona-destaque': bloco.variante === 'destaque' }">
        <SectionEyebrow label="Como funciona" />
        <h2 class="gb-heading">O processo com<br />{{ agencia.nome }}</h2>
        <template v-if="agencia.como_funciona">
          <blockquote v-if="bloco.variante === 'destaque'" class="como-funciona-quote">“{{ agencia.como_funciona }}”</blockquote>
          <p v-else class="como-funciona-texto">{{ agencia.como_funciona }}</p>
        </template>
        <p v-else class="estado-vazio">
          {{ agencia.nome }} ainda não descreveu aqui como funciona o processo de inscrição e atendimento.
        </p>
      </section>

      <section v-else-if="bloco.tipo === 'catalogo'" class="catalogo reveal-section">
        <SectionEyebrow label="Catálogo" />
        <h2 class="gb-heading">Programas<br />oferecidos</h2>
        <div v-if="agencia.planos.length" class="catalogo-grid reveal-grid" :class="{ 'catalogo-lista': bloco.variante === 'lista' }">
          <ProgramaCard
            v-for="plano in agencia.planos"
            :key="plano.id"
            :nome="plano.programa_nome"
            :descricao="plano.descricao"
            tag="Programa"
            :duracao="`${plano.duracao_min} a ${plano.duracao_max} meses`"
            :footer-meta="`R$ ${Number(plano.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`"
          />
        </div>
        <p v-else class="estado-vazio">Ainda não há programas cadastrados pra essa agência.</p>
      </section>

      <AgenciaAvaliacoes v-else-if="bloco.tipo === 'avaliacoes'" :agencia="agencia" :variante="bloco.variante" @avaliada="carregarAgencia" />

      <AgenciaSecaoConteudo v-else :agencia="agencia" :bloco="bloco" />

      </template>
    </template>
  </div>
</template>

<style scoped>
.agencia-view {
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
  display: inline-block;
  padding-block: 5px;
  margin-block: -5px;
  color: var(--gb-ink-faint);
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--gb-magenta);
}

.breadcrumb .current {
  color: var(--gb-dark);
}

/* Variante "destaque" de como funciona */
.como-funciona-quote {
  font-family: var(--gb-font-display);
  font-size: 1.3rem;
  font-style: italic;
  line-height: 1.5;
  color: var(--gb-magenta-strong);
  border-left: 3px solid var(--gb-magenta);
  padding-left: 20px;
  margin: 0;
  max-width: 640px;
}

/* Variante "lista" do catálogo */
.catalogo-lista {
  grid-template-columns: 1fr !important;
}

.como-funciona, .catalogo {
  padding: 48px 0 0;
}

.como-funciona-texto {
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--gb-ink-soft);
  max-width: 640px;
  margin: 0;
  white-space: pre-line;
}

.gb-heading {
  margin: 8px 0 24px;
}

.catalogo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.estado-vazio {
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

.skeleton-hero { height: 200px; }
.skeleton-row { height: 88px; }

@keyframes gb-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-hero, .skeleton-row { animation: none; }
}

@media (max-width: 1024px) {
  .catalogo-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .catalogo-grid { grid-template-columns: 1fr; }
}

/* Header deixou de ser fixed no celular (ver App.vue) — não precisa mais
   do respiro de 120px pra não ficar embaixo dele. */
@media (max-width: 768px) {
  .agencia-view {
    padding: 16px 16px 72px;
  }
}
</style>
