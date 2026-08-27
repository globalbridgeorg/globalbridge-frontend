<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({
  // [{ id, label, options: [{ value, label, count }] }]
  filters: { type: Array, required: true },
  activeFilters: { type: Object, required: true }
})
const emit = defineEmits(['toggle-filter', 'clear-filters'])

// No celular o painel de filtros começa fechado (é um overlay que desliza por
// cima do globo, não uma coluna fixa ao lado como no desktop).
const panelCollapsed = ref(window.matchMedia('(max-width: 768px)').matches)
const openSections = reactive({ emprego: true, universidade: false, idioma: false, cultura: false })

const totalActiveFilters = computed(() =>
  Object.values(props.activeFilters).reduce((acc, arr) => acc + arr.length, 0)
)

function toggleSection(id) { openSections[id] = !openSections[id] }
</script>

<template>
  <!-- Botão flutuante e fundo escurecido: só existem visualmente no celular
       (ver media query no <style>), onde o painel vira um overlay que desliza
       por cima do globo em vez de uma coluna fixa ao lado. -->
  <button class="mobile-filter-toggle" @click="panelCollapsed = !panelCollapsed" :aria-label="panelCollapsed ? 'Abrir filtros' : 'Fechar filtros'">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17111A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>
    <span>Filtros</span>
    <span v-if="totalActiveFilters > 0" class="badge">{{ totalActiveFilters }}</span>
  </button>
  <div v-if="!panelCollapsed" class="filter-backdrop" @click="panelCollapsed = true"></div>

  <aside class="filter-panel" :class="{ collapsed: panelCollapsed }">
    <button class="collapse-btn" @click="panelCollapsed = !panelCollapsed" :aria-label="panelCollapsed ? 'Expandir filtros' : 'Recolher filtros'">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" :style="{ transform: panelCollapsed ? 'rotate(180deg)' : 'none' }">
        <path d="M10 3L5 8L10 13" stroke="#17111A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <div class="panel-inner" data-lenis-prevent>
      <div class="panel-heading">
        <span class="panel-eyebrow">Explorar por</span>
        <h2 class="panel-title">Filtros</h2>
      </div>

      <div class="filter-section" v-for="section in filters" :key="section.id">
        <button
          type="button"
          class="section-header"
          @click="toggleSection(section.id)"
          :aria-expanded="openSections[section.id]"
          :aria-controls="`filtro-opcoes-${section.id}`"
        >
          <span class="section-label">{{ section.label }}</span>
          <span class="section-count" v-if="activeFilters[section.id]?.length">{{ activeFilters[section.id].length }}</span>
          <svg class="section-arrow" :class="{ open: openSections[section.id] }" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6L8 10L12 6" stroke="#757067" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div :id="`filtro-opcoes-${section.id}`" class="section-options" :class="{ open: openSections[section.id] }">
          <button
            v-for="opt in section.options"
            :key="opt.value"
            type="button"
            class="option-item"
            :class="{ active: activeFilters[section.id]?.includes(opt.value) }"
            :aria-pressed="activeFilters[section.id]?.includes(opt.value)"
            @click="emit('toggle-filter', section.id, opt.value)"
          >
            <span class="option-check" aria-hidden="true">
              <svg v-if="activeFilters[section.id]?.includes(opt.value)" width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L4.8 8.8L10 3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="option-text">{{ opt.label }}</span>
            <span class="option-count" v-if="opt.count">{{ opt.count }}</span>
          </button>
        </div>
      </div>
      <button class="clear-btn" @click="emit('clear-filters')">Limpar filtros</button>
    </div>
  </aside>
</template>

<style>
/* ── Filter panel ────────────────────────────────────────────────────── */
.filter-panel {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 300px;
  background: white;
  border-right: 1px solid var(--gb-purple-deep-16);
  transition: transform 0.35s cubic-bezier(.4,0,.2,1);
  z-index: 100;
  display: flex;
  flex-direction: column;
}
.filter-panel.collapsed { transform: translateX(-268px); }
.collapse-btn {
  position: absolute;
  top: 50%;
  right: -16px;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(23,17,26,0.14);
  z-index: 101;
}
.collapse-btn:hover { background: var(--gb-cream); }
.collapse-btn svg { transition: transform 0.25s ease; }
.panel-inner {
  padding: 8px 16px 16px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.filter-section { border-bottom: 1px solid var(--gb-purple-deep-16); }
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 16px 8px;
  background: none;
  border: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.section-header:hover .section-label { color: var(--gb-magenta); }
.section-label {
  flex: 1;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.1em;
  color: var(--gb-dark);
  text-transform: uppercase;
  transition: color 0.15s ease;
}
.section-count {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  color: #fff;
  background: var(--gb-magenta);
  border-radius: var(--gb-radius-pill);
  padding: 2px 8px;
}
.section-arrow {
  flex-shrink: 0;
  transition: transform 0.25s;
}
.section-arrow.open { transform: rotate(180deg); }
.section-options {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(.4,0,.2,1);
}
.section-options.open { max-height: 400px; }
.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 8px 9px 4px;
  background: none;
  border: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
}
.option-item:hover { background: rgba(46,10,46,0.04); }
.option-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1.5px solid var(--gb-purple-deep-16);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: background-color 150ms ease-out, border-color 150ms ease-out;
}
.option-item.active .option-check {
  background: var(--gb-magenta);
  border-color: transparent;
}
.option-text {
  flex: 1;
  font-size: 13px;
  color: var(--gb-dark);
}
.option-count {
  font-family: var(--gb-font-eyebrow);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--gb-ink-faint);
  background: var(--gb-purple-deep-16);
  padding: 2px 8px;
  border-radius: var(--gb-radius-pill);
}
.clear-btn {
  margin: 20px 8px 4px;
  padding: 11px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 12px;
  background: transparent;
  color: var(--gb-dark);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.08em;
  cursor: pointer;
  text-transform: uppercase;
}
.clear-btn:hover { background: rgba(46,10,46,0.04); }

/* ── Mobile ──────────────────────────────────────────────────────────────
   No desktop o painel é uma coluna fixa de 300px ao lado do globo. Isso não
   cabe num celular, então aqui ele vira um overlay que desliza da esquerda
   (aberto por um botão flutuante, com fundo escurecido atrás). */
.mobile-filter-toggle,
.filter-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .mobile-filter-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    position: fixed;
    top: 88px;
    left: 12px;
    z-index: 60;
    background: #fff;
    border: 1px solid var(--gb-purple-deep-16);
    border-radius: var(--gb-radius-pill);
    padding: 10px 16px;
    font-family: var(--gb-font-eyebrow);
    font-weight: 700;
    font-size: 11.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--gb-dark);
    box-shadow: 0 4px 16px rgba(23, 17, 26, 0.14);
    cursor: pointer;
  }
  .mobile-filter-toggle .badge {
    background: var(--gb-magenta);
    color: #fff;
    font-size: 10.5px;
    font-weight: 700;
    border-radius: 999px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
  }

  .filter-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(23, 17, 26, 0.45);
    z-index: 99;
  }

  .filter-panel {
    width: 86vw;
    max-width: 340px;
    height: auto;
    top: 0;
    bottom: 74px;
    box-shadow: 8px 0 30px rgba(0, 0, 0, 0.25);
  }
  .filter-panel.collapsed {
    transform: translateX(-100%);
  }
  .collapse-btn {
    /* substituído pelo botão flutuante + fundo escurecido no celular */
    display: none;
  }
}
</style>
