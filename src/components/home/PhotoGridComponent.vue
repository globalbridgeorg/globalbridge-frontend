<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BadgeComponent from '@/components/common/BadgeComponent.vue'

defineProps({
  imagesCol1: Array,
  imagesCol2: Array
})

const col1 = ref(null)
const col2 = ref(null)
const photoSection = ref(null)

const handleScroll = () => {
  if (!photoSection.value) return
  
  const sectionTop = photoSection.value.offsetTop
  const scroll = window.scrollY - sectionTop
  const speed = 0.15 
  const startOffset = 50 

  if (col1.value && col2.value) {
    col1.value.style.transform = `translateY(${startOffset - (scroll * speed)}px)`
    col2.value.style.transform = `translateY(${-startOffset + (scroll * speed)}px)`
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="main-layout-wrapper">
    <div class="info-side">
      <BadgeComponent style="background-color: #e5e0cf;">
        O céu é o limite
      </BadgeComponent>
      <h1 class="roboto-condensed">VOE ALÉM DOS SEUS LIMITES</h1>
      <p style="padding-bottom: 30px;">
        A GlobalBridge conecta você às melhores oportunidades de intercâmbio, reunindo informações essenciais sobre países, custo de vida, cultura e possibilidades de estudo e trabalho.
      </p>
      <p style="font-weight: 600; padding-bottom: 30px;">
        Compare destinos, entenda requisitos de visto e programas disponíveis, encontre agências verificadas com mais clareza e segurança.
      </p>
      <p>
        Simplificamos o planejamento da sua experiência internacional para que você escolha com confiança e dê o próximo passo com tranquilidade. Nossa missão é tornar o processo mais transparente, organizado e acessível, ajudando você a transformar o sonho do intercâmbio em um plano real e possível.
      </p>
    </div>

    <section class="photo-section" ref="photoSection">
      <div class="gallery-mask">
        <div class="gallery-container">
          <div class="column col-left" ref="col1">
            <img v-for="(img, i) in imagesCol1" :key="i" :src="img" alt="Gallery 1">
          </div>
          <div class="column col-right" ref="col2">
            <img v-for="(img, i) in imagesCol2" :key="i" :src="img" alt="Gallery 2">
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* pc */
.roboto-condensed {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 6rem;
  font-weight: 900;
  font-style: normal;
  color: #333231;
}

.main-layout-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1440px;
  margin: 0 auto;
  min-height: 100vh;
}

.info-side {
  flex: 1;
  padding-right: 50px;
}

.info-side h1 {
  line-height: 0.9;
  font-weight: 800;
  margin: 20px 0;
}

.photo-section {
  flex: 1;
  width: 100%;
  min-height: 120vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.gallery-mask {
  width: 100%;
  max-width: 800px;
  height: 1000px;
  position: relative;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
}

.gallery-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  height: 100%;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 30px;
  will-change: transform;
  margin-top: -400px;
}

.col-left {
  padding-top: 100px;
}

.col-right {
  padding-top: 0px;
}

.column img {
  width: 100%;
  height: 420px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

@media (max-width: 1600px) {
  .main-layout-wrapper {
    max-width: 1225px;
  }
}

@media (max-width: 768px) {
  .main-layout-wrapper {
    flex-direction: column;
    padding: 40px 5%;
    min-height: auto;
    gap: 40px;
  }

  .info-side {
    padding-right: 0;
    width: 100%;
  }

  .roboto-condensed {
    font-size: clamp(3rem, 8vw, 3rem);
  }

  .photo-section {
    min-height: auto;
    width: 100%;
  }

  .gallery-mask {
    height: auto;
    max-width: 100%;
    /* mantém a máscara igual ao desktop */
    mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  }

  .gallery-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    height: 50vh;
  }

  .column {
    gap: 12px;
  }

  .col-left {
    padding-top: 0;
  }

  .column img {
    height: auto;
    width: 100%;
    aspect-ratio: 2 / 3;
    border-radius: 16px;
  }
}
</style>