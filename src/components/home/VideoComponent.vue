<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue"
import { useVideoLoader } from "@/composables/useVideoLoader.js"
import { useScrollAnimation } from "@/composables/useScrollAnimation.js"

const props = defineProps({
  src: String,
  animateOnScroll: { type: Boolean, default: false },
  title: String,
  description: String,
  pills: Array,
  // Modo compacto: preenche a altura do elemento pai em vez do hero de
  // tela cheia (100vh) — pra usar o vídeo dentro de um card/seção comum.
  compact: { type: Boolean, default: false }
})

const { videoSrc, loadVideo } = useVideoLoader()

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const scrollData = useScrollAnimation(700)
const videoStyle = scrollData ? scrollData.videoStyle : ref({})

const finalVideoStyle = computed(() => {
  if (isMobile.value) return {}
  return props.animateOnScroll ? videoStyle.value : {}
})

onMounted(() => {
  loadVideo(props.src)
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div
    :class="[
      'video-container',
      { 'scroll-wrapper': props.animateOnScroll && !isMobile, compact: props.compact }
    ]"
  >
    <div 
      class="video-overlay-content"
      :style="finalVideoStyle"
    >
      <video
        v-if="videoSrc"
        :src="videoSrc"
        autoplay muted loop playsinline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        class="video-bg"
      />
      
      <div v-if="title || description" class="hero-layout">
        <div class="hero-left">
          <h1 class="hero-title">{{ title }}</h1>
        </div>
        
        <div class="hero-right">
          <div v-if="pills && pills.length" class="hero-pills">
            <span v-for="(pill, i) in pills" :key="i" class="pill">
              {{ pill }}
            </span>
          </div>
          <p class="hero-description">{{ description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* pc */
.video-container {
  width: 100%;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  align-items: center;
  display: flex;
  justify-content: center;
  padding-bottom: 390px;
}

.video-overlay-content {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.video-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.hero-layout {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 80px 5%;
  box-sizing: border-box;
  pointer-events: auto;
}

.hero-left {
  max-width: 50%;
}

.hero-title {
  color: white;
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  text-transform: uppercase;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.hero-right {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.pill {
  background-color: #e35ed8;
  color: white;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

.hero-description {
  color: white;
  font-size: 1.1rem;
  line-height: 1.5;
  margin: 0;
  opacity: 0.95;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.scroll-wrapper {
  margin-bottom: -40vh;
}

.scroll-wrapper .video-overlay-content {
  position: sticky;
  top: 0;
}

/* Modo compacto: preenche a altura do elemento pai (que precisa ter uma
   altura definida -- height, ou um item de flex com align-items: stretch)
   em vez do dimensionamento de hero em tela cheia. */
.video-container.compact {
  min-height: 0;
  height: 100%;
  padding-bottom: 0;
}

.video-container.compact .video-overlay-content {
  min-height: 0;
  height: 100%;
}

/* mobile */
@media (max-width: 768px) {
  .video-container {
    padding: 90px 16px 16px 16px;
    box-sizing: border-box;
    min-height: 60vh;
  }

  .video-overlay-content {
    min-height: 70vh;
    border-radius: 24px;
    overflow: hidden;
    position: relative !important;
    top: auto !important;
    transform: none !important;
  }

  .video-bg {
    border-radius: 24px;
  }

  .video-container.compact {
    padding: 0;
    min-height: 0;
    height: 100%;
  }

  .video-container.compact .video-overlay-content {
    min-height: 0;
    height: 100%;
    border-radius: 0;
  }

  .hero-layout {
    flex-direction: column;
    justify-content: flex-end;
    min-height: 80vh;
    padding: 40px 24px;
    gap: 24px;
  }

  .hero-left {
    max-width: 100%;
  }

  .hero-title {
    font-size: clamp(1.8rem, 8vw, 2.5rem);
    text-align: left;
  }

  .hero-right {
    max-width: 100%;
    gap: 16px;
  }

  .hero-pills {
    display: flex;
    flex-wrap: nowrap;
    justify-content: flex-start;
  }

  .pill {
    font-size: 0.75rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .scroll-wrapper {
    margin-bottom: 0;
  }
  .scroll-wrapper .video-overlay-content {
    position: relative !important;
    top: auto !important;
    transform: none !important;
  }
}
</style>