<script setup>
// O desenho de cada skyline se repete 4x lado a lado pro loop de rolagem não ter emenda.
const deslocamentos = [0, 720, 1440, 2160]
</script>

<template>
  <div class="scene">
    <svg class="stars" width="100%" height="100%" preserveAspectRatio="none">
      <circle cx="8%" cy="10%" r="1.4" fill="#fff" /><circle cx="22%" cy="15%" r="1" fill="#fff" />
      <circle cx="38%" cy="8%" r="1.6" fill="#fff" /><circle cx="52%" cy="13%" r="1" fill="#fff" />
      <circle cx="66%" cy="7%" r="1.4" fill="#fff" /><circle cx="80%" cy="11%" r="1" fill="#fff" />
      <circle cx="92%" cy="16%" r="1.6" fill="#fff" /><circle cx="15%" cy="22%" r="1" fill="#fff" />
      <circle cx="44%" cy="21%" r="1" fill="#fff" /><circle cx="74%" cy="23%" r="1.2" fill="#fff" />
    </svg>

    <svg class="skyline skyline-back" viewBox="0 0 2880 300" preserveAspectRatio="none">
      <g v-for="x in deslocamentos" :key="x" fill="#3d1247" :transform="`translate(${x},0)`">
        <rect x="0" y="140" width="60" height="160" /><rect x="70" y="100" width="40" height="200" />
        <rect x="120" y="160" width="80" height="140" /><rect x="210" y="70" width="30" height="230" />
        <rect x="250" y="130" width="60" height="170" /><polygon points="330,130 360,60 390,130" />
        <rect x="330" y="130" width="60" height="170" /><rect x="400" y="110" width="50" height="190" />
        <rect x="460" y="170" width="70" height="130" /><rect x="540" y="90" width="35" height="210" />
        <rect x="590" y="150" width="55" height="150" />
      </g>
    </svg>

    <svg class="skyline skyline-front" viewBox="0 0 2880 340" preserveAspectRatio="none">
      <g v-for="x in deslocamentos" :key="x" fill="#17081d" :transform="`translate(${x},0)`">
        <rect x="20" y="120" width="70" height="220" /><rect x="100" y="180" width="45" height="160" />
        <rect x="155" y="90" width="35" height="250" /><circle cx="172" cy="80" r="18" fill="none" stroke="#17081d" stroke-width="6" />
        <rect x="220" y="150" width="90" height="190" /><rect x="330" y="60" width="26" height="280" />
        <rect x="370" y="170" width="60" height="170" /><rect x="450" y="110" width="50" height="230" />
        <polygon points="530,140 560,40 590,140" /><rect x="530" y="140" width="60" height="200" />
        <rect x="610" y="190" width="80" height="150" />
      </g>
    </svg>

    <div class="plane-strip">
      <svg class="plane" width="22" height="12" viewBox="0 0 22 12" style="animation-delay:1s; top:8%;">
        <path d="M1 6 L18 6 M14 2 L21 6 L14 10 M6 6 L3 2 M6 6 L3 10" stroke="rgba(251,246,231,0.7)" stroke-width="1.3" fill="none" stroke-linecap="round" />
      </svg>
      <svg class="plane plane-slow" width="18" height="10" viewBox="0 0 22 12" style="animation-delay:9s; top:16%;">
        <path d="M1 6 L18 6 M14 2 L21 6 L14 10 M6 6 L3 2 M6 6 L3 10" stroke="rgba(251,246,231,0.5)" stroke-width="1.3" fill="none" stroke-linecap="round" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.scene { position: absolute; inset: 0; z-index: 0; }

.stars { position: absolute; inset: 0; opacity: 0.5; }

/* Altura em aspect-ratio (não em % da tela) — cada <svg> usa
   preserveAspectRatio="none" pra esticar o desenho até preencher a
   largura de 300%, então a altura do elemento PRECISA acompanhar essa
   mesma proporção do viewBox (2880x300 / 2880x340). Antes a altura era
   um % fixo da tela: numa tela estreita e alta (celular), a largura
   encolhia bem mais que a altura, esticando o desenho e deixando os
   prédios finos e alongados. Com aspect-ratio a altura sempre acompanha
   a largura real na proporção certa, em qualquer tamanho de tela. */
.skyline { position: absolute; left: 0; bottom: 0; width: 300%; animation: scroll linear infinite; }
/* Altura ~30% maior que o desenho original (300/340 -> 390/442), de
   propósito — deixa mais prédio visível sem mexer na largura (que
   precisa continuar em sincronia com o -33.3333% do @keyframes scroll
   logo abaixo, senão o loop de repetição desalinha). */
.skyline-back { aspect-ratio: 2880 / 390; opacity: 0.5; animation-duration: 80s; }
.skyline-front { aspect-ratio: 2880 / 442; animation-duration: 42s; animation-direction: reverse; }

@keyframes scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-33.3333%); }
}

.plane-strip { position: absolute; top: 0; left: 0; width: 100%; height: 40%; }
.plane { position: absolute; animation: crossSky 18s linear infinite; opacity: 0.8; }
.plane-slow { animation-duration: 24s; }

@keyframes crossSky {
  from { transform: translateX(-60px); }
  to { transform: translateX(110vw); }
}

@media (prefers-reduced-motion: reduce) {
  .skyline, .plane { animation: none; }
}
</style>
