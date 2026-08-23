<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Barra de abas fixa, só em telas de celular (ver media query no <style>).
// Ao contrário do header, que agora rola junto com a página no mobile,
// essa barra fica sempre visível — é o jeito rápido de trocar de seção
// sem precisar abrir o menu hambúrguer.
const route = useRoute()

const isLoggedIn = computed(() => {
  route.fullPath
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  return !!token
})

const perfilLink = computed(() => (isLoggedIn.value ? '/profile' : '/login'))

// Em rotas de tela cheia (login/cadastro) a barra atrapalha mais do que
// ajuda — o /mapview já tem seu próprio layout mobile (globo + folha de
// agências) que reserva espaço embaixo pra ela.
const rotasOcultas = ['login', 'test']
const mostrar = computed(() => !rotasOcultas.includes(route.name))

const abas = computed(() => [
  { to: '/', nome: 'home', label: 'Início' },
  { to: '/destinos', nome: 'destinos', label: 'Destinos' },
  { to: '/mapview', nome: 'mapview', label: 'Meu destino' },
  { to: perfilLink.value, nome: isLoggedIn.value ? 'profile' : 'login', label: 'Perfil' }
])

const ativa = (aba) => {
  if (aba.nome === 'destinos') return ['destinos', 'regiao', 'pais', 'agencia'].includes(route.name)
  return route.name === aba.nome
}
</script>

<template>
  <nav v-if="mostrar" class="mobile-tabbar" aria-label="Navegação principal">
    <router-link
      v-for="aba in abas"
      :key="aba.label"
      :to="aba.to"
      class="tab"
      :class="{ on: ativa(aba) }"
    >
      <span class="icon" aria-hidden="true">
        <svg v-if="aba.label === 'Início'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /></svg>
        <svg v-else-if="aba.label === 'Destinos'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M9 9v11" /></svg>
        <svg v-else-if="aba.label === 'Meu destino'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" /></svg>
        <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
      </span>
      <span class="label">{{ aba.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.mobile-tabbar {
  display: none;
}

@media (max-width: 768px) {
  .mobile-tabbar {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: center;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 74px;
    padding-bottom: env(safe-area-inset-bottom, 0);
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(14px);
    border-top: 1px solid var(--gb-purple-deep-16);
    z-index: 1000;
  }

  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 48px;
    color: var(--gb-ink-faint);
    text-decoration: none;
  }

  .icon {
    display: flex;
  }

  .label {
    font-family: var(--gb-font-eyebrow);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .tab.on {
    color: var(--gb-magenta);
  }
}
</style>
