<script setup>
import { computed } from 'vue'
import { useFavoritos } from '@/composables/useFavoritos'
import { iniciaisDe } from '@/utils/iniciais'

const props = defineProps({
  agencia: { type: Object, required: true },
  variante: { type: String, default: 'foto' }
})

const { estaLogado, isFavorito, toggleFavorito } = useFavoritos()

const favoritado = computed(() => isFavorito('agencia', props.agencia.id))
function pulsarFavorito(el) {
  if (!el) return
  el.classList.remove('pulso')
  void el.offsetWidth
  el.classList.add('pulso')
}
function handleFavoritar(event) {
  toggleFavorito('agencia', props.agencia.id)
  pulsarFavorito(event.currentTarget.querySelector('.fav-icon'))
}

const iniciais = computed(() => iniciaisDe(props.agencia.nome))

const estrelas = computed(() => {
  const nota = Math.round(props.agencia.nota_media ?? 0)
  return Array.from({ length: 5 }, (_, i) => i < nota)
})
</script>

<template>
  <section
    v-if="variante === 'banner'"
    class="hero hero-banner reveal-section"
    :style="agencia.imagem_capa_url ? {
      backgroundImage: `url(${agencia.imagem_capa_url})`,
      backgroundPosition: `${agencia.imagem_capa_foco_x ?? 50}% ${agencia.imagem_capa_foco_y ?? 50}%`,
    } : {}"
  >
    <div class="hero-banner-scrim"></div>
    <div class="hero-banner-content">
      <h1 class="agencia-title on-banner">{{ agencia.nome }}</h1>
      <div class="meta-row">
        <span v-if="agencia.nota_media !== null" class="stars-lg" role="img" :aria-label="`${Math.round(agencia.nota_media)} de 5 estrelas`">
          <span v-for="(preenchida, i) in estrelas" :key="i" class="filled" :class="{ empty: !preenchida }" aria-hidden="true">{{ preenchida ? '★' : '☆' }}</span>
          <span class="rating-num on-banner">{{ agencia.nota_media.toFixed(1) }} · {{ agencia.total_avaliacoes }} avaliaç{{ agencia.total_avaliacoes === 1 ? 'ão' : 'ões' }}</span>
        </span>
        <span v-if="agencia.cidade" class="location-row on-banner">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="#fff" stroke-width="1.3"/><circle cx="8" cy="6" r="1.6" stroke="#fff" stroke-width="1.3"/></svg>
          {{ agencia.cidade }}<template v-if="agencia.pais">, {{ agencia.pais }}</template>
        </span>
      </div>
      <div class="hero-actions">
        <a v-if="agencia.contato" :href="`mailto:${agencia.contato}`" class="btn-primary-lg">Falar com a agência</a>
        <a v-if="agencia.site" :href="agencia.site" target="_blank" rel="noopener" class="btn-outline-lg btn-outline-on-banner">Visitar site</a>
        <button v-if="estaLogado" class="fav-btn fav-btn-on-banner" :class="{ active: favoritado }" :aria-pressed="favoritado" :aria-label="favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos'" @click="handleFavoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" :fill="favoritado ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="fav-icon"><path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 4.5 6 4c2.1-.3 3.9.9 6 3 2.1-2.1 3.9-3.3 6-3 3.7.5 5.5 4.2 4 7.9-2.5 4.5-10 9.1-10 9.1z" /></svg>
        </button>
      </div>
    </div>
  </section>

  <section v-else class="hero reveal-section">
    <div class="avatar" aria-hidden="true">{{ iniciais }}</div>
    <div class="hero-info">
      <h1 class="agencia-title">{{ agencia.nome }}</h1>
      <div class="meta-row">
        <span v-if="agencia.nota_media !== null" class="stars-lg" role="img" :aria-label="`${Math.round(agencia.nota_media)} de 5 estrelas`">
          <span v-for="(preenchida, i) in estrelas" :key="i" class="filled" :class="{ empty: !preenchida }" aria-hidden="true">{{ preenchida ? '★' : '☆' }}</span>
          <span class="rating-num">{{ agencia.nota_media.toFixed(1) }} · {{ agencia.total_avaliacoes }} avaliaç{{ agencia.total_avaliacoes === 1 ? 'ão' : 'ões' }}</span>
        </span>
        <span v-if="agencia.cidade" class="location-row">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="#757067" stroke-width="1.3"/><circle cx="8" cy="6" r="1.6" stroke="#757067" stroke-width="1.3"/></svg>
          {{ agencia.cidade }}<template v-if="agencia.pais">, {{ agencia.pais }}</template>
        </span>
      </div>
      <p class="tagline">{{ agencia.descricao }}</p>
      <p v-if="agencia.outros_paises?.length" class="tambem-atende">Também atende: {{ agencia.outros_paises.join(', ') }}</p>
    </div>
    <div class="hero-actions">
      <a v-if="agencia.contato" :href="`mailto:${agencia.contato}`" class="btn-primary-lg">Falar com a agência</a>
      <a v-if="agencia.site" :href="agencia.site" target="_blank" rel="noopener" class="btn-outline-lg">Visitar site</a>
      <button
        v-if="estaLogado"
        class="fav-btn"
        :class="{ active: favoritado }"
        :aria-pressed="favoritado"
        :aria-label="favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos'"
        @click="handleFavoritar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" :fill="favoritado ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="fav-icon">
          <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 4.5 6 4c2.1-.3 3.9.9 6 3 2.1-2.1 3.9-3.3 6-3 3.7.5 5.5 4.2 4 7.9-2.5 4.5-10 9.1-10 9.1z" />
        </svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: wrap;
}

/* Variante "banner cheio" do hero (editor da conta business) */
.hero-banner {
  position: relative;
  min-height: 340px;
  border-radius: 20px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: var(--gb-dark);
  display: flex;
  align-items: flex-end;
}

.hero-banner-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(23, 17, 26, 0.9) 10%, rgba(23, 17, 26, 0.2) 60%);
}

.hero-banner-content {
  position: relative;
  z-index: 1;
  padding: 36px 40px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.agencia-title.on-banner {
  color: #fff;
}

.rating-num.on-banner {
  color: #fff;
}

.location-row.on-banner {
  color: rgba(251, 246, 231, 0.75);
}

.hero-banner .hero-actions {
  flex-direction: row;
  margin-top: 16px;
}

.btn-outline-lg.btn-outline-on-banner {
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
}

.fav-btn.fav-btn-on-banner {
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.fav-btn.fav-btn-on-banner.active {
  color: var(--gb-accent-light, #FF7DEE);
  border-color: var(--gb-accent-light, #FF7DEE);
}

.tambem-atende {
  font-size: 12.5px;
  color: var(--gb-ink-faint);
  margin-top: 10px;
}
.avatar {
  width: 104px;
  height: 104px;
  border-radius: 24px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 40px;
  color: #fff;
}

.hero-info {
  flex: 1;
  min-width: 260px;
}

.agencia-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(1.7rem, 1.1rem + 2vw, 2.6rem);
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--gb-dark);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin: 10px 0 14px;
}

.stars-lg {
  font-size: 17px;
  color: var(--gb-purple-deep-16);
}

.stars-lg .filled {
  color: var(--gb-magenta);
}

.stars-lg .filled.empty {
  color: var(--gb-purple-deep-16);
}

.rating-num {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 13px;
  color: var(--gb-dark);
  margin-left: 6px;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gb-ink-faint);
}

.tagline {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 560px;
  margin: 0;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.fav-btn {
  align-self: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--gb-purple-deep-16);
  background: #fff;
  color: var(--gb-ink-faint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.fav-btn:hover {
  background: rgba(46, 10, 46, 0.04);
}

.fav-btn.active {
  color: var(--gb-magenta);
  border-color: var(--gb-magenta);
  background: rgba(176, 31, 176, 0.08);
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

.btn-primary-lg, .btn-outline-lg {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 14px 26px;
  border-radius: 12px;
  text-align: center;
  white-space: nowrap;
  text-decoration: none;
}

.btn-primary-lg {
  background: var(--gb-dark);
  color: #fff;
}

.btn-primary-lg:hover {
  background: var(--gb-magenta);
}

.btn-outline-lg {
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
}

.btn-outline-lg:hover {
  background: rgba(46, 10, 46, 0.04);
}

@media (max-width: 768px) {
  .hero { flex-direction: column; align-items: flex-start; }
  .hero-actions { flex-direction: row; width: 100%; }
  .hero-actions a { flex: 1; }
}
</style>
