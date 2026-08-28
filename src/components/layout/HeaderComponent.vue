<script setup>
import { ref, computed, watchEffect } from 'vue'
import ButtonComponent from '@/components/common/ButtonComponent.vue'
import { usePWA } from '@/composables/usePWA'
import { useContaAtual } from '@/composables/useContaAtual'
import { useRoute } from 'vue-router'

const { isInstallable, installPWA } = usePWA()
const mobileMenuOpen = ref(false)
const route = useRoute()
const { estado: conta, carregarConta } = useContaAtual()

const headerClass = computed(() => {
  return route.meta?.headerWidth === 'compact' ? 'header-compact' : 'header-full'
})

// O login é uma cena de tela cheia própria (o fundo de prédios preenche
// o viewport todo) — nela o header volta a flutuar por cima no celular,
// em vez de ocupar espaço no fluxo como no resto do site, senão sobra
// uma tarja em branco no topo da cena (ver LoginView.vue).
const flutuanteNoMobile = computed(() => route.name === 'login')

const isLoggedIn = computed(() => {
  route.fullPath
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  return !!token
})

watchEffect(() => { if (isLoggedIn.value) carregarConta() })

const buttonText = computed(() => isLoggedIn.value ? 'Perfil' : 'Entrar')
// Conta business (tipo=agencia) tem painel próprio — manda pra lá em vez
// do perfil de estudante, que não sabe nada sobre agência.
const buttonLink = computed(() => {
  if (!isLoggedIn.value) return '/login'
  return conta.tipo === 'agencia' ? '/business' : '/profile'
})

const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
  <header class="navbar" :class="[headerClass, { flutuante: flutuanteNoMobile }]">
    <div class="navbar_logo">
      <router-link to="/">
        <img src="/logogb.png" alt="GlobalBridge">
      </router-link>
    </div>

  <!-- nav mobile -->
    <button
      class="mobile-menu-btn"
      :class="{ open: mobileMenuOpen }"
      @click="toggleMenu"
      aria-label="Menu"
      :aria-expanded="mobileMenuOpen"
      aria-controls="mobile-nav"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- nav desktop -->
    <nav class="navbar_links desktop-nav">
      <router-link to="/destinos">Destinos</router-link>
      <router-link to="/mapview">Meu destino</router-link>
      <router-link to="/como-funciona">Como funciona</router-link>
      <router-link to="/contato">Contato</router-link>
      <button type="button" @click="installPWA" class="install-link">
        Instalar App
      </button>
    </nav>

    <router-link :to="buttonLink" 
      class="desktop-btn"
      >
      <ButtonComponent 
        :text="buttonText" 
        icon-position="right"
      />
    </router-link>

    <!-- menu mobile -->
    <Transition name="mobile-menu">
      <div v-if="mobileMenuOpen" id="mobile-nav" class="mobile-nav">
        <div class="mobile-nav-glow" aria-hidden="true"></div>

        <button class="mobile-nav-close" @click="toggleMenu" aria-label="Fechar menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>
        </button>

        <div class="mobile-nav-inner" data-lenis-prevent>
          <span class="mobile-nav-eyebrow">Navegar</span>

          <nav class="mobile-nav-links">
            <router-link to="/destinos" @click="toggleMenu">
              <span>Destinos</span>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#FF7DEE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L12 4M12 4H5M12 4V11" /></svg>
            </router-link>
            <router-link to="/mapview" @click="toggleMenu">
              <span>Meu destino</span>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#FF7DEE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L12 4M12 4H5M12 4V11" /></svg>
            </router-link>
            <router-link to="/como-funciona" @click="toggleMenu">
              <span>Como funciona</span>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#FF7DEE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L12 4M12 4H5M12 4V11" /></svg>
            </router-link>
            <router-link to="/contato" @click="toggleMenu">
              <span>Contato</span>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#FF7DEE" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L12 4M12 4H5M12 4V11" /></svg>
            </router-link>
          </nav>

          <div class="mobile-nav-bottom">
            <button type="button" class="mobile-nav-sub" @click="installPWA">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(251,246,231,0.65)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M4 19h16" /></svg>
              Instalar o app
            </button>
            <a class="mobile-nav-sub" href="mailto:contato@globalbridge.com">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(251,246,231,0.65)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg>
              contato@globalbridge.com
            </a>

            <router-link :to="buttonLink" class="mobile-nav-cta" @click="toggleMenu">
              {{ buttonText === 'Perfil' ? 'Ver meu perfil' : 'Entrar na conta' }}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L12 4M12 4H5M12 4V11" /></svg>
            </router-link>
          </div>
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
  height: 75px;
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

.navbar {
  left: 50%;
  transform: translateX(-50%);
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

.desktop-nav a,
.desktop-nav .install-link {
  text-decoration: none;
  color: var(--gb-plum);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 10px;
  transition: all 0.2s ease;
}

.install-link {
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
}

.desktop-nav a:hover,
.desktop-nav .install-link:hover {
  background: #f0ede6;
  border-radius: 20px;
  transform: scale(1.05);
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 110;
}

.mobile-menu-btn span {
  width: 26px;
  height: 3px;
  background: var(--gb-plum);
  border-radius: 3px;
  transition: all 0.3s ease;
}

/* Com o menu aberto, o hambúrguer da pílula branca some — quem fecha o
   menu agora é o X bem visível dentro do próprio painel escuro (.mobile-nav-close),
   evitando dois "X" diferentes brigando pela atenção. */
.mobile-menu-btn.open {
  opacity: 0;
  pointer-events: none;
}

/* Menu mobile (overlay em tela cheia, roxo escuro) — some atrás da pílula
   do header (que continua com z-index mais alto e fundo opaco), e para
   um pouco acima da barra de abas fixa (MobileTabBar), que fica sempre
   visível por baixo. */
.mobile-nav {
  position: fixed;
  inset: 0;
  bottom: 74px;
  background: var(--gb-purple-deep);
  overflow: hidden;
  z-index: 500;
  display: flex;
}

.mobile-nav-glow {
  position: absolute;
  top: -90px;
  right: -70px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(176, 31, 176, 0.45) 0%, rgba(176, 31, 176, 0) 70%);
  pointer-events: none;
}

.mobile-nav-close {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.mobile-nav-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mobile-nav-inner {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 100px 28px 32px;
  overflow-y: auto;
}

.mobile-nav-eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(251, 246, 231, 0.5);
  margin-bottom: 6px;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
}

.mobile-nav-links a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 60px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  text-decoration: none;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 1.55rem;
  letter-spacing: -0.02em;
  color: #fff;
}

.mobile-nav-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 28px;
}

.mobile-nav-sub {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  font-size: 0.92rem;
  color: rgba(251, 246, 231, 0.75);
  text-decoration: none;
}

.mobile-nav-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  border-radius: 12px;
  background: #a33da3;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.desktop-btn {
  text-decoration: none;
}

.header-full {
  max-width: 1440px;
}

/* /mapview tem um painel fixo de 300px grudado na esquerda e outro de
   320px na direita (ver MapFilterPanel/AgenciesPanel). Em vez de tentar
   CALCULAR uma largura seguramente centralizada (o que dá errado porque
   300 ≠ 320 — centralizar na viewport não é o mesmo que centralizar no
   vão entre os painéis, a conta simples de "vw menos os dois" fica torta
   pra um lado), a pílula é ancorada direto nas bordas dos painéis com
   left/right — o navegador preenche o vão sozinho, sem risco de sobrepor
   nenhum dos dois lados nem precisar de margem de segurança arbitrária.
   Abaixo de 768px o layout dos painéis muda pra mobile (ver media query
   lá embaixo) e essas âncoras deixam de valer. */
.header-compact {
  left: 300px;
  right: 320px;
  transform: none;
  width: auto;
  max-width: 1200px;
  margin: 16px auto;
}

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
  /* :not(.header-compact) — sem isso, essa regra e a de .header-compact
     têm a mesma especificidade e teriam que disputar por ordem no
     arquivo; assim cada uma cuida só do seu caso e não há risco de uma
     pisar na largura calculada da outra se o CSS for reordenado depois. */
  .navbar:not(.header-compact) {
    max-width: 1227px;
  }
}

/* No /mapview, a régua de links do menu desktop (logo + 4 links + 2
   botões) precisa de uns 700px pra caber sem quebrar — só encolher o
   max-width da pílula (regra acima) não é suficiente sozinho, porque o
   conteúdo dela ainda vazaria por cima dos painéis fixos antes de a
   tela ficar pequena o bastante pra virar o layout mobile de verdade
   (768px). Por isso o header compacto troca pro menu hambúrguer bem
   mais cedo que o resto do site, mas continua flutuando fixo (não entra
   no fluxo da página como acontece abaixo de 768px) — os painéis do mapa
   são fixos também, então o header precisa continuar por cima deles. */
@media (max-width: 1400px) {
  .header-compact .desktop-nav,
  .header-compact .desktop-btn {
    display: none;
  }

  .header-compact .mobile-menu-btn {
    display: flex;
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
    /* Deixa de flutuar (fixed) sobre o conteúdo, igual acontece no PC —
       agora fica no fluxo normal da página, no topo, e rola junto com
       o resto. A barra de abas fixa (MobileTabBar) cobre a necessidade
       de navegação sempre visível. "relative" (não "static") pra manter
       o z-index acima de elementos fixed de tela cheia, como o globo do
       /mapview. */
    position: relative;
    left: auto;
    right: auto;
    width: auto;
    transform: none;
    margin: 12px 12px 0;
  }

  /* Login: volta a flutuar por cima da cena (ver flutuanteNoMobile) em
     vez de ocupar espaço no fluxo — a cena de fundo preenche a tela
     inteira atrás dela. */
  .navbar.flutuante {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    margin: 12px auto 0;
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