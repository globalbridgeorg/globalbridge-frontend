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
  iconSize: {
    type: Number,
    default: 20,
  },
  gap: {
    type: Number,
    default: 10,
  },
  duration: {
    type: Number,
    default: 0.45,
  },
  ease: {
    type: String,
    default: "power4.out",
  },
});

const icons = {
  primary: "/icons/icon_button.png",
  secondary: "/icons/icon_button2.png",
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
  const iconWidth = iconRightRef.value.offsetWidth || props.iconSize;

  // quanto o texto precisa andar para abrir espaço para o ícone à esquerda
  const slot = iconWidth + props.gap;

  // quanto o ícone vai “viajar” para fora
  const travel = Math.max(slot + 8, iconWidth * 1.4);

  metrics.textIdleX = 0;
  metrics.textHoverX = slot;

  // ícone da esquerda sempre para na posição 0
  metrics.leftIconX = 0;

  // ícone da direita fica depois do texto
  metrics.rightIconX = textWidth + props.gap;

  // posições fora da área visível
  metrics.offLeftX = -travel;
  metrics.offRightX = metrics.rightIconX + travel;
}

function applyStaticState() {
  if (!textRef.value || !iconRightRef.value || !iconLeftRef.value) return;

  tl?.kill();

  if (isHovered) {
    gsap.set(textRef.value, { x: metrics.textHoverX });
    gsap.set(iconRightRef.value, {
      x: metrics.offRightX,
      opacity: 0,
    });
    gsap.set(iconLeftRef.value, {
      x: metrics.leftIconX,
      opacity: 1,
    });
  } else {
    gsap.set(textRef.value, { x: metrics.textIdleX });
    gsap.set(iconRightRef.value, {
      x: metrics.rightIconX,
      opacity: 1,
    });
    gsap.set(iconLeftRef.value, {
      x: metrics.offLeftX,
      opacity: 0,
    });
  }
}

function playEnter() {
  if (isHovered) return;
  if (!window.matchMedia("(hover: hover)").matches) return;

  isHovered = true;
  updateMetrics();
  tl?.kill();

  tl = gsap.timeline({
    defaults: {
      duration: props.duration,
      ease: props.ease,
    },
  });

  tl.to(
    textRef.value,
    {
      x: metrics.textHoverX,
    },
    0
  )
    .to(
      iconRightRef.value,
      {
        x: metrics.offRightX,
        opacity: 0,
      },
      0
    )
    .to(
      iconLeftRef.value,
      {
        x: metrics.leftIconX,
        opacity: 1,
      },
      0
    );
}

function playLeave() {
  if (!isHovered) return;
  if (!window.matchMedia("(hover: hover)").matches) return;

  isHovered = false;
  updateMetrics();
  tl?.kill();

  tl = gsap.timeline({
    defaults: {
      duration: props.duration,
      ease: props.ease,
    },
  });

  tl.to(
    textRef.value,
    {
      x: metrics.textIdleX,
    },
    0
  )
    .to(
      iconRightRef.value,
      {
        x: metrics.rightIconX,
        opacity: 1,
      },
      0
    )
    .to(
      iconLeftRef.value,
      {
        x: metrics.offLeftX,
        opacity: 0,
      },
      0
    );
}

async function syncLayout() {
  await nextTick();
  updateMetrics();

  if (!tl || !tl.isActive()) {
    applyStaticState();
  }
}

onMounted(async () => {
  await syncLayout();

  resizeObserver = new ResizeObserver(() => {
    updateMetrics();

    if (!tl || !tl.isActive()) {
      applyStaticState();
    }
  });

  if (stageRef.value) resizeObserver.observe(stageRef.value);
  if (textRef.value) resizeObserver.observe(textRef.value);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      updateMetrics();
      if (!tl || !tl.isActive()) {
        applyStaticState();
      }
    });
  }
});

watch(
  () => [props.text, props.iconSize, props.gap],
  async () => {
    await syncLayout();
  }
);

onBeforeUnmount(() => {
  tl?.kill();
  resizeObserver?.disconnect();
});
</script>

<template>
  <button
    class="swap-btn"
    :style="{
      '--icon-size': `${iconSize}px`,
      '--gap': `${gap}px`,
    }"
    @mouseenter="playEnter"
    @mouseleave="playLeave"
  >
    <span ref="stageRef" class="btn-stage">
      <span ref="textRef" class="btn-text">
        <slot>{{ text }}</slot>
      </span>

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
  </button>
</template>

<style scoped>
.swap-btn {
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