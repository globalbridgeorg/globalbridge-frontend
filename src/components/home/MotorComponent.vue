<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const items = [
  {
    label: 'Cultura',
    color: '#7A0F74',
    text: 'Descubra como é o estilo de vida em cada país, seus costumes, tradições e a forma como estrangeiros são recebidos pela população local.',
    image: '/images/motoresCultura.png',
    alt: 'Cultura local em destino de intercâmbio',
    tag: 'Perto do seu dia a dia'
  },
  {
    label: 'Idioma',
    color: '#3972DE',
    text: 'Conheça os idiomas falados, o nível de proficiência necessário e as oportunidades para aprender ou aprimorar uma nova língua durante o intercâmbio.',
    image: '/images/MotoresIdiomas.png',
    alt: 'Prática de idioma durante o intercâmbio',
    tag: 'Fale o idioma de verdade'
  },
  {
    label: 'Ensino',
    color: '#B4601F',
    text: 'Explore a qualidade das instituições, os tipos de cursos disponíveis e as opções de programas acadêmicos para estudantes internacionais.',
    image: '/images/motoresEnsino.png',
    alt: 'Sala de aula em instituição de ensino',
    tag: 'Ensino em foco'
  },
  {
    label: 'Oportunidade',
    color: '#33803E',
    text: 'Veja as possibilidades de trabalho, estágios e outros programas que você pode estudar e trabalhar enquanto vive a experiência internacional.',
    image: '/images/motoresOportunidades.png',
    alt: 'Oportunidade de trabalho durante o intercâmbio',
    tag: 'Oportunidade em foco'
  }
]

const tilesRef = ref([])
let ctx

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from(tilesRef.value, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: tilesRef.value[0], start: 'top 82%' }
    })
  })
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="container">
    <SectionEyebrow label="Nossos motores" />

    <div class="heading-row">
      <h2 class="gb-heading">Nossos motores<br />principais</h2>
      <p class="heading-desc">
        Quatro lentes pra comparar um destino — cultura, idioma, ensino e
        oportunidade lado a lado.
      </p>
    </div>

    <div class="tiles">
      <div
        v-for="(item, index) in items"
        :key="item.label"
        class="tile"
        :style="{ '--tile-color': item.color }"
        :ref="el => (tilesRef[index] = el)"
      >
        <img class="tile-img" :src="item.image" :alt="item.alt" />
        <div class="tile-tint"></div>
        <div class="tile-scrim"></div>

        <div class="tile-content">
          <h3 class="tile-label">{{ item.label }}</h3>
          <p class="tile-text">{{ item.text }}</p>
          <span class="tile-tag">{{ item.tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  padding: var(--gb-space-y) 0;
}

.heading-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0 32px;
}

.heading-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 360px;
  margin: 0;
}

.tiles {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.tile {
  position: relative;
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  border: 1px solid var(--gb-purple-deep-16);
  cursor: pointer;
  aspect-ratio: 4 / 5;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.tile:hover {
  box-shadow: 0 16px 32px rgba(23, 17, 26, 0.16);
  transform: translateY(-3px);
}

.tile:hover .tile-img {
  transform: scale(1.06);
}

.tile-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.tile-tint {
  position: absolute;
  inset: 0;
  background: var(--tile-color);
  mix-blend-mode: multiply;
  opacity: 0.55;
}

.tile-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(23, 17, 26, 0) 40%, rgba(23, 17, 26, 0.78) 100%);
}

.tile-content {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 20px;
}

.tile-label {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 20px;
  color: #fff;
  margin: 0 0 8px;
}

.tile-text {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.88);
  margin: 0 0 10px;
}

.tile-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  border-radius: var(--gb-radius-pill);
  padding: 5px 12px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 600;
  font-size: 11px;
  color: #fff;
}

@media (min-width: 640px) {
  .tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .heading-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

@media (min-width: 1024px) {
  .tiles {
    grid-template-columns: repeat(4, 1fr);
    aspect-ratio: auto;
    height: 460px;
  }

  .tile {
    aspect-ratio: auto;
  }
}
</style>
