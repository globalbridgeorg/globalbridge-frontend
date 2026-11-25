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
      type="button"
      class="side-item"
      :class="{ active: section === item.key }"
      :aria-current="section === item.key ? 'true' : undefined"
      @click="emit('select', item.key)"
    >
      <div class="side-thumb" aria-hidden="true">
        <i v-if="item.icon" class="fi" :class="item.icon"></i>
        <img v-else-if="item.image" :src="item.image" alt="" />
      </div>
      <div class="side-text">
        <span class="side-label">{{ item.label }}</span>
        <span class="side-meta">{{ meta[item.key] }}</span>
      </div>
    </button>

    <button type="button" class="side-logout" @click="emit('logout')">
      <i class="fi fi-rr-sign-out-alt" aria-hidden="true"></i>
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gb-dark);
  font-size: 17px;
}

.side-item.active .side-thumb {
  color: #fff;
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
