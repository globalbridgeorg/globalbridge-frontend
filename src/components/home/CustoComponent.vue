<script setup>
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { palette } from '@/utils/palette'

gsap.registerPlugin(ScrollTrigger)

const planos = [
  {
    pais: 'Irlanda',
    tag: 'Mais procurado',
    tagColor: palette.magentaOnPink,
    destaque: true,
    itens: [
      { label: 'Curso · 6 meses', valor: 14500 },
      { label: 'Passagem', valor: 5200 },
      { label: 'Seguro saúde', valor: 1400 },
      { label: 'Moradia · mês', valor: 3900 },
      { label: 'Alimentação · mês', valor: 1200 },
      { label: 'Transporte · mês', valor: 480 }
    ],
    total: 54600
  },
  {
    pais: 'Canadá',
    tag: 'Pode trabalhar',
    tagColor: palette.mauve,
    destaque: false,
    itens: [
      { label: 'Curso · 6 meses', valor: 16800 },
      { label: 'Passagem', valor: 5900 },
      { label: 'Seguro saúde', valor: 1600 },
      { label: 'Moradia · mês', valor: 4300 },
      { label: 'Alimentação · mês', valor: 1300 },
      { label: 'Transporte · mês', valor: 520 }
    ],
    total: 61000
  },
  {
    pais: 'Portugal',
    tag: 'Mais barato',
    tagColor: palette.green,
    destaque: false,
    itens: [
      { label: 'Curso · 6 meses', valor: 9800 },
      { label: 'Passagem', valor: 4400 },
      { label: 'Seguro saúde', valor: 1100 },
      { label: 'Moradia · mês', valor: 2700 },
      { label: 'Alimentação · mês', valor: 900 },
      { label: 'Transporte · mês', valor: 260 }
    ],
    total: 38500
  }
]

const formatoBRL = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const cardsRef = ref([])
const totalRefs = ref([])
let ctx

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from(cardsRef.value, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: cardsRef.value[0], start: 'top 80%' }
    })

    totalRefs.value.forEach((el, i) => {
      if (!el) return
      const contador = { valor: 0 }
      gsap.to(contador, {
        valor: planos[i].total,
        duration: 1.3,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: () => {
          el.textContent = formatoBRL(Math.round(contador.valor))
        }
      })
    })
  })
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="custo">
    <SectionEyebrow number="08" label="Quanto custa" />

    <div class="heading-row">
      <h2 class="gb-heading">O custo real<br />de seis meses</h2>
      <p class="heading-desc">
        Simulação de um curso de idioma de seis meses, com moradia compartilhada
        e alimentação fora de casa. Valores médios de referência — a agência
        confirma o número final.
      </p>
    </div>

    <div class="cards-row">
      <div
        v-for="(plano, i) in planos"
        :key="plano.pais"
        class="card"
        :class="{ destaque: plano.destaque }"
        :style="{ '--tag-color': plano.tagColor }"
        :ref="el => (cardsRef[i] = el)"
      >
        <span class="tag">{{ plano.tag }}</span>
        <h3 class="pais">{{ plano.pais }}</h3>

        <ul class="itens">
          <li v-for="item in plano.itens" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ formatoBRL(item.valor) }}</strong>
          </li>
        </ul>

        <div class="total">
          <span>Total estimado</span>
          <strong :ref="el => (totalRefs[i] = el)">{{ formatoBRL(0) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.custo {
  width: 100%;
  padding: var(--gb-space-y) 0;
}

.heading-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0 32px;
}

.heading-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 420px;
  margin: 0;
}

.cards-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  flex: 1;
  border-radius: 10px;
  padding: 24px;
  background: var(--gb-cream);
  border: 1px solid var(--gb-purple-deep-16);
}

.card.destaque {
  background: var(--gb-pink);
  border-color: transparent;
}

.tag {
  display: block;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: var(--tag-color);
}

.pais {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 1.6rem;
  color: var(--gb-dark);
  margin: 0 0 20px;
}

.itens {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
}

.itens li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
  font-size: 0.85rem;
  color: #44404A;
}

.itens li strong {
  color: var(--gb-dark);
  font-weight: 700;
}

.total {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.total span {
  font-family: var(--gb-font-eyebrow);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
}

.total strong {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 1.6rem;
  color: var(--gb-dark);
}

@media (min-width: 768px) {
  .heading-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }

  .cards-row {
    flex-direction: row;
  }
}

</style>
