<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  message: { type: String, default: 'Notificação' },
  closable: { type: Boolean, default: true }
})

const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="notification-banner-component">
    <div class="indicator"></div>
    <div class="message">{{ message }}</div>
    <button v-if="closable" class="close-btn" @click="handleClose">✕</button>
  </div>
</template>

<style scoped>
.notification-banner-component {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 8px 12px;
  background: #f7f4ee;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  font-size: 14px;
  color: #333;
  margin: 16px 0;
}
.notification-banner-component .indicator {
  width: 6px;
  height: 100%;
  background: #e34b57;
  border-radius: 4px;
  flex-shrink: 0;
}
.notification-banner-component .message {
  flex: 1;
}
.notification-banner-component .close-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  color: #9b9b9b;
  cursor: pointer;
  padding: 6px;
}
.notification-banner-component .close-btn:hover { color: #666 }
</style>