<script setup>
import { onMounted } from "vue"
import { useRoute } from "vue-router"
import { scrollToTarget } from "@/utils/lenis"
import VideoComponent from "@/components/home/VideoComponent.vue";
import ButtonComponent from "@/components/common/ButtonComponent.vue";
import PhotoGrid from '@/components/home/PhotoGridComponent.vue'
import Landing from '@/components/home/LandingComponent.vue';
import Numeros from '@/components/home/NumerosComponent.vue';
import Paises from '@/components/home/PaisesComponent.vue';
import FaqComponent from "@/components/home/FaqComponent.vue";
import MotorComponent from "@/components/home/MotorComponent.vue";
import CustoComponent from "@/components/home/CustoComponent.vue";
import FormatoComponent from "@/components/home/FormatoComponent.vue";
import PassosComponent from "@/components/home/PassosComponent.vue";
import TimelineComponent from "@/components/home/TimelineComponent.vue";
import TestemunhosComponent from "@/components/home/TestemunhosComponent.vue";

const fotosEsquerda = [
  '/images/imagemgb1.png',
  '/images/imagemgb2.png',
  '/images/imagemgb4.png',
  '/images/imagemgb3.png'
]

const fotosDireita = [
  '/images/imagemgb4.png',
  '/images/imagemgb3.png',
  '/images/imagemgb1.png',
  '/images/imagemgb2.png'
]

const route = useRoute()

onMounted(() => {
  if (!route.hash) return
  // espera o layout (vídeo, fontes, imagens) assentar antes de calcular a posição do alvo
  setTimeout(() => scrollToTarget(route.hash), 400)
})
</script>

<template>
  <section class="content-header">
    <VideoComponent src="/videos/overlayglobalbridge.mp4" animateOnScroll title="MOLDE SEU PRÓPRIO FUTURO"
      description="Com uma plataforma acessível e centralizada, o GlobalBridge amplia oportunidades de intercâmbio e conecta usuários a destinos e agências confiáveis."
      :pills="['Mais de 20 países', 'Use gratuitamente']" />
  </section>

  <section class="content-layout">
    <PhotoGrid :imagesCol1="fotosEsquerda" :imagesCol2="fotosDireita" />
  </section>

  <section class="gb-section">
    <Landing />
  </section>

  <section class="gb-section">
    <Numeros />
  </section>

  <section class="gb-section">
    <MotorComponent />
  </section>

  <section class="gb-section">
    <Paises />
  </section>

  <section class="gb-section">
    <FaqComponent />
  </section>

  <section class="gb-section">
    <CustoComponent />
    <FormatoComponent />
  </section>

  <section class="gb-section">
    <PassosComponent />
    <TimelineComponent />
  </section>

  <section>
    <TestemunhosComponent />
  </section>
</template>

<style scoped>
.content-header {
  width: 100%;
 
}

.content-layout {
  justify-self: center;
  width: 100%;
}

/* Da seção "Sobre a GlobalBridge" (Landing) em diante, cada seção some
   colada na borda no celular — .gb-section não tem padding próprio (só
   define max-width). Mesmo respiro padrão usado no resto do site: 16px,
   igual ao hero em vídeo lá em cima. */
@media (max-width: 768px) {
  .gb-section {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>