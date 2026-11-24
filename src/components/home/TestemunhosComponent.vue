<script setup>
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getDepoimentosHome } from '@/services/api'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { iniciaisDe } from '@/utils/iniciais'

gsap.registerPlugin(ScrollTrigger)

const depoimentos = ref([])
const carregando = ref(true)
const fotosComErro = reactive({})
const sectionRef = ref(null)
let ctx

function animarCards() {
  if (prefersReducedMotion() || !sectionRef.value) return
  const cards = sectionRef.value.querySelectorAll('.card')
  if (!cards.length) return
  ctx?.revert()
  ctx = gsap.context(() => {
    gsap.from(cards, {
      opacity: 0,
      y: 28,
      duration: 0.6,
      stagger: 0.14,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: cards[0], start: 'top 84%', once: true }
    })
  }, sectionRef.value)
}

onMounted(async () => {
  try {
    depoimentos.value = await getDepoimentosHome(3)
  } catch (e) {
    console.error('Erro ao carregar depoimentos da home:', e)
  } finally {
    carregando.value = false
    await nextTick()
    animarCards()
  }
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section ref="sectionRef" class="testemunhos">
    <div class="inner gb-section">
      <SectionEyebrow label="Quem já foi" />
      <h2 class="gb-heading">Já embarcaram<br />com a gente</h2>

      <div v-if="carregando" class="cards" aria-hidden="true">
        <div v-for="n in 3" :key="n" class="card card-skeleton">
          <div class="sk-line sk-stars"></div>
          <div class="sk-line sk-body"></div>
          <div class="sk-line sk-body short"></div>
          <div class="autor">
            <span class="avatar sk-avatar"></span>
            <div class="sk-meta">
              <div class="sk-line sk-name"></div>
              <div class="sk-line sk-sub"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="depoimentos.length" class="cards">
        <article
          v-for="dep in depoimentos"
          :key="dep.id"
          class="card"
        >
          <span class="estrelas" role="img" :aria-label="`${dep.nota} de 5 estrelas`">
            <template v-for="n in 5" :key="n"><span aria-hidden="true">{{ n <= dep.nota ? '★' : '☆' }}</span></template>
          </span>
          <p class="texto">“{{ dep.texto }}”</p>

          <div class="autor">
            <router-link
              v-if="dep.autor_username"
              :to="{ name: 'perfil-publico', params: { username: dep.autor_username } }"
              class="autor-link"
            >
              <span class="avatar">
                <img
                  v-if="dep.autor_foto && !fotosComErro[dep.id]"
                  :src="dep.autor_foto"
                  :alt="dep.autor"
                  loading="lazy"
                  @error="fotosComErro[dep.id] = true"
                />
                <span v-else aria-hidden="true">{{ iniciaisDe(dep.autor) }}</span>
              </span>
              <strong>{{ dep.autor }}</strong>
            </router-link>
            <div v-else class="autor-link">
              <span class="avatar">
                <img
                  v-if="dep.autor_foto && !fotosComErro[dep.id]"
                  :src="dep.autor_foto"
                  :alt="dep.autor"
                  loading="lazy"
                  @error="fotosComErro[dep.id] = true"
                />
                <span v-else aria-hidden="true">{{ iniciaisDe(dep.autor) }}</span>
              </span>
              <strong>{{ dep.autor }}</strong>
            </div>

            <router-link
              :to="{ name: 'agencia', params: { id: dep.agencia_id } }"
              class="curso"
            >
              {{ dep.agencia_nome }}<template v-if="dep.pais"> · {{ dep.pais }}</template>
            </router-link>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testemunhos {
  background: var(--gb-pink);
  padding: 56px 0;
}

.gb-heading {
  margin: 24px 0 32px;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(46, 10, 46, 0.05);
}

.estrelas {
  color: var(--gb-magenta);
  font-size: 1rem;
  letter-spacing: 2px;
}

.texto {
  flex: 1;
  font-size: 0.92rem;
  line-height: 1.65;
  color: #3A3640;
  margin: 0;
}

.autor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 14px;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.autor-link {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  width: fit-content;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  color: #fff;
  font-family: var(--gb-font-display);
  font-weight: 800;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.autor strong {
  display: block;
  font-size: 0.88rem;
  color: var(--gb-dark);
  transition: color 0.15s ease;
}

.autor-link:hover strong {
  color: var(--gb-magenta);
}

.autor .curso {
  display: inline-block;
  margin-left: 51px;
  margin-top: -8px;
  font-size: 0.78rem;
  color: var(--gb-mauve-muted);
  text-decoration: none;
  width: fit-content;
  transition: color 0.15s ease;
}

.autor .curso:hover {
  color: var(--gb-magenta);
}

.card-skeleton {
  min-height: 220px;
}

.sk-line {
  border-radius: 6px;
  background: rgba(46, 10, 46, 0.08);
}

.sk-stars { width: 92px; height: 14px; }
.sk-body { width: 100%; height: 14px; }
.sk-body.short { width: 72%; }
.sk-avatar { background: rgba(46, 10, 46, 0.08); }
.sk-meta { display: flex; flex-direction: column; gap: 6px; margin-left: 51px; margin-top: -36px; }
.sk-name { width: 110px; height: 12px; }
.sk-sub { width: 150px; height: 10px; }

@media (min-width: 1024px) {
  .cards {
    flex-direction: row;
  }

  .card {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .inner.gb-section {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
