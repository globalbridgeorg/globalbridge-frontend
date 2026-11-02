<script setup>
defineProps({
  items: { type: Array, required: true },
  meta: { type: Object, required: true },
  section: { type: String, required: true }
})
const emit = defineEmits(['select', 'logout'])
</script>

<template>
  <div class="side-nav">
    <button
      v-for="item in items"
      :key="item.key"
      class="side-item"
      :class="{ active: section === item.key }"
      @click="emit('select', item.key)"
    >
      <div class="side-thumb">
        <img :src="item.image" alt="" />
      </div>
      <div class="side-text">
        <span class="side-label">{{ item.label }}</span>
        <span class="side-meta">{{ meta[item.key] }}</span>
      </div>
    </button>

    <button type="button" class="side-logout" @click="emit('logout')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
      Sair da conta
    </button>
  </div>
</template>

<style scoped>
.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 10px;
}

.side-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.15s ease;
}

.side-item:hover {
  background: rgba(46, 10, 46, 0.04);
}

.side-item.active {
  background: var(--gb-dark);
}

.side-logout {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 6px;
  padding: 11px 10px;
  border-radius: 8px;
  border: none;
  border-top: 1px solid var(--gb-purple-deep-16);
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.86rem;
  color: #dc2626;
  transition: background 0.15s ease;
}

.side-logout:hover {
  background: rgba(220, 38, 38, 0.06);
}

.side-thumb {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.side-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6px;
  display: block;
  filter: brightness(0);
  transition: filter 0.15s ease;
}

.side-item.active .side-thumb img {
  filter: brightness(0) invert(1);
}

.side-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.side-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.side-item.active .side-label {
  color: #fff;
}

.side-meta {
  font-size: 11px;
  color: var(--gb-ink-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-item.active .side-meta {
  color: rgba(255, 255, 255, 0.6);
}
</style>
