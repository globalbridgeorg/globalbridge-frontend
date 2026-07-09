<script setup>
import HeaderComponent from "@/components/layout/HeaderComponent.vue";
import FooterComponent from "@/components/layout/FooterComponent.vue";
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { initSmoothScroll } from '@/utils/lenis'

const route = useRoute()

const shouldShowFooter = computed(() => !['mapview', 'profile', 'login'].includes(route.name))

onMounted(() => {
  initSmoothScroll()
})
</script>

<template>
  <main>
    <HeaderComponent 
    class="header"
    />
    <router-view />
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
</style>