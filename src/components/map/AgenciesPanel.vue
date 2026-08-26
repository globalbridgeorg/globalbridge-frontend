<script setup>
import { ref } from 'vue'

defineProps({
  agencies: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  selectedCountry: { type: Object, default: null } // { nomeIngles, nomePt }
})
const emit = defineEmits(['clear-country'])

// No celular esse painel é uma folha que "espia" embaixo do globo; tocar no
// cabeçalho expande pra ver a lista inteira (no desktop o clique não muda
// nada visualmente, já mostra tudo).
const agenciesExpanded = ref(false)
</script>

<template>
  <aside class="agencies-panel" :class="{ expanded: agenciesExpanded }">
    <div
      class="panel-heading"
      role="button"
      tabindex="0"
      :aria-expanded="agenciesExpanded"
      aria-label="Expandir ou recolher a lista de agências"
      @click="agenciesExpanded = !agenciesExpanded"
      @keydown.enter="agenciesExpanded = !agenciesExpanded"
      @keydown.space.prevent="agenciesExpanded = !agenciesExpanded"
    >
      <span class="panel-eyebrow">{{ agencies.length }} encontrada{{ agencies.length === 1 ? '' : 's' }}</span>
      <h2 class="panel-title">Agências</h2>
      <div v-if="selectedCountry" class="country-badge">
        <span>{{ selectedCountry.nomePt }}</span>
        <button class="country-badge-clear" @click.stop="emit('clear-country')" aria-label="Ver agências de todos os países">✕</button>
      </div>
    </div>
    <div class="agencies-list" data-lenis-prevent>
      <p v-if="loading" class="agencies-loading">Carregando agências...</p>
      <div v-for="agency in agencies" :key="agency.id" class="agency-card">
        <div class="agency-header">
          <span class="agency-name">{{ agency.name }}</span>
          <span class="agency-stars" role="img" :aria-label="`${agency.stars} de 5 estrelas`">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= agency.stars }" aria-hidden="true">{{ i <= agency.stars ? '★' : '☆' }}</span>
          </span>
        </div>
        <p class="agency-desc">{{ agency.description }}</p>
        <div class="agency-footer">
          <span class="agency-location">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="#757067" stroke-width="1.3" />
              <circle cx="8" cy="6" r="1.6" stroke="#757067" stroke-width="1.3" />
            </svg>
            {{ agency.location }}
          </span>
          <router-link :to="{ name: 'agencia', params: { id: agency.id } }" class="agency-btn">Acessar</router-link>
        </div>
      </div>
      <p v-if="!loading && agencies.length === 0" class="no-agencies">
        {{ selectedCountry ? `Ainda não há agências cadastradas em ${selectedCountry.nomePt}.` : 'Nenhuma agência para os filtros selecionados.' }}
      </p>
    </div>
  </aside>
</template>

<style>
/* ── Agencies panel ──────────────────────────────────────────────────── */
.agencies-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 320px;
  background: white;
  border-left: 1px solid var(--gb-purple-deep-16);
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.agencies-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.agency-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.agency-card:hover {
  box-shadow: 0 8px 20px rgba(23,17,26,0.08);
  border-color: var(--gb-magenta);
}
.agency-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.agency-name {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 14px;
  color: var(--gb-dark);
  text-transform: uppercase;
}
.agency-stars { white-space: nowrap; }
.star { font-size: 12px; color: var(--gb-purple-deep-16); }
.star.filled { color: var(--gb-magenta); }
.agency-desc { font-size: 12px; color: var(--gb-ink-soft); line-height: 1.55; margin: 0; }
.agency-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
.agency-location {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--gb-ink-faint);
}
.agency-btn {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  border-radius: var(--gb-radius-pill);
  padding: 6px 14px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  cursor: pointer;
  text-transform: uppercase;
  white-space: nowrap;
  text-decoration: none;
  display: inline-block;
}
.agency-btn:hover { background: var(--gb-magenta); }
.no-agencies {
  font-size: 12px;
  color: var(--gb-ink-faint);
  text-align: center;
  padding: 20px 0;
}
.agencies-loading {
  font-size: 12px;
  color: var(--gb-ink-faint);
  text-align: center;
  padding: 20px 0;
}
.country-badge {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--gb-pink);
  color: var(--gb-magenta-strong);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 5px 6px 5px 12px;
  border-radius: var(--gb-radius-pill);
}
.country-badge-clear {
  background: rgba(122, 15, 116, 0.14);
  border: none;
  color: var(--gb-magenta-strong);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.country-badge-clear:hover {
  background: rgba(122, 15, 116, 0.24);
}

/* ── Mobile ──────────────────────────────────────────────────────────────
   No desktop é uma coluna fixa de 320px ao lado do globo. No celular vira
   uma folha que "espia" embaixo do globo — toca no cabeçalho pra expandir. */
@media (max-width: 768px) {
  .agencies-panel {
    top: auto;
    left: 0;
    right: 0;
    bottom: 74px;
    width: 100%;
    height: 38vh;
    max-height: 38vh;
    border-left: none;
    border-top: 1px solid var(--gb-purple-deep-16);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.25);
    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 90;
  }
  .agencies-panel.expanded {
    height: 80vh;
    max-height: 80vh;
  }
  .agencies-panel .panel-heading {
    position: relative;
    padding: 22px 20px 14px;
    cursor: pointer;
  }
  .agencies-panel .panel-heading::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    border-radius: 3px;
    background: var(--gb-purple-deep-16);
  }
}
</style>
