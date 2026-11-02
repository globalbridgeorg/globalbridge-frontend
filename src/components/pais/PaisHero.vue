<script setup>
import { ref, computed } from 'vue'
import { useFavoritos } from '@/composables/useFavoritos'

const props = defineProps({
  pais: { type: Object, required: true },
  regiaoLabel: { type: String, default: '' }
})

const { estaLogado, isFavorito, toggleFavorito } = useFavoritos()

const favoritado = computed(() => isFavorito('pais', props.pais.id))
const favIcon = ref(null)
function handleFavoritar() {
  toggleFavorito('pais', props.pais.id)
  // Reinicia a animação CSS via reflow forçado em vez de um ref reativo
  // com requestAnimationFrame + setTimeout — essa dupla podia entrar em
  // corrida (o timeout que tira a classe disparando antes do rAF que
  // bota), deixando o pulso preso ligado.
  const el = favIcon.value
  if (!el) return
  el.classList.remove('pulso')
  void el.offsetWidth
  el.classList.add('pulso')
}
</script>

<template>
  <section class="hero reveal-section">
    <div class="hero-top">
      <span class="hero-eyebrow">Destino{{ regiaoLabel ? ` · ${regiaoLabel}` : '' }}</span>
      <div class="hero-top-right">
        <img v-if="pais.imagem_url" :src="pais.imagem_url" :alt="`Bandeira de ${pais.nome}`" class="hero-flag" loading="lazy" />
        <button
          v-if="estaLogado"
          class="fav-btn"
          :class="{ active: favoritado }"
          :aria-pressed="favoritado"
          :aria-label="favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos'"
          @click="handleFavoritar"
        >
          <svg ref="favIcon" width="18" height="18" viewBox="0 0 24 24" :fill="favoritado ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="fav-icon">
            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 4.5 6 4c2.1-.3 3.9.9 6 3 2.1-2.1 3.9-3.3 6-3 3.7.5 5.5 4.2 4 7.9-2.5 4.5-10 9.1-10 9.1z" />
          </svg>
        </button>
      </div>
    </div>
    <h1 class="hero-title">{{ pais.nome }}</h1>
    <p class="hero-desc">{{ pais.descricao }}</p>
    <div class="hero-pills">
      <span v-if="pais.idioma" class="hero-pill">Idioma: {{ pais.idioma }}</span>
      <span v-if="pais.custo_de_vida" class="hero-pill">Custo de vida: {{ pais.custo_de_vida }}</span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  background: var(--gb-purple-deep);
  border-radius: 24px;
  padding: 40px 44px;
  color: #fff;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.hero-eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-pink);
}

.hero-flag {
  width: 40px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.hero-top-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.fav-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

.fav-btn.active {
  color: var(--gb-magenta);
  border-color: var(--gb-magenta);
  background: rgba(176, 31, 176, 0.16);
}

.fav-icon {
  display: block;
}

.fav-icon.pulso {
  animation: fav-pop 260ms ease-out;
}

@keyframes fav-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .fav-icon.pulso {
    animation: none;
  }
}

.hero-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(2.2rem, 1.4rem + 3.4vw, 3.6rem);
  line-height: 0.98;
  margin: 0 0 16px;
}

.hero-desc {
  color: rgba(255, 255, 255, 0.78);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 620px;
  margin: 0;
}

.hero-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 13px;
  border-radius: var(--gb-radius-pill);
}

@media (max-width: 720px) {
  .hero { padding: 32px 24px; }
}
</style>
