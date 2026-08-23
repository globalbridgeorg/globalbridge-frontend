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
        <transition :name="currentRoute.name === 'mapview' ? 'page-focus-noenter' : 'page-focus'">
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

/* Corte C — Zoom com foco: a página atual estica levemente e desfoca,
   como se a câmera passasse por ela; a nova entra logo atrás, um pouco
   menor, ganhando nitidez até encaixar. */
:deep(.page-focus-enter-active) {
  transition: transform 0.34s ease 0.05s, filter 0.34s ease 0.05s, opacity 0.34s ease 0.05s;
}

:deep(.page-viewport > .page-focus-leave-active) {
  transition: transform 0.26s ease, filter 0.26s ease, opacity 0.26s ease;
  position: absolute;
  inset: 0;
  width: 100%;
  z-index: 1;
}

:deep(.page-focus-enter-from) {
  transform: scale(0.97);
  filter: blur(7px);
  opacity: 0;
}

:deep(.page-focus-leave-to) {
  transform: scale(1.045);
  filter: blur(7px);
  opacity: 0;
}

/* Indo para o mapview a entrada é instantânea (sem zoom/blur); a saída
   de outras páginas para o mapview mantém a animação normal. */
:deep(.page-focus-noenter-enter-active) {
  transition: none;
}

:deep(.page-viewport > .page-focus-noenter-leave-active) {
  transition: transform 0.26s ease, filter 0.26s ease, opacity 0.26s ease;
  position: absolute;
  inset: 0;
  width: 100%;
  z-index: 1;
}

:deep(.page-focus-noenter-leave-to) {
  transform: scale(1.045);
  filter: blur(7px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.page-focus-enter-active),
  :deep(.page-focus-leave-active),
  :deep(.page-focus-noenter-leave-active) {
    transition: none !important;
  }
}
</style>