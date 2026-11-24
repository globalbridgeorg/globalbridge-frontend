<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  dark: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="eyebrow" :class="{ dark }">
    <span class="eyebrow-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.eyebrow {
  display: flex;
  align-items: baseline;
  width: 100%;
  padding-top: 16px;
  border-top: 1px solid var(--gb-purple-deep-18);
}

.eyebrow-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-mauve);
}

.eyebrow.dark {
  border-top-color: rgba(255, 255, 255, 0.18);
}

.eyebrow.dark .eyebrow-label {
  color: rgba(255, 255, 255, 0.6);
}
</style>
