<script setup>
import { sweeping } from '@/composables/usePageTransition'
</script>

<template>
  <div class="wipe" :class="{ sweeping }" aria-hidden="true"></div>
</template>

<style scoped>
.wipe {
  position: fixed;
  inset: -10% -30%;
  z-index: 2000;
  pointer-events: none;
  background: var(--gb-dark);
  transform: translateX(-130%) skewX(-10deg);
}

.wipe.sweeping {
  animation: wipeSweep 0.46s cubic-bezier(0.6, 0, 0.4, 1) forwards;
}

@keyframes wipeSweep {
  0% {
    transform: translateX(-130%) skewX(-10deg);
  }
  48%,
  55% {
    transform: translateX(0%) skewX(-10deg);
  }
  100% {
    transform: translateX(130%) skewX(-10deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wipe.sweeping {
    animation: none !important;
  }
}
</style>
