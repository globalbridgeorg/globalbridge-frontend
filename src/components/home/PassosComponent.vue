<script setup>
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const passos = [
  {
    numero: '01',
    titulo: 'Escolha o destino',
    texto: 'Abra o mapa e compare países por custo de vida, cultura, nível de idioma exigido e regras de trabalho.',
    pills: ['custo de vida', 'idioma', 'visto']
  },
  {
    numero: '02',
    titulo: 'Compare programas',
    texto: 'Universidade, curso de idioma, Study & Work ou Au Pair, com duração e requisitos lado a lado.',
    legenda: [
      { label: 'Universidade · 12 meses', cor: '#7A0F74' },
      { label: 'Idioma · 6 meses', cor: '#B01FB0' },
      { label: 'Study & Work · 9 meses', cor: '#FBC2F4' }
    ]
  },
  {
    numero: '03',
    titulo: 'Fale com a agência',
    texto: 'Só agências verificadas, com avaliação de quem já foi. Você fala direto, sem intermediário.',
    nota: 'média de 4,2 em 1.088 agências',
    estrelas: 4
  }
]

const colsRef = ref([])
let ctx

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from(colsRef.value, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.14,
      ease: 'power3.out',
      scrollTrigger: { trigger: colsRef.value[0], start: 'top 82%' }
    })
  })
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section id="passos" class="passos">
    <SectionEyebrow number="09" label="Preparação" />

    <h2 class="gb-heading">Três passos até<br />o embarque</h2>

    <div class="cols">
      <div
        v-for="(passo, i) in passos"
        :key="passo.numero"
        class="col"
        :ref="el => (colsRef[i] = el)"
      >
        <span class="numero">{{ passo.numero }}</span>
        <h3 class="titulo">{{ passo.titulo }}</h3>
        <p class="texto">{{ passo.texto }}</p>

        <div v-if="passo.pills" class="pills">
          <span v-for="pill in passo.pills" :key="pill">{{ pill }}</span>
        </div>

        <div v-if="passo.legenda" class="legenda">
          <div v-for="item in passo.legenda" :key="item.label" class="legenda-item">
            <span class="legenda-linha" :style="{ background: item.cor }"></span>
            <span>{{ item.label }}</span>
          </div>
        </div>

        <div v-if="passo.nota" class="avaliacao">
          <span class="estrelas">
            <template v-for="n in 5" :key="n">{{ n <= passo.estrelas ? '★' : '☆' }}</template>
          </span>
          <span class="nota-texto">{{ passo.nota }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.passos {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 5%;
  box-sizing: border-box;
  scroll-margin-top: 96px;
}

.gb-heading {
  margin: 24px 0 40px;
}

.cols {
  display: flex;
  flex-direction: column;
}

.col {
  padding: 28px 0;
  border-top: 3px solid var(--gb-purple-deep-16);
}

.numero {
  display: block;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 2.2rem;
  color: var(--gb-magenta);
  opacity: 0.5;
  margin-bottom: 12px;
}

.titulo {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 1.1rem;
  color: var(--gb-dark);
  margin: 0 0 12px;
}

.texto {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #55505A;
  margin: 0 0 16px;
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pills span {
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.78rem;
  color: var(--gb-dark);
}

.legenda {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legenda-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  color: #55505A;
}

.legenda-linha {
  width: 24px;
  height: 4px;
  border-radius: 4px;
  flex-shrink: 0;
}

.avaliacao {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.estrelas {
  color: var(--gb-magenta);
  font-size: 1.1rem;
  letter-spacing: 2px;
}

.nota-texto {
  font-size: 0.82rem;
  color: #55505A;
}

@media (min-width: 900px) {
  .cols {
    flex-direction: row;
    gap: 0;
  }

  .col {
    flex: 1;
    padding: 32px 32px 0 0;
    border-top: 3px solid var(--gb-purple-deep-16);
  }

  .col + .col {
    padding-left: 32px;
  }
}

@media (max-width: 1600px) {
  .passos {
    max-width: 1225px;
  }
}
</style>
