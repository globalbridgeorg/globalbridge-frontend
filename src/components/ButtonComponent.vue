<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import gsap from "gsap";

const props = defineProps({
  text: {
    type: String,
    default: "Botão",
  },
  iconType: {
    type: String,
    default: "primary",
  },
});

const icons = {
  primary: "/icons/icon_button.png",
  secondary: "/icons/icon_button2.png",
};

const btnRef = ref(null);
const contentRef = ref(null);
const iconCurrentRef = ref(null);
const iconNextRef = ref(null);

const DURATION = 0.45;
const EASE = "power4.out"; 
const SLIDE = 10; 

let hoverTween;

function playEnter() {
  hoverTween?.kill();
  hoverTween = gsap.timeline();
  
  hoverTween
    // Move o texto ligeiramente para a direita
    .to(contentRef.value, { x: SLIDE, duration: DURATION, ease: EASE }, 0)
    // O ícone atual voa para a direita (40px o joga para fora do texto) e some
    .to(iconCurrentRef.value, { x: 40, opacity: 0, duration: DURATION, ease: EASE }, 0)
    // O novo ícone vem da esquerda (estava escondido na opacidade) para o centro
    .to(iconNextRef.value, { x: 0, opacity: 1, duration: DURATION, ease: EASE }, 0);
}

function playLeave() {
  hoverTween?.kill();
  hoverTween = gsap.timeline();
  
  hoverTween
    // Retorna o texto para o lugar original
    .to(contentRef.value, { x: 0, duration: DURATION, ease: EASE }, 0)
    // Traz o ícone principal de volta
    .to(iconCurrentRef.value, { x: 0, opacity: 1, duration: DURATION, ease: EASE }, 0)
    // Joga o ícone substituto de volta para a esquerda, sumindo
    .to(iconNextRef.value, { x: -40, opacity: 0, duration: DURATION, ease: EASE }, 0);
}

onMounted(() => {
  // Garantimos as posições e transparências iniciais usando GSAP para evitar bugs visuais
  gsap.set(iconCurrentRef.value, { x: 0, opacity: 1 });
  gsap.set(iconNextRef.value, { x: -40, opacity: 0 });

  if (window.matchMedia("(hover: hover)").matches) {
    btnRef.value.addEventListener("mouseenter", playEnter);
    btnRef.value.addEventListener("mouseleave", playLeave);
  }
});

onBeforeUnmount(() => {
  btnRef.value?.removeEventListener("mouseenter", playEnter);
  btnRef.value?.removeEventListener("mouseleave", playLeave);
  hoverTween?.kill();
});
</script>

<template>
  <button ref="btnRef" class="custom-btn">
    <span ref="contentRef" class="btn-content">
      <span class="btn-text">
        {{ text }}
      </span>
      <!-- Mudamos o nome para icon-container, pois não é mais uma máscara -->
      <span class="icon-container">
        <img
          ref="iconCurrentRef"
          :src="icons[iconType]"
          class="btn-icon"
          alt=""
        />
        <img
          ref="iconNextRef"
          :src="icons[iconType]"
          class="btn-icon"
          alt=""
        />
      </span>
    </span>
  </button>
</template>

<style scoped>
.custom-btn {
  --icon-size: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: #A33DA3;
  color: #fff;
  font-family: Montserrat, sans-serif;
  font-weight: 600;
  cursor: pointer;
  /* O overflow: hidden fica APENAS AQUI. O ícone vai sumir apenas se cruzar a borda do botão */
  overflow: hidden; 
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-text {
  white-space: nowrap;
}

.icon-container {
  position: relative;
  width: var(--icon-size);
  height: var(--icon-size);
  flex-shrink: 0;
  /* REMOVIDO: overflow: hidden; -> É isso que libertou o ícone da caixinha! */
}

.btn-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--icon-size);
  height: var(--icon-size);
  display: block;
}

@media (hover: none) {
  .custom-btn:active {
    transform: scale(.97);
  }
}
</style>