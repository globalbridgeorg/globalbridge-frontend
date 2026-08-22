<script setup>
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const depoimentos = [
  {
    nome: 'Marina T.',
    estrelas: 5,
    texto: 'Comparei sete países numa tarde e entendi que Dublin caberia no meu orçamento. Seis meses depois eu estava lá, com o visto aprovado na primeira tentativa.',
    curso: 'Curso de idioma · Irlanda'
  },
  {
    nome: 'Lucas A.',
    estrelas: 4,
    texto: 'O que mudou o jogo foi ver as agências avaliadas. Falei direto com três, escolhi a que respondeu melhor e não paguei intermediário nenhum.',
    curso: 'Study & Work · Canadá'
  },
  {
    nome: 'Sofia K.',
    estrelas: 5,
    texto: 'Eu não falava japonês e achava que isso me barrava. Achei um programa com idioma integrado e comecei do zero, em Kyoto.',
    curso: 'Idioma · Japão'
  }
]

const cardsRef = ref([])
let ctx

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from(cardsRef.value, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.14,
      ease: 'power3.out',
      scrollTrigger: { trigger: cardsRef.value[0], start: 'top 82%' }
    })
  })
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="testemunhos">
    <div class="inner gb-section">
      <SectionEyebrow number="10" label="Quem já foi" />
      <h2 class="gb-heading">Já embarcaram<br />com a gente</h2>

      <div class="cards">
        <div
          v-for="(dep, i) in depoimentos"
          :key="dep.curso"
          class="card"
          :ref="el => (cardsRef[i] = el)"
        >
          <span class="estrelas">
            <template v-for="n in 5" :key="n">{{ n <= dep.estrelas ? '★' : '☆' }}</template>
          </span>
          <p class="texto">{{ dep.texto }}</p>

          <div class="autor">
            <span class="avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#B0A79E" stroke-width="1.5"/>
                <circle cx="9" cy="10" r="1.5" fill="#B0A79E"/>
                <path d="M3 17L8 13L11 15L16 10L21 15" stroke="#B0A79E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <div>
              <strong>{{ dep.nome }}</strong>
              <span class="curso">{{ dep.curso }}</span>
            </div>
          </div>
        </div>
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
  background: var(--gb-cream);
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.estrelas {
  color: var(--gb-magenta);
  font-size: 1rem;
  letter-spacing: 2px;
}

.texto {
  font-size: 0.92rem;
  line-height: 1.6;
  color: #3A3640;
  margin: 0;
}

.autor {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(46, 10, 46, 0.06);
  border: 1px dashed #B0A79E;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.autor strong {
  display: block;
  font-size: 0.85rem;
  color: var(--gb-dark);
}

.autor .curso {
  display: block;
  font-size: 0.78rem;
  color: var(--gb-mauve-muted);
}

@media (min-width: 900px) {
  .cards {
    flex-direction: row;
  }

  .card {
    flex: 1;
  }
}

</style>
