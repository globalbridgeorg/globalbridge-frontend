<script setup>
import { computed } from 'vue'

const props = defineProps({
  nome: { type: String, required: true },
  descricao: { type: String, required: true },
  cidade: { type: String, default: '' },
  notaMedia: { type: Number, default: null },
  to: { type: [String, Object], default: null }
})

const estrelas = computed(() => {
  const nota = Math.round(props.notaMedia ?? 0)
  return Array.from({ length: 5 }, (_, i) => i < nota)
})
</script>

<template>
  <article class="agencia-card">
    <div class="agencia-header">
      <span class="agencia-nome">{{ nome }}</span>
      <span
        v-if="notaMedia !== null"
        class="agencia-stars"
        role="img"
        :aria-label="`${Math.round(notaMedia)} de 5 estrelas`"
      >
        <span v-for="(preenchida, i) in estrelas" :key="i" class="star" :class="{ filled: preenchida }" aria-hidden="true">★</span>
      </span>
    </div>
    <p class="agencia-desc">{{ descricao }}</p>
    <div class="agencia-footer">
      <span v-if="cidade" class="agencia-location">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="#757067" stroke-width="1.3"/><circle cx="8" cy="6" r="1.6" stroke="#757067" stroke-width="1.3"/></svg>
        {{ cidade }}
      </span>
      <component :is="to ? 'router-link' : 'span'" :to="to" class="agencia-btn">Acessar</component>
    </div>
  </article>
</template>

<style scoped>
.agencia-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.agencia-card:hover {
  box-shadow: var(--gb-shadow-card);
  border-color: var(--gb-magenta);
  transform: translateY(-2px);
}

.agencia-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.agencia-nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 15px;
  color: var(--gb-dark);
  text-transform: uppercase;
}

.agencia-stars {
  white-space: nowrap;
}

.star {
  font-size: 13px;
  color: var(--gb-purple-deep-16);
}

.star.filled {
  color: var(--gb-magenta);
}

.agencia-desc {
  font-size: 12.5px;
  color: var(--gb-ink-soft);
  line-height: 1.6;
  margin: 0;
}

.agencia-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.agencia-location {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.agencia-btn {
  background: var(--gb-dark);
  color: #fff;
  border-radius: var(--gb-radius-pill);
  padding: 7px 15px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.agencia-btn:hover {
  background: var(--gb-magenta);
}
</style>
