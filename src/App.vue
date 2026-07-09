<script setup>
import HeaderComponent from "@/components/HeaderComponent.vue";
import FooterComponent from "@/components/FooterComponent.vue";
import { onMounted } from 'vue'
import { initSmoothScroll } from '@/utils/lenis'

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