<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import ProgramaCard from '@/components/catalog/ProgramaCard.vue'

gsap.registerPlugin(ScrollTrigger)

const route = useRoute()
const agencia = ref(null)
const carregando = ref(true)
const erro = ref(false)

const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
const estaLogado = computed(() => !!getStoredToken())

function iniciaisDe(nome) {
  if (!nome) return ''
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

const novaNota = ref(0)
const novoComentario = ref('')
const enviandoAvaliacao = ref(false)
const erroAvaliacao = ref('')

async function enviarAvaliacao() {
  erroAvaliacao.value = ''
  if (!novaNota.value) {
    erroAvaliacao.value = 'Escolha uma nota de 1 a 5 estrelas.'
    return
  }
  if (!novoComentario.value.trim()) {
    erroAvaliacao.value = 'Escreva um comentário antes de enviar.'
    return
  }
  enviandoAvaliacao.value = true
  try {
    await axios.post('/avaliacao/', {
      nota: novaNota.value,
      comentario: novoComentario.value.trim(),
      id_agencia: agencia.value.id
    })
    novaNota.value = 0
    novoComentario.value = ''
    await carregarAgencia()
  } catch (e) {
    console.error('Erro ao enviar avaliação:', e)
    erroAvaliacao.value = 'Não conseguimos enviar sua avaliação agora. Tente novamente.'
  } finally {
    enviandoAvaliacao.value = false
  }
}

const iniciais = computed(() => {
  if (!agencia.value?.nome) return ''
  return agencia.value.nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
})

const estrelas = computed(() => {
  const nota = Math.round(agencia.value?.nota_media ?? 0)
  return Array.from({ length: 5 }, (_, i) => i < nota)
})

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
  await carregarAgencia()
  if (!erro.value) {
    await new Promise((r) => requestAnimationFrame(r))
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
        <span>/</span>
        <span class="current">{{ agencia.nome }}</span>
      </nav>

      <section class="hero reveal-section">
        <div class="avatar" aria-hidden="true">{{ iniciais }}</div>
        <div class="hero-info">
          <h1 class="agencia-title">{{ agencia.nome }}</h1>
          <div class="meta-row">
            <span v-if="agencia.nota_media !== null" class="stars-lg" role="img" :aria-label="`${Math.round(agencia.nota_media)} de 5 estrelas`">
              <span v-for="(preenchida, i) in estrelas" :key="i" class="filled" :class="{ empty: !preenchida }" aria-hidden="true">★</span>
              <span class="rating-num">{{ agencia.nota_media.toFixed(1) }} · {{ agencia.total_avaliacoes }} avaliaç{{ agencia.total_avaliacoes === 1 ? 'ão' : 'ões' }}</span>
            </span>
            <span v-if="agencia.cidade" class="location-row">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="#757067" stroke-width="1.3"/><circle cx="8" cy="6" r="1.6" stroke="#757067" stroke-width="1.3"/></svg>
              {{ agencia.cidade }}<template v-if="agencia.pais">, {{ agencia.pais }}</template>
            </span>
          </div>
          <p class="tagline">{{ agencia.descricao }}</p>
        </div>
        <div class="hero-actions">
          <a v-if="agencia.contato" :href="`mailto:${agencia.contato}`" class="btn-primary-lg">Falar com a agência</a>
          <a v-if="agencia.site" :href="agencia.site" target="_blank" rel="noopener" class="btn-outline-lg">Visitar site</a>
        </div>
      </section>

      <section class="catalogo reveal-section">
        <SectionEyebrow label="Catálogo" />
        <h2 class="gb-heading">Programas<br />oferecidos</h2>
        <div v-if="agencia.planos.length" class="catalogo-grid reveal-grid">
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

      <section class="avaliacoes reveal-section">
        <SectionEyebrow :label="`${agencia.total_avaliacoes} avaliaç${agencia.total_avaliacoes === 1 ? 'ão' : 'ões'}`" />
        <h2 class="gb-heading">O que dizem<br />sobre a agência</h2>

        <form v-if="estaLogado" class="form-avaliacao" @submit.prevent="enviarAvaliacao">
          <span class="form-label">Deixe sua avaliação</span>
          <div class="form-stars" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="form-star"
              :class="{ filled: n <= novaNota }"
              role="radio"
              :aria-checked="n === novaNota"
              :aria-label="`${n} de 5 estrelas`"
              @click="novaNota = n"
            >★</button>
          </div>
          <textarea
            v-model="novoComentario"
            class="form-textarea"
            rows="3"
            placeholder="Conte como foi sua experiência com essa agência..."
          ></textarea>
          <p v-if="erroAvaliacao" class="form-erro">{{ erroAvaliacao }}</p>
          <button type="submit" class="btn-primary-lg form-submit" :disabled="enviandoAvaliacao">
            {{ enviandoAvaliacao ? 'Enviando...' : 'Enviar avaliação' }}
          </button>
        </form>
        <p v-else class="form-login-hint">
          <router-link to="/login">Entre na sua conta</router-link> pra deixar uma avaliação sobre essa agência.
        </p>

        <div v-if="agencia.avaliacoes.length" class="review-cards reveal-grid">
          <article v-for="avaliacao in agencia.avaliacoes" :key="avaliacao.id" class="review-card">
            <span class="review-stars" role="img" :aria-label="`${avaliacao.nota} de 5 estrelas`">
              <template v-for="n in 5" :key="n"><span aria-hidden="true">{{ n <= avaliacao.nota ? '★' : '☆' }}</span></template>
            </span>
            <p class="review-text">{{ avaliacao.comentario }}</p>
            <router-link :to="{ name: 'perfil-publico', params: { username: avaliacao.autor_username } }" class="review-autor">
              <span class="review-avatar">
                <img v-if="avaliacao.autor_foto" :src="avaliacao.autor_foto" :alt="avaliacao.autor" />
                <span v-else aria-hidden="true">{{ iniciaisDe(avaliacao.autor) }}</span>
              </span>
              <strong>{{ avaliacao.autor }}</strong>
            </router-link>
          </article>
        </div>
        <p v-else class="estado-vazio">Essa agência ainda não recebeu avaliações.</p>
      </section>
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
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: wrap;
}

.avatar {
  width: 104px;
  height: 104px;
  border-radius: 24px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 40px;
  color: #fff;
}

.hero-info {
  flex: 1;
  min-width: 260px;
}

.agencia-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(1.7rem, 1.1rem + 2vw, 2.6rem);
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--gb-dark);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin: 10px 0 14px;
}

.stars-lg {
  font-size: 17px;
  color: var(--gb-purple-deep-16);
}

.stars-lg .filled {
  color: var(--gb-magenta);
}

.stars-lg .filled.empty {
  color: var(--gb-purple-deep-16);
}

.rating-num {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 13px;
  color: var(--gb-dark);
  margin-left: 6px;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gb-ink-faint);
}

.tagline {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 560px;
  margin: 0;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.btn-primary-lg, .btn-outline-lg {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 14px 26px;
  border-radius: 12px;
  text-align: center;
  white-space: nowrap;
  text-decoration: none;
}

.btn-primary-lg {
  background: var(--gb-dark);
  color: #fff;
}

.btn-primary-lg:hover {
  background: var(--gb-magenta);
}

.btn-outline-lg {
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
}

.btn-outline-lg:hover {
  background: rgba(46, 10, 46, 0.04);
}

.catalogo, .avaliacoes {
  padding: 48px 0 0;
}

.gb-heading {
  margin: 8px 0 24px;
}

.catalogo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.form-avaliacao {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 560px;
  margin-bottom: 32px;
}

.form-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gb-dark);
}

.form-stars {
  display: flex;
  gap: 6px;
}

.form-star {
  background: none;
  border: none;
  font-size: 26px;
  line-height: 1;
  color: var(--gb-purple-deep-16);
  cursor: pointer;
  padding: 0;
}

.form-star.filled {
  color: var(--gb-magenta);
}

.form-textarea {
  width: 100%;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  font-family: var(--gb-font-display);
  color: var(--gb-dark);
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--gb-magenta);
}

.form-erro {
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.form-submit {
  align-self: flex-start;
}

.form-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-login-hint {
  background: rgba(46, 10, 46, 0.04);
  border-radius: var(--gb-radius-card);
  padding: 18px 22px;
  font-size: 0.92rem;
  color: var(--gb-ink-soft);
  max-width: 560px;
  margin-bottom: 32px;
}

.form-login-hint a {
  color: var(--gb-magenta);
  font-weight: 600;
}

.review-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.review-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--gb-shadow-card);
}

.review-stars {
  color: var(--gb-magenta);
  font-size: 1rem;
  letter-spacing: 2px;
}

.review-text {
  font-size: 0.92rem;
  line-height: 1.6;
  color: #3A3640;
  margin: 0;
}

.review-autor {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--gb-purple-deep-16);
  text-decoration: none;
}

.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.review-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-autor strong {
  font-size: 0.85rem;
  color: var(--gb-dark);
  transition: color 0.15s ease;
}

.review-autor:hover strong {
  color: var(--gb-magenta);
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

@media (max-width: 1100px) {
  .catalogo-grid, .review-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 720px) {
  .hero { flex-direction: column; align-items: flex-start; }
  .hero-actions { flex-direction: row; width: 100%; }
  .hero-actions a { flex: 1; }
  .catalogo-grid, .review-cards { grid-template-columns: 1fr; }
}
</style>
