<script setup>
import { ref, computed } from 'vue'
import ButtonComponent from './ButtonComponent.vue'
import { usePWA } from '@/composables/usePWA'
import { useRoute } from 'vue-router'

const { isInstallable, installPWA } = usePWA()
const mobileMenuOpen = ref(false)
const route = useRoute()

const headerClass = computed(() => {
  return route.meta?.headerWidth === 'compact' ? 'header-compact' : 'header-full' 
})

const isLoggedIn = computed(() => {
  route.fullPath
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  return !!token
})

const buttonText = computed(() => isLoggedIn.value ? 'Perfil' : 'Entrar')
const buttonLink = computed(() => isLoggedIn.value ? '/profile' : '/login')

const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
  <header class="navbar" :class="headerClass">
    <div class="navbar_logo">
      <router-link to="/">
        <img src="/logogb.png" alt="GlobalBridge">
      </router-link>
    </div>

  <!-- nav mobile -->
    <button class="mobile-menu-btn" @click="toggleMenu" aria-label="Menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- nav desktop -->
    <nav class="navbar_links desktop-nav">
      <router-link to="/mapview">Meu destino</router-link>
      <router-link to="/">Companhias</router-link>
      <router-link to="/test">uploadIMG</router-link>
      <a @click.prevent="installPWA" class="install-link">
        Baixar App
      </a>
    </nav>

    <router-link :to="buttonLink" 
      class="desktop-btn"
      >
      <ButtonComponent 
        :text="buttonText" 
        iconType="primary"
      />
    </router-link>

    <!-- menu mobile -->
    <Transition name="mobile-menu">
      <div v-if="mobileMenuOpen" class="mobile-nav">
        <router-link to="/" @click="toggleMenu">Meu destino</router-link>
        <router-link to="/" @click="toggleMenu">Companhias</router-link>
        <router-link to="/test" @click="toggleMenu">Contato</router-link>
        <div class="buttonsmenu">
          <ButtonComponent 
            text="Instalar App" 
            @click="installPWA"
          />
          <router-link :to="buttonLink" @click="toggleMenu">
            <ButtonComponent 
              :text="buttonText" 
              iconType="primary"
            />
          </router-link>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 72px;
  background: #ffffff;
  border-radius: 15px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  font-family: 'Montserrat', sans-serif;
  max-width: 1440px;
  margin: 16px auto;
  position: fixed;
   transition: max-width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              margin 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-radius 0.4s ease,
              box-shadow 0.3s ease;
}

.navbar_logo img {
  height: 40px;
  transition: transform 0.2s ease;
}

/* desktop nav */
.desktop-nav {
  display: flex;
  gap: 20px;
}

.desktop-nav a {
  text-decoration: none;
  color: #42023C;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 10px;
  transition: all 0.2s ease;
}

.desktop-nav a:hover {
  background: #f0ede6;
  border-radius: 20px;
  transform: scale(1.05);
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 30px;
  height: 21px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 110;
}

.mobile-menu-btn span {
  width: 100%;
  height: 3px;
  background: #42023C;
  border-radius: 3px;
  transition: all 0.3s ease;
}

/* menu mobile (overlay) */
.mobile-nav {
  position: fixed;
  top: 72px;
  left: 0;
  right: 0;
  background: white;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  z-index: 100;
  display: flex;
}

.mobile-nav a {
  text-decoration: none;
  color: #42023C;
  font-size: 18px;
  font-weight: 600; 
  padding: 10px;
}

.buttonsmenu {
  display: flex;
  gap: 10px;
}

.desktop-btn {
  text-decoration: none;
}

.header-full {
  max-width: 1440px;
}

.header-compact {
  max-width: 1200px;
}

.header- 

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 1600px) {
  .navbar {
    max-width: 1227px;
  }
  .header-compact {
    max-width: 1100px;
  }
}

@media (max-width: 768px) {
  .desktop-nav,
  .desktop-btn {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .navbar {
    margin: 0px 12px;
    position: fixed;
  }
}

@media (min-width: 769px) {
  .mobile-nav {
    display: none !important;
  }
  .mobile-menu-btn {
    display: none;
  }
}
</style>