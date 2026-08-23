<script setup>
import HeaderComponent from "@/components/layout/HeaderComponent.vue";
import FooterComponent from "@/components/layout/FooterComponent.vue";
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { initSmoothScroll } from '@/utils/lenis'

const route = useRoute()

const shouldShowFooter = computed(() => !['mapview', 'profile', 'login', 'test'].includes(route.name))

onMounted(() => {
  initSmoothScroll()
})
</script>

<template>
  <main>
    <HeaderComponent
    class="header"
    />
    <div class="page-viewport">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition name="page-depth">
          <component :is="Component" :key="currentRoute.path" />
        </transition>
      </router-view>
    </div>
    <FooterComponent v-if="shouldShowFooter" />
  </main>
</template>

<style scoped>

header {
  position: fixed;
  justify-self: center;
  top: 0;
  width: 100%;
  height: 80px;
  background-color: #fff;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.page-viewport {
  position: relative;
  overflow-x: clip;
}

/* Corte B — Deslizar com profundidade: a página que sai recua e some
   à distância; a nova entra por cima, um pouco maior, até encaixar. */
:deep(.page-depth-enter-active) {
  transition: transform 0.32s ease, opacity 0.32s ease;
}

:deep(.page-depth-leave-active) {
  transition: transform 0.28s ease, opacity 0.28s ease;
  position: absolute;
  inset: 0;
  width: 100%;
  z-index: 1;
}

:deep(.page-depth-enter-from) {
  transform: translateX(34px) scale(1.02);
  opacity: 0;
}

:deep(.page-depth-leave-to) {
  transform: translateX(-34px) scale(0.96);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.page-depth-enter-active),
  :deep(.page-depth-leave-active) {
    transition: none !important;
  }
}
</style>