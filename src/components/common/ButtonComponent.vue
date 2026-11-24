<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
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
  // "span" quando o botão é só o visual de um link (<a>/<router-link>) — evita botão dentro de link
  tag: {
    type: String,
    default: "button",
  },
});

// Tamanho do ícone e espaço até o texto — iguais a --icon-size / --gap no CSS
const ICON_SIZE = 20;
const GAP = 10;
const DURATION = 0.45;
const EASE = "power4.out";

const icons = {
  primary: "/icons/icon_button.png",
  secondary: "/icons/icon_button2.png",
  tertiary: "/icons/icon_button3.png",
};

const stageRef = ref(null);
const textRef = ref(null);
const iconRightRef = ref(null); // ícone visível no estado normal
const iconLeftRef = ref(null);  // ícone que entra no hover

let tl = null;
let resizeObserver = null;
let isHovered = false;

const metrics = {
  textIdleX: 0,
  textHoverX: 0,
  rightIconX: 0,
  leftIconX: 0,
  offRightX: 0,
  offLeftX: 0,
};

function updateMetrics() {
  if (!textRef.value || !iconRightRef.value) return;

  const textWidth = textRef.value.offsetWidth;
  const iconWidth = iconRightRef.value.offsetWidth || ICON_SIZE;

  // quanto o texto precisa andar para abrir espaço para o ícone à esquerda
  const slot = iconWidth + GAP;

  // quanto o ícone vai “viajar” para fora
  const travel = Math.max(slot + 8, iconWidth * 1.4);

  metrics.textIdleX = 0;
  metrics.textHoverX = slot;

  // ícone da esquerda sempre para na posição 0
  metrics.leftIconX = 0;

  // ícone da direita fica depois do texto
  metrics.rightIconX = textWidth + GAP;

  // posições fora da área visível
  metrics.offLeftX = -travel;
  metrics.offRightX = metrics.rightIconX + travel;
}

// Alvos de cada elemento no estado normal (hovered=false) ou com hover
function targets(hovered) {
  return hovered
    ? [
        [textRef.value, { x: metrics.textHoverX }],
        [iconRightRef.value, { x: metrics.offRightX, opacity: 0 }],
        [iconLeftRef.value, { x: metrics.leftIconX, opacity: 1 }],
      ]
    : [
        [textRef.value, { x: metrics.textIdleX }],
        [iconRightRef.value, { x: metrics.rightIconX, opacity: 1 }],
        [iconLeftRef.value, { x: metrics.offLeftX, opacity: 0 }],
      ];
}

function applyStaticState() {
  if (!textRef.value || !iconRightRef.value || !iconLeftRef.value) return;

  tl?.kill();
  targets(isHovered).forEach(([el, vars]) => gsap.set(el, vars));
}

function play(hovered) {
  if (isHovered === hovered) return;
  if (!window.matchMedia("(hover: hover)").matches) return;

  isHovered = hovered;
  updateMetrics();
  tl?.kill();

  tl = gsap.timeline({ defaults: { duration: DURATION, ease: EASE } });
  targets(hovered).forEach(([el, vars]) => tl.to(el, vars, 0));
}

function syncIfIdle() {
  updateMetrics();
  if (!tl || !tl.isActive()) applyStaticState();
}

async function syncLayout() {
  await nextTick();
  syncIfIdle();
}

onMounted(async () => {
  await syncLayout();

  resizeObserver = new ResizeObserver(syncIfIdle);

  if (stageRef.value) resizeObserver.observe(stageRef.value);
  if (textRef.value) resizeObserver.observe(textRef.value);

  document.fonts?.ready?.then(syncIfIdle);
});

watch(() => props.text, syncLayout);

onBeforeUnmount(() => {
  tl?.kill();
  resizeObserver?.disconnect();
});
</script>

<template>
  <component
    :is="tag"
    class="swap-btn"
    @mouseenter="play(true)"
    @mouseleave="play(false)"
  >
    <span ref="stageRef" class="btn-stage">
      <span ref="textRef" class="btn-text">{{ text }}</span>

      <img
        ref="iconRightRef"
        :src="icons[iconType]"
        class="btn-icon"
        alt=""
        aria-hidden="true"
      />

      <img
        ref="iconLeftRef"
        :src="icons[iconType]"
        class="btn-icon"
        alt=""
        aria-hidden="true"
      />
    </span>
  </component>
</template>

<style scoped>
.swap-btn {
  --icon-size: 20px;
  --gap: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: #a33da3;
  color: #fff;
  font-family: Montserrat, sans-serif;
  font-size: 16px;
  line-height: 1.2;
  cursor: pointer;
  overflow: hidden;
  appearance: none;
}

.btn-stage {
  position: relative;
  display: inline-block;

  /* reserva espaço do ícone da direita no estado normal */
  padding-right: calc(var(--icon-size) + var(--gap));
  min-height: var(--icon-size);
}

.btn-text {
  display: inline-block;
  white-space: nowrap;
  will-change: transform;
}

.btn-icon {
  position: absolute;
  top: 50%;
  left: 0;
  width: var(--icon-size);
  height: var(--icon-size);
  display: block;
  object-fit: contain;
  transform: translateY(-50%);
  will-change: transform, opacity;
  pointer-events: none;
}

@media (hover: none) {
  .swap-btn:active {
    transform: scale(0.97);
  }
}
</style>