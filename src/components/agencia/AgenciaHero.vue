<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritos } from '@/composables/useFavoritos'
import { iniciaisDe } from '@/utils/iniciais'
import { sanitizarUrl } from '@/utils/url'

const router = useRouter()

const props = defineProps({
  agencia: { type: Object, required: true },
  variante: { type: String, default: 'foto' }
})

const erroFoto = ref(false)
watch(() => props.agencia?.imagem_capa_url, () => { erroFoto.value = false })

const siteSeguro = computed(() => sanitizarUrl(props.agencia?.site))

const { estaLogado, isFavorito, toggleFavorito } = useFavoritos()

const favoritado = computed(() => isFavorito('agencia', props.agencia.id))
function pulsarFavorito(el) {
  if (!el) return
  el.classList.remove('pulso')
  void el.offsetWidth
  el.classList.add('pulso')
}
function handleFavoritar(event) {
  if (!estaLogado.value) {
    router.push('/login')
    return
  }
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
        <span v-if="agencia.nota_media != null" class="stars-lg" role="img" :aria-label="`${Math.round(agencia.nota_media)} de 5 estrelas`">
          <span v-for="(preenchida, i) in estrelas" :key="i" class="filled" :class="{ empty: !preenchida }" aria-hidden="true">{{ preenchida ? '★' : '☆' }}</span>
          <span class="rating-num on-banner">{{ agencia.nota_media.toFixed(1) }} · {{ agencia.total_avaliacoes }} avaliaç{{ agencia.total_avaliacoes === 1 ? 'ão' : 'ões' }}</span>
        </span>
        <span v-if="agencia.cidade" class="location-row on-banner">
          <i class="fi fi-rr-marker location-icon" aria-hidden="true"></i>
          {{ agencia.cidade }}<template v-if="agencia.pais">, {{ agencia.pais }}</template>
        </span>
      </div>
      <p v-if="agencia.descricao" class="tagline on-banner">{{ agencia.descricao }}</p>
      <div class="hero-actions">
        <a v-if="agencia.contato" :href="`mailto:${agencia.contato}`" class="btn-primary-lg">Falar com a agência</a>
        <a v-if="siteSeguro" :href="siteSeguro" target="_blank" rel="noopener noreferrer" class="btn-outline-lg btn-outline-on-banner">Visitar site</a>
        <button type="button" class="fav-btn fav-btn-on-banner" :class="{ active: favoritado }" :aria-pressed="estaLogado ? favoritado : undefined" :aria-label="!estaLogado ? 'Faça login para salvar nos favoritos' : (favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos')" @click="handleFavoritar">
          <i class="fi fav-icon" :class="favoritado ? 'fi-sr-heart' : 'fi-rr-heart'" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </section>

  <section v-else class="hero reveal-section">
    <div class="avatar" :class="{ 'has-photo': agencia.imagem_capa_url && !erroFoto }">
      <img
        v-if="agencia.imagem_capa_url && !erroFoto"
        :src="agencia.imagem_capa_url"
        :alt="`Foto de ${agencia.nome}`"
        class="avatar-img"
        :style="{ objectPosition: `${agencia.imagem_capa_foco_x ?? 50}% ${agencia.imagem_capa_foco_y ?? 50}%` }"
        @error="erroFoto = true"
      />
      <span v-else aria-hidden="true">{{ iniciais }}</span>
    </div>
    <div class="hero-info">
      <h1 class="agencia-title">{{ agencia.nome }}</h1>
      <div class="meta-row">
        <span v-if="agencia.nota_media != null" class="stars-lg" role="img" :aria-label="`${Math.round(agencia.nota_media)} de 5 estrelas`">
          <span v-for="(preenchida, i) in estrelas" :key="i" class="filled" :class="{ empty: !preenchida }" aria-hidden="true">{{ preenchida ? '★' : '☆' }}</span>
          <span class="rating-num">{{ agencia.nota_media.toFixed(1) }} · {{ agencia.total_avaliacoes }} avaliaç{{ agencia.total_avaliacoes === 1 ? 'ão' : 'ões' }}</span>
        </span>
        <span v-if="agencia.cidade" class="location-row">
          <i class="fi fi-rr-marker location-icon" aria-hidden="true"></i>
          {{ agencia.cidade }}<template v-if="agencia.pais">, {{ agencia.pais }}</template>
        </span>
      </div>
      <p class="tagline">{{ agencia.descricao }}</p>
      <p v-if="agencia.outros_paises?.length" class="tambem-atende">Também atende: {{ agencia.outros_paises.join(', ') }}</p>
    </div>
    <div class="hero-actions">
      <a v-if="agencia.contato" :href="`mailto:${agencia.contato}`" class="btn-primary-lg">Falar com a agência</a>
      <a v-if="siteSeguro" :href="siteSeguro" target="_blank" rel="noopener noreferrer" class="btn-outline-lg">Visitar site</a>
      <button
        type="button"
        class="fav-btn"
        :class="{ active: favoritado }"
        :aria-pressed="estaLogado ? favoritado : undefined"
        :aria-label="!estaLogado ? 'Faça login para salvar nos favoritos' : (favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos')"
        @click="handleFavoritar"
      >
        <i class="fi fav-icon" :class="favoritado ? 'fi-sr-heart' : 'fi-rr-heart'" aria-hidden="true"></i>
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
  background: linear-gradient(0deg, rgba(23, 17, 26, 0.92) 8%, rgba(23, 17, 26, 0.62) 56%, rgba(23, 17, 26, 0.22) 100%);
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
  flex-wrap: wrap;
  align-items: center;
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
  width: 112px;
  height: 112px;
  border-radius: 24px;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 40px;
  color: #fff;
  box-shadow: 0 10px 26px rgba(23, 17, 26, 0.12);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

.tagline.on-banner {
  color: rgba(251, 246, 231, 0.88);
  max-width: 640px;
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
  flex-shrink: 0;
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
  font-size: 16px;
}

.location-icon {
  font-size: 13px;
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
  .hero-actions { flex-direction: row; flex-wrap: wrap; align-items: center; width: 100%; }
  .hero-actions a { flex: 1; }
}

@media (max-width: 480px) {
  .btn-primary-lg, .btn-outline-lg { padding: 12px 16px; }
}
</style>
