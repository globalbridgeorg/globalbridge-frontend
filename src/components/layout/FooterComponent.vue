<script setup>
import ButtonComponent from '@/components/common/ButtonComponent.vue'
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'

const route = useRoute()

const isLoggedIn = computed(() => {
  route.fullPath
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  return !!token
})

const buttonText = computed(() => isLoggedIn.value ? 'Perfil' : 'Entrar')
const buttonLink = computed(() => isLoggedIn.value ? '/profile' : '/login')
const buttonmapview = '/mapview'

const marqueeTrackRef = ref(null)
let marqueeTween = null

onMounted(() => {
  const track = marqueeTrackRef.value
  if (!track) return

  // a track tem o texto duplicado (2x); anda metade da largura e reinicia sem "salto" visível
  marqueeTween = gsap.to(track, {
    xPercent: -50,
    duration: 22,
    ease: 'none',
    repeat: -1
  })
})

onBeforeUnmount(() => marqueeTween?.kill())
</script>

<template>
  <footer class="footer">
    <div class="footer-cta">
      <div class="cta-inner">
        <span class="cta-badge">Uma ponte para você?</span>
        <h2 class="cta-title">SEU <span class="accent">FUTURO</span> NÃO SE MOLDA SOZINHO.</h2>
        <p class="cta-subtitle">Quer conhecer o destino perfeito pra seu futuro?</p>

        <div class="cta-buttons">
          <router-link :to="buttonmapview">
            <ButtonComponent text="Explorar destinos" iconType="primary" />
          </router-link>

          <router-link :to="buttonLink">
            <ButtonComponent
              :text="buttonText"
              iconType="secondary"
              style="background-color: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.35);"
            />
          </router-link>
        </div>
      </div>
    </div>

    <div class="footer-main">
      <div class="footer-main-inner">
        <div class="footer-brand">
          <span>GLOBAL</span>
          <span>BRIDGE</span>
        </div>

        <div class="footer-links">
          <div class="footer-links-col">
            <span class="footer-links-label">Plataforma</span>
            <router-link to="/mapview">Meu destino</router-link>
            <router-link to="/#passos">Agências</router-link>
            <router-link to="/#formatos">Planos</router-link>
          </div>

          <div class="footer-links-col">
            <span class="footer-links-label">Contato</span>
            <a href="mailto:contato@globalbridge.com">contato@globalbridge.com</a>
            <a href="#" target="_blank" rel="noopener">Instagram</a>
            <a href="#" target="_blank" rel="noopener">LinkedIn</a>
          </div>
        </div>

        <a href="mailto:contato@globalbridge.com" class="footer-contact-btn">
          <ButtonComponent
            text="Entre em contato"
            iconType="primary"
            style="background-color: #17111A; color: #fff;"
          />
        </a>
      </div>

      <div class="footer-bottom">
        <span>© 2026 GlobalBridge®</span>
        <span class="footer-legal"><a href="#">Termos</a> · <a href="#">Privacidade</a></span>
      </div>
    </div>

    <div class="marquee">
      <div class="marquee-track" ref="marqueeTrackRef">
        <span>Moldando seu futuro&nbsp;·&nbsp;Moldando seu futuro&nbsp;·&nbsp;Moldando seu futuro&nbsp;·&nbsp;Moldando seu futuro&nbsp;·&nbsp;</span>
        <span aria-hidden="true">Moldando seu futuro&nbsp;·&nbsp;Moldando seu futuro&nbsp;·&nbsp;Moldando seu futuro&nbsp;·&nbsp;Moldando seu futuro&nbsp;·&nbsp;</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  overflow: hidden;
}

/* --- CTA escuro --- */
.footer-cta {
  background-color: var(--gb-purple-deep);
  padding: 96px 5% 104px;
  text-align: center;
}

.cta-inner {
  max-width: 760px;
  margin: 0 auto;
}

.cta-badge {
  display: inline-block;
  background: var(--gb-magenta);
  color: #fff;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 8px 16px;
  border-radius: 20px;
  margin-bottom: 24px;
}

.cta-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-size: clamp(1.8rem, 1.1rem + 3.2vw, 3.4rem);
  color: #fff;
  margin: 0 0 16px;
}

.cta-title .accent {
  color: #FF7DEE;
}

.cta-subtitle {
  color: rgba(255, 255, 255, 0.65);
  font-size: 1rem;
  margin: 0 0 36px;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* --- Footer rosa --- */
.footer-main {
  background-color: var(--gb-pink);
  padding: 56px 5% 0;
}

.footer-main-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 40px;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  line-height: 0.95;
  font-size: 1.8rem;
  color: var(--gb-dark);
}

.footer-links {
  display: flex;
  gap: 48px;
  flex-wrap: wrap;
}

.footer-links-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-links-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8A5F82;
  margin-bottom: 4px;
}

.footer-links-col a {
  color: var(--gb-dark);
  text-decoration: none;
  font-size: 0.9rem;
}

.footer-links-col a:hover {
  text-decoration: underline;
}

.footer-contact-btn {
  align-self: flex-start;
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 24px 0;
  border-top: 1px solid rgba(23, 17, 26, 0.15);
  font-size: 0.8rem;
  color: #6B4E64;
}

.footer-legal a {
  color: inherit;
  text-decoration: none;
}

.footer-legal a:hover {
  text-decoration: underline;
}

/* --- Marquee infinito --- */
.marquee {
  background-color: var(--gb-pink);
  overflow: hidden;
  padding: 8px 0 24px;
}

.marquee-track {
  display: flex;
  width: max-content;
  white-space: nowrap;
  will-change: transform;
}

.marquee-track span {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(3rem, 2rem + 6vw, 7rem);
  color: rgba(23, 17, 26, 0.08);
  -webkit-text-stroke: 1.5px rgba(23, 17, 26, 0.18);
}

@media (min-width: 768px) {
  .footer-main-inner {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }

  .footer-contact-btn {
    align-self: center;
  }
}
</style>
