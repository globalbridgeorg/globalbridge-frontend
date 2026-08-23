<script setup>
const REGIAO_LABELS = {
  asia: 'Ásia',
  europa: 'Europa',
  america_norte: 'América do Norte',
  america_sul: 'América do Sul',
  oceania: 'Oceania',
  africa: 'África'
}

const props = defineProps({
  nome: { type: String, required: true },
  regiao: { type: String, default: '' },
  idioma: { type: String, default: '' },
  custoDeVida: { type: String, default: '' },
  programasCount: { type: Number, default: 0 },
  artGradient: { type: String, default: 'linear-gradient(135deg, var(--gb-purple-deep), var(--gb-magenta))' },
  to: { type: [String, Object], default: null }
})
</script>

<template>
  <article class="pais-card">
    <div class="art" :style="{ background: artGradient }">
      <span v-if="regiao" class="region-tag">{{ REGIAO_LABELS[regiao] ?? regiao }}</span>
    </div>
    <div class="body">
      <h3 class="nome">{{ nome }}</h3>
      <div class="facts">
        <span v-if="idioma" class="fact">{{ idioma }}</span>
        <span v-if="custoDeVida" class="fact">Custo: {{ custoDeVida }}</span>
      </div>
      <div class="footer">
        <span class="footer-meta">{{ programasCount }} {{ programasCount === 1 ? 'programa' : 'programas' }}</span>
        <component :is="to ? 'router-link' : 'span'" :to="to" class="cta">Ver destino</component>
      </div>
    </div>
  </article>
</template>

<style scoped>
.pais-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.pais-card:hover {
  box-shadow: var(--gb-shadow-card);
  border-color: var(--gb-magenta);
  transform: translateY(-2px);
}

.art {
  height: 118px;
  position: relative;
}

.region-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--gb-magenta-strong);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 9px;
  border-radius: var(--gb-radius-pill);
}

.body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 17px;
  text-transform: uppercase;
  color: var(--gb-dark);
  margin: 0;
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fact {
  font-size: 11px;
  font-weight: 700;
  color: var(--gb-ink-faint);
  background: rgba(46, 10, 46, 0.05);
  padding: 4px 9px;
  border-radius: var(--gb-radius-pill);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.footer-meta {
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.cta {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  border-radius: var(--gb-radius-pill);
  padding: 7px 14px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.cta:hover {
  background: var(--gb-magenta);
}
</style>
