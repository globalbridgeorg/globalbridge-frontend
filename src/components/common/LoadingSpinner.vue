<script setup>
// Spinner genérico (círculo girando + texto embaixo) pra qualquer lugar do
// site que precise indicar "isso ainda está carregando" — não sabe nada
// sobre o que está carregando, só recebe o texto a mostrar.
defineProps({
  label: { type: String, default: 'Carregando...' }
})
</script>

<template>
  <div class="gb-loading">
    <div class="gb-loading-spinner" aria-hidden="true"></div>
    <p class="gb-loading-label">{{ label }}</p>
  </div>
</template>

<style scoped>
.gb-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.gb-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gb-purple-deep-16);
  border-top-color: var(--gb-magenta);
  border-radius: 50%;
  animation: gb-loading-spin 0.8s linear infinite;
}

.gb-loading-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
}

@keyframes gb-loading-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .gb-loading-spinner {
    animation-duration: 1.8s;
  }
}
</style>
