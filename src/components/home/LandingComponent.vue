<script setup>
import BadgeComponent from '@/components/common/BadgeComponent.vue'
import ButtonComponent from '@/components/common/ButtonComponent.vue'
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
    <div class="contentlayercima">
      <div class="card card-pink">
        <BadgeComponent style="background-color: #FF75F3; color: #42023C;">
          Programas Disponíveis
        </BadgeComponent>
        <p class="description">
          Planos de intercâmbio intensivo com ensino universitário “Study & Work”, “Au Pair” e residência garantida. 
          Programas completos para quem deseja estudar, trabalhar e viver uma experiência internacional com mais segurança e planejamento.
        </p>
        <ButtonComponent text="Saiba mais" iconType="primary" />
      </div>

      <div class="card card-blue">
        <h2 class="title">INTERCÂMBIO SEM SABER O IDIOMA</h2>
        <p class="subtitle">Veja planos de intercâmbio com ensino de idioma integrado. Comece seu futuro hoje!</p>
        <ButtonComponent text="Ver os planos" iconType="secondary" style="background-color: white; color: #42023C;" />
      </div>
    </div>

    <div class="videoverlay">
      <video
        v-if="videoSrc"
        :src="videoSrc"
        autoplay muted loop playsinline
        class="video-landing"
      />

      <div class="card card-options">
        <BadgeComponent style="background-color: #F4A97E; color: #7A2E10;">
          +40 países
        </BadgeComponent>
        <h2 class="title-options">NOSSAS OPÇÕES</h2>
        <p class="description-options">
          Explore nossa seleção com mais de 40 países ao redor do mundo. Compare destinos e descubra qual combina com seu perfil, planeje sua experiência internacional com mais segurança e confiança com base em:
        </p>
        <ul class="options-list">
          <li>custo de vida</li>
          <li>recepção local</li>
          <li>cultura interna</li>
          <li>nível de idioma</li>
        </ul>
        <p class="update-text">Seleção atualizada 2026</p>
        <p class="brand-text">GlobalBridge®</p>
      </div>

      <ButtonComponent
        text="Veja todos"
        iconType="tertiary"
        class="btn-veja-todos"
        style="background-color: white; color: #49130C;"
      />
    </div>
  </section>
</template>

<style scoped>
.contentlayer {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 40px 5%;
  gap: 24px;
}

.contentlayercima, 
.videoverlay {
  width: 100%;
  max-width: 1440px;
}

.contentlayercima {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  flex: 1;
  border-radius: 24px;
  padding: 24px;
  flex-direction: column;
  background-size: cover;
  background-position: center;
  color: white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  min-height: auto;
}

.card-pink {
  background-image: url('/images/programasdisponiveis.png');
  background-color: #ffb3e6;
}

.card-blue {
  background-image: url('/images/intercambioidioma.png');
  background-color: #4a90e2;
}

.title {
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: bold;
  margin-bottom: 12px;
}

.description {
  margin: 20px 0 30px;
  font-size: 1rem;
  line-height: 1.4;
}

.subtitle {
  font-size: 1rem;
  margin: 10px 0 30px;
}

.videoverlay {
  position: relative;
}

.video-landing {
  width: 100%;
  border-radius: 25px;
  justify-self: center;
  object-fit: cover;
  height: 300px;
  pointer-events: none;
}

/* --- Card "Nossas Opções" --- */
.card-options {
  position: absolute;
  top: 20px;
  right: 20px;
  left: 20px;
  background-color: #FBE9DE;
  color: #B1512E;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.title-options {
  font-size: clamp(1.3rem, 4vw, 1.8rem);
  font-weight: 800;
  color: #C0431F;
  margin: 12px 0 10px;
}

.description-options {
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 14px;
  color: #A85A38;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  font-size: 0.9rem;
  color: #A85A38;
}

.options-list li {
  padding: 3px 0;
}

.options-list li::before {
  content: "• ";
  color: #C0431F;
}

.update-text {
  font-weight: 700;
  color: #C0431F;
  margin: 0;
  font-size: 0.9rem;
}

.brand-text {
  color: #C9A08D;
  font-size: 0.85rem;
  margin: 2px 0 0;
}

.btn-veja-todos {
  position: absolute;
  left: 20px;
  bottom: 20px;
}

@media (min-width: 768px) {
  .contentlayercima {
    justify-self: center;
    flex-direction: row;
    gap: 20px;
  }
  
  .card {
    height: 500px;
    padding: 20px;
  }
  
  .description {
    padding-top: 200px;
    padding-bottom: 20px;
  }
  
  .title {
    font-size: 2rem;
  }
  .video-landing {
    height: 700px;
  }

  .card-options {
    top: 40px;
    right: 40px;
    left: auto;
    width: 380px;
    padding: 32px;
  }

  .btn-veja-todos {
    left: 40px;
    bottom: 40px;
  }
}

@media (max-width: 1600px) {
  .contentlayercima, 
  .videoverlay {
    max-width: 1225px;
  }
}
</style>