<script setup>
import HeaderComponent from "@/components/layout/HeaderComponent.vue";
import FooterComponent from "@/components/layout/FooterComponent.vue";
import MobileTabBar from "@/components/layout/MobileTabBar.vue";
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { initSmoothScroll } from '@/utils/lenis'

const route = useRoute()

const shouldShowFooter = computed(() => !['mapview', 'profile', 'login', 'test'].includes(route.name))
// No desktop o header é fixed e flutua por cima da cena do login sem
// empurrar nada — isso continua igual. No celular ele deixou de ser fixed
// (ver media query abaixo) e passou a ocupar espaço real no fluxo da
// página; o login/cadastro é uma cena de tela cheia própria (100vh, sem
// nav), então nesse caso o header em fluxo empurrava o conteúdo pra baixo
// e sobrava scroll vertical. Por isso essa classe só some o header via
// CSS dentro da media query mobile, sem afetar o desktop.
const ocultarHeaderMobile = computed(() => route.name === 'login')
// MobileTabBar já se esconde nessas rotas — sem isso o <main> reservava
// 74px de espaço embaixo pra uma barra que não estava lá, sobrando um
// vão vazio (e mais scroll) no celular.
const shouldShowTabBar = computed(() => !['login', 'test'].includes(route.name))

onMounted(() => {
  initSmoothScroll()
})
</script>

<template>
  <main :class="{ 'sem-tabbar': !shouldShowTabBar, 'sem-header-mobile': ocultarHeaderMobile }">
    <HeaderComponent
    class="header"
    />
    <div class="page-viewport">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition type="transition" :name="['mapview', 'profile'].includes(currentRoute.name) ? 'page-focus-noenter' : 'page-focus'">
          <component :is="Component" :key="currentRoute.path" />
        </transition>
      </router-view>
    </div>
    <FooterComponent v-if="shouldShowFooter" />
    <MobileTabBar v-if="shouldShowTabBar" />
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

/* No celular o header deixa de flutuar sobre o conteúdo (era fixed,
   igual no PC) e passa a rolar junto com a página — a barra de abas
   fixa (MobileTabBar) é que garante acesso rápido à navegação agora.
   Por isso reserva espaço embaixo pra ela não cobrir o rodapé/conteúdo. */
@media (max-width: 768px) {
  header {
    /* "relative" em vez de "static": continua ocupando espaço no fluxo
       normal (não flutua sobre o conteúdo como no PC), mas mantém o
       z-index funcionando — sem isso, elementos fixed de tela cheia
       (como o globo do /mapview) pintariam por cima do header. */
    position: relative;
    height: auto;
    box-shadow: none;
  }

  main {
    padding-bottom: 74px;
  }

  main.sem-tabbar {
    padding-bottom: 0;
  }

  main.sem-header-mobile .header {
    display: none;
  }
}

/* Corte C — Zoom com foco: a página atual estica levemente e desfoca,
   como se a câmera passasse por ela; a nova entra logo atrás, um pouco
   menor, ganhando nitidez até encaixar. */
:deep(.page-focus-enter-active) {
  transition: transform 0.2s ease 0.02s, filter 0.2s ease 0.02s, opacity 0.2s ease 0.02s;
}

:deep(.page-viewport > .page-focus-leave-active) {
  transition: transform 0.16s ease, filter 0.16s ease, opacity 0.16s ease;
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

/* Indo para o mapview ou o perfil a entrada é instantânea (sem
   zoom/blur); a saída de outras páginas para lá mantém a animação
   normal, e sair do mapview/perfil pra qualquer outro lugar também. */
:deep(.page-focus-noenter-enter-active) {
  transition: none;
}

:deep(.page-viewport > .page-focus-noenter-leave-active) {
  transition: transform 0.16s ease, filter 0.16s ease, opacity 0.16s ease;
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