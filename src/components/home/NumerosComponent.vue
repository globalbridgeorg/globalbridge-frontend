<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from '@/services/axios'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const carregando = ref(true)
const dados = ref(null)
const numRefs = ref([])
let ctx

const CAMPOS = [
  { key: 'total_paises', label: 'Países no catálogo' },
  { key: 'total_agencias', label: 'Agências parceiras' },
  { key: 'total_intercambistas', label: 'Intercambistas atendidos' },
  { key: 'nota_media', label: 'Nota média das agências', sufixo: '' }
]

async function carregarEstatisticas() {
  try {
    const { data } = await axios.get('/estatisticas/')
    dados.value = data
  } catch (e) {
    console.error('Erro ao buscar estatísticas:', e)
  } finally {
    carregando.value = false
  }
}

function animarNumeros() {
  ctx = gsap.context(() => {
    numRefs.value.forEach((el, i) => {
      if (!el || !dados.value) return
      const campo = CAMPOS[i]
      const valorFinal = dados.value[campo.key]
      if (valorFinal === null || valorFinal === undefined) return

      const contador = { valor: 0 }
      gsap.to(contador, {
        valor: valorFinal,
        duration: 1.3,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate: () => {
          el.textContent = campo.key === 'nota_media'
            ? contador.valor.toFixed(1)
            : Math.round(contador.valor).toLocaleString('pt-BR')
        }
      })
    })
  })
}

onMounted(async () => {
  await carregarEstatisticas()
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  animarNumeros()
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="numeros">
    <SectionEyebrow label="A plataforma em números" />
    <h2 class="sr-only">A plataforma em números</h2>

    <div v-if="carregando" class="numeros-skeleton" aria-hidden="true">
      <div v-for="n in 4" :key="n" class="skeleton-item"></div>
    </div>

    <div v-else-if="dados" class="numeros-grid">
      <div v-for="(campo, i) in CAMPOS" :key="campo.key" class="numero-item">
        <span class="numero-valor" :ref="el => (numRefs[i] = el)">0</span>
        <span class="numero-label">{{ campo.label }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.numeros {
  width: 100%;
  padding: var(--gb-space-y) 0;
}

.numeros-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 24px;
}

.numero-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px 0;
  border-top: 1px solid var(--gb-purple-deep-18);
}

.numero-valor {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: clamp(2.2rem, 1.6rem + 2.4vw, 3.4rem);
  color: var(--gb-dark);
  line-height: 1;
}

.numero-label {
  font-size: 0.85rem;
  color: var(--gb-ink-soft);
}

.numeros-skeleton {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 24px;
}

.skeleton-item {
  height: 96px;
  border-radius: var(--gb-radius-card);
  background: linear-gradient(90deg, rgba(46, 10, 46, 0.06) 25%, rgba(46, 10, 46, 0.1) 37%, rgba(46, 10, 46, 0.06) 63%);
  background-size: 400% 100%;
  animation: gb-skeleton-shimmer 1.6s ease-in-out infinite;
}

@keyframes gb-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-item { animation: none; }
}

@media (min-width: 768px) {
  .numeros-grid, .numeros-skeleton {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
