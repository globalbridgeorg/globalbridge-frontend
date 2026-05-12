<script setup>
const props = defineProps({
  text: {
    type: String,
    default: 'Botão'
  },
  iconType: {
    type: String,
    default: 'primary'
  }
})

const icons = {
  primary: "/icons/icon_button.png",
  secondary: "/icons/icon_button2.png", 
}
</script>

<template>
  <button class="custom-btn">
    <span class="btn-text">{{ text }}</span>
    
    <div class="icon-wrapper">
      <img :src="icons[iconType]" class="btn-icon icon-original" alt="">
      <img :src="icons[iconType]" class="btn-icon icon-copy" alt="">
    </div>
  </button>
</template>

<style scoped>
.custom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px; 
  padding: 12px 20px;
  background-color: #A33DA3;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
  position: relative;
  transition: background 0.3s ease;
}

.btn-text {
  transition: transform 0.4s cubic-bezier(0.6, 0.01, 0, 1);
  display: inline-block;
}

.icon-wrapper {
  position: relative;
  width: 20px; 
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  position: absolute;
  width: 100%;
  height: auto;
  transition: transform 0.4s cubic-bezier(0.6, 0.01, 0, 1), opacity 0.2s;
}

.icon-original {
  transform: translateX(0);
  opacity: 1;
}

.icon-copy {
  transform: translateX(-100px); 
  opacity: 0;
}

@media (hover: hover) and (min-width: 769px) {
  .custom-btn:hover .btn-text {
    transform: translateX(30px); 
  }
  .custom-btn:hover .icon-original {
    transform: translateX(40px);
    opacity: 0;
  }
  .custom-btn:hover .icon-copy {
    transform: translateX(30);
    opacity: 1;
  }
}

@media (hover: none) or (max-width: 768px) {
  .custom-btn:active {
    transform: scale(0.97);
    transition: transform 0.05s;
  }
}
</style>