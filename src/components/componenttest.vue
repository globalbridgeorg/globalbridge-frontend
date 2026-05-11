<script setup>
import BadgeComponent from '@/components/BadgeComponent.vue'
import ButtonComponent from '@/components/ButtonComponent.vue'
import { onMounted } from 'vue'
import { useVideoLoader } from "@/composables/useVideoLoader.js"

const props = defineProps({
  src: String
})

const { videoSrc, loadVideo } = useVideoLoader()

onMounted(() => {
  if (props.src) {
    loadVideo(props.src)
  }
})
</script>

<template>
  <section class="contentlayer">
    <!-- Card gigante flutuante à direita -->
    <div class="card-wrapper">
      <div class="card card-pink">
        <BadgeComponent class="badge-custom">
          +40 países
        </BadgeComponent>
        
        <h2 class="title">NOSSAS OPÇÕES</h2>
        
        <p class="description">
          Explore nossa seleção com mais de 40 países ao redor do mundo. 
          Compare destinos e descubra qual combina com seu perfil, planeje sua 
          experiência internacional com mais segurança e confiança com base em:
        </p>
        
        <ul class="feature-list">
          <li>custo de vida</li>
          <li>recepção local</li>
          <li>cultura interna</li>
          <li>nível de idioma</li>
        </ul>
        
        <div class="footer-info">
          <p class="update-text">Seleção atualizada 2026</p>
          <p class="brand-text">GlobalBridge®</p>
        </div>
      </div>
    </div>

    <!-- Botão "Veja todos" no canto inferior esquerdo -->
    <div class="button-wrapper">
      <ButtonComponent text="Veja todos" iconType="primary" />
    </div>

    <!-- Vídeo de fundo -->
    <div class="videoverlay">
      <video
        v-if="videoSrc"
        :src="videoSrc"
        autoplay muted loop playsinline
        class="video-landing"
      />
    </div>
  </section>
</template>

<style scoped>
.contentlayer {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.videoverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.video-landing {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Wrapper do card flutuante */
.card-wrapper {
  position: absolute;
  right: 5%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  width: 100%;
  max-width: 480px;
}

.card-pink {
  background-color: #FFF5F2;
  border-radius: 24px;
  padding: 40px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  color: #A33DA3;
  display: flex;
  flex-direction: column;
}

.badge-custom {
  background-color: #FFBFB0 !important;
  color: #A33DA3 !important;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 8px 16px;
  border-radius: 50px;
  display: inline-block;
  width: fit-content;
  margin-bottom: 20px;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #B44C30;
  margin-bottom: 16px;
  line-height: 1.1;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  color: #5A3A3A;
  margin-bottom: 24px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
}

.feature-list li {
  font-size: 1rem;
  color: #5A3A3A;
  padding: 4px 0;
  position: relative;
  padding-left: 20px;
}

.feature-list li::before {
  content: "•";
  color: #B44C30;
  position: absolute;
  left: 0;
  font-weight: bold;
}

.footer-info {
  margin-top: auto;
}

.update-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #B44C30;
  margin: 0 0 4px 0;
}

.brand-text {
  font-size: 0.875rem;
  color: #B44C30;
  font-weight: 400;
  margin: 0;
}

/* Botão no canto inferior esquerdo */
.button-wrapper {
  position: absolute;
  bottom: 40px;
  left: 40px;
  z-index: 1;
}

.button-wrapper :deep(.custom-btn) {
  background-color: white;
  color: #B44C30;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  font-weight: 600;
}

.button-wrapper :deep(.btn-icon) {
  filter: invert(37%) sepia(78%) saturate(1200%) hue-rotate(340deg) brightness(90%) contrast(90%);
}

/* Responsividade */
@media (max-width: 1024px) {
  .card-wrapper {
    right: 3%;
    max-width: 400px;
  }
  
  .title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .contentlayer {
    flex-direction: column;
    min-height: auto;
    padding: 20px;
  }
  
  .videoverlay {
    position: relative;
    height: 300px;
    margin-bottom: -30px;
    border-radius: 20px;
    overflow: hidden;
  }
  
  .video-landing {
    height: 300px;
    border-radius: 20px;
  }
  
  .card-wrapper {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    max-width: 100%;
    margin-top: -40px;
    z-index: 2;
  }
  
  .card-pink {
    padding: 30px 24px;
  }
  
  .title {
    font-size: 1.75rem;
  }
  
  .button-wrapper {
    position: relative;
    bottom: auto;
    left: auto;
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
}
</style>