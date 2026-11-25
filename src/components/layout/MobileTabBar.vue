<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useContaAtual } from '@/composables/useContaAtual'

// Barra de abas fixa, só em telas de celular (ver media query no <style>).
// Ao contrário do header, que agora rola junto com a página no mobile,
// essa barra fica sempre visível — é o jeito rápido de trocar de seção
// sem precisar abrir o menu hambúrguer.
const route = useRoute()
const { estado: conta, carregarConta } = useContaAtual()

const isLoggedIn = computed(() => conta.logado)

watchEffect(() => { carregarConta() })

// Mesma lógica do HeaderComponent — conta business vai pro painel dela,
// não pro perfil de estudante.
const perfilLink = computed(() => {
  if (!isLoggedIn.value) return '/login'
  return conta.tipo === 'agencia' ? '/business' : '/profile'
})

// Em rotas de tela cheia (login/cadastro) a barra atrapalha mais do que
// ajuda — o /mapview já tem seu próprio layout mobile (globo + folha de
// agências) que reserva espaço embaixo pra ela.
const rotasOcultas = ['login', 'esqueci-senha', 'redefinir-senha']
const mostrar = computed(() => !rotasOcultas.includes(route.name))

const abas = computed(() => [
  { to: '/', nome: 'home', label: 'Início' },
  { to: '/destinos', nome: 'destinos', label: 'Destinos' },
  { to: '/mapview', nome: 'mapview', label: 'Meu destino' },
  { to: perfilLink.value, nome: isLoggedIn.value ? 'profile' : 'login', label: conta.tipo === 'agencia' ? 'Painel' : 'Perfil' }
])

const ativa = (aba) => {
  if (aba.nome === 'destinos') return ['destinos', 'regiao', 'pais', 'agencia'].includes(route.name)
  if (aba.nome === 'profile') return ['profile', 'business', 'business-editor', 'business-analise', 'admin'].includes(route.name)
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
      :aria-current="ativa(aba) ? 'page' : undefined"
    >
      <span class="icon" aria-hidden="true">
        <i v-if="aba.label === 'Início'" class="fi fi-rr-home"></i>
        <i v-else-if="aba.label === 'Destinos'" class="fi fi-rr-map"></i>
        <i v-else-if="aba.label === 'Meu destino'" class="fi fi-rr-globe"></i>
        <i v-else class="fi fi-rr-user"></i>
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
    font-size: 20px;
  }

  .label {
    font-family: var(--gb-font-eyebrow);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    position: relative;
  }

  /* A aba ativa não pode depender só da cor — quem não distingue
     magenta de cinza precisa de outro sinal. Um traço embaixo do
     rótulo cobre isso sem competir visualmente com o ícone. */
  .tab.on .label::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -4px;
    transform: translateX(-50%);
    width: 12px;
    height: 2px;
    border-radius: 2px;
    background: var(--gb-magenta);
  }

  .tab.on {
    color: var(--gb-magenta);
  }
}
</style>
