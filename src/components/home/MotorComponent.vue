<script setup>
import { ref, onMounted, onBeforeUpdate, onBeforeUnmount, nextTick } from 'vue'
import BadgeComponent from '@/components/common/BadgeComponent.vue'
import gsap from 'gsap'

const items = [
  {
    label: 'Cultura',
    color: '#9C2C8C',
    text: 'Descubra como é o estilo de vida em cada país, seus costumes, tradições e a forma como estrangeiros são recebidos pela população local.',
    image: '/images/motoresCultura.png',
    tag: 'Perto do seu dia a dia'
  },
  {
    label: 'Idioma',
    color: '#3A6CF0',
    text: 'Conheça os idiomas falados, o nível de proficiência necessário e as oportunidades para aprender ou aprimorar uma nova língua durante o intercâmbio.',
    image: '/images/MotoresIdiomas.png',
    tag: 'Fale o idioma de verdade'
  },
  {
    label: 'Ensino',
    color: '#B4601F',
    text: 'Explore a qualidade das instituições, os tipos de cursos disponíveis e as opções de programas acadêmicos para estudantes internacionais.',
    image: '/images/motoresEnsino.png',
    tag: 'Ensino em foco'
  },
  {
    label: 'Oportunidade',
    color: '#3C8543',
    text: 'Veja as possibilidades de trabalho, estágios e outros programas que você pode estudar e trabalhar enquanto vive a experiência internacional.',
    image: '/images/motoresOportunidades.png',
    tag: 'Oportunidade em foco'
  }
]

const cardsWrap = ref(null)
const cardRefs = ref([])

const EXPANDED_FLEX = 4
const COLLAPSED_FLEX = 1

// evita refs "fantasma" de renders anteriores quando o v-for atualiza
onBeforeUpdate(() => {
  cardRefs.value = []
})

function activate(activeCard) {
  if (!activeCard || !Array.isArray(cardRefs.value)) return

  cardRefs.value.forEach(card => {
    if (!card) return
    const isActive = card === activeCard
    const body = card.querySelector('.card-body')

    // mata qualquer tween em andamento nesse card antes de criar um novo:
    // evita que uma animação de abertura "atrasada" (delay 0.15) termine
    // de rodar depois da hora quando o mouse passa rápido entre os cards
    gsap.killTweensOf(card)
    if (body) gsap.killTweensOf(body)

    gsap.to(card, {
      flexGrow: isActive ? EXPANDED_FLEX : COLLAPSED_FLEX,
      duration: 0.6,
      ease: 'power3.out',
      overwrite: true
    })

    gsap.to(body, {
      opacity: isActive ? 1 : 0,
      duration: isActive ? 0.5 : 0.2,
      delay: isActive ? 0.15 : 0,
      ease: 'power1.out',
      overwrite: true
    })
  })
}

onMounted(async () => {
  // espera o DOM renderizar o v-for antes de mexer nos elementos
  await nextTick()

  cardRefs.value.forEach(card => {
    if (card) gsap.set(card, { flexGrow: COLLAPSED_FLEX })
  })

  activate(cardRefs.value[0]) // Cultura aberto por padrão
})

onBeforeUnmount(() => {
  // mata tweens em andamento pra não animar elementos já removidos do DOM
  cardRefs.value.forEach(card => {
    if (!card) return
    gsap.killTweensOf(card)
    const body = card.querySelector('.card-body')
    if (body) gsap.killTweensOf(body)
  })
})
</script>

<template>
  <div class="container">
    <div>
      <BadgeComponent class="badge-neutral">
        Procure sua oportunidade dos sonhos
      </BadgeComponent>
      <h2>NOSSOS MOTORES PRINCIPAIS</h2>
    </div>

    <div class="cards-wrap" ref="cardsWrap" @mouseleave="activate(cardRefs[0])">
      <div v-for="(item, index) in items" :key="item.label" class="card" :style="{ '--card-color': item.color }"
        ref="cardRefs" @mouseenter="activate(cardRefs[index])">
        <div class="card-label">{{ item.label }}</div>
        <div class="card-body">
          <div class="card-content">
            <div class="card-text">{{ item.text }}</div>
            <div class="card-tag">{{ item.tag }}</div>
          </div>
          <div class="card-image" :style="{ backgroundImage: `url(${item.image})` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.container {
  width: 100%;
  padding: var(--gb-space-y) 0;

  & h2 {
    font-size: 2.2vw;
    margin-top: 10px;
    margin-bottom: 30px;
  }
}

BadgeComponent {
  font-size: 0.78vw;
  padding: 10px 18px;
}

* {
  box-sizing: border-box;
}

.cards-wrap {
  display: flex;
  gap: 20px;
  width: 100%;
  height: 600px;
  margin: 0 auto;
}

.card {
  position: relative;
  flex: 1 1 0;
  min-width: 160px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  padding: 24px 20px;
  background: var(--card-color);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.card-label {
  font-weight: 700;
  font-size: clamp(14px, 1.15vw, 18px);
  /* reduzido e fluido, pra caber mesmo no card colapsado */
  letter-spacing: 0.01em;
  text-transform: uppercase;
  white-space: nowrap;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.card-body {
  opacity: 0;
  display: flex;
  flex-direction: row;
  gap: 20px;
  height: 100%;
  min-width: 0;
  /* permite os filhos encolherem dentro do flex, evitando overflow */
}

.card-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1 1 40%;
  min-width: 0;
}

.card-text {
  font-size: 15px;
  line-height: 1.5;
}

.card-image {
  flex: 1 1 55%;
  border-radius: 8px;
  background-size: cover;
  background-position: start;
  min-height: 0;
}

.card-tag {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.25);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  margin-top: auto;
  white-space: nowrap;
}

</style>