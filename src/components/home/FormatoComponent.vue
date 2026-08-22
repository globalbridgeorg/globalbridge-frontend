<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const formatos = [
  { programa: 'Curso de idioma', duracao: '4 semanas a 12 meses', idioma: 'Nenhum', trabalho: 'Limitado ou não', paraQuem: 'Primeira viagem, fluência rápida' },
  { programa: 'Graduação', duracao: '3 a 5 anos', idioma: 'Avançado, com prova', trabalho: 'Meio período', paraQuem: 'Diploma reconhecido no exterior' },
  { programa: 'Pós e Mestrado', duracao: '1 a 2 anos', idioma: 'Avançado, com prova', trabalho: 'Meio período', paraQuem: 'Especialização e pesquisa' },
  { programa: 'Study & Work', duracao: '6 a 12 meses', idioma: 'Intermediário', trabalho: 'Sim, meio período', paraQuem: 'Estudar e cobrir parte dos custos' },
  { programa: 'Au Pair', duracao: '12 meses', idioma: 'Básico a intermediário', trabalho: 'Sim, com a família', paraQuem: 'Imersão com moradia inclusa' },
  { programa: 'High School', duracao: '6 a 12 meses', idioma: 'Básico', trabalho: 'Não', paraQuem: 'Menores de 18, ensino médio' },
  { programa: 'Voluntariado', duracao: '2 semanas a 6 meses', idioma: 'Básico', trabalho: 'Não remunerado', paraQuem: 'Projeto social e vivência curta' }
]

const rowsRef = ref(null)
let ctx

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from('.formato-row', {
      opacity: 0,
      y: 14,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.out',
      scrollTrigger: { trigger: rowsRef.value, start: 'top 82%' }
    })
  }, rowsRef.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section id="formatos" class="formato">
    <div class="heading-row">
      <h2 class="gb-heading">Qual formato<br />combina com você</h2>
      <p class="heading-desc">
        Intercâmbio não é uma coisa só. O formato muda a duração, o visto, o
        quanto você estuda e se pode trabalhar. Compare antes de escolher o
        destino.
      </p>
    </div>

    <div class="table" ref="rowsRef">
      <div class="table-head">
        <span>Programa</span>
        <span>Duração</span>
        <span>Idioma exigido</span>
        <span>Trabalho</span>
        <span>Para quem é</span>
      </div>

      <div v-for="formato in formatos" :key="formato.programa" class="formato-row">
        <span class="programa">{{ formato.programa }}</span>
        <span data-label="Duração">{{ formato.duracao }}</span>
        <span data-label="Idioma exigido">{{ formato.idioma }}</span>
        <span data-label="Trabalho">{{ formato.trabalho }}</span>
        <span data-label="Para quem é" class="para-quem">{{ formato.paraQuem }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.formato {
  width: 100%;
  padding: var(--gb-space-y-continuation) 0 var(--gb-space-y);
  scroll-margin-top: 96px;
}

.heading-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.heading-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 460px;
  margin: 0;
}

.table {
  display: flex;
  flex-direction: column;
}

.table-head {
  display: none;
}

.formato-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.formato-row:last-child {
  border-bottom: 1px solid var(--gb-purple-deep-16);
}

.programa {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--gb-dark);
}

.formato-row span[data-label]::before {
  content: attr(data-label) ": ";
  font-weight: 700;
  color: var(--gb-ink-faint);
}

.formato-row span {
  font-size: 0.9rem;
  color: #44404A;
}

@media (min-width: 900px) {
  .heading-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }

  .table-head,
  .formato-row {
    display: grid;
    grid-template-columns: 1.1fr 1.3fr 1.4fr 1.2fr 1.6fr;
    gap: 20px;
    align-items: center;
  }

  .table-head {
    padding-bottom: 16px;
    font-family: var(--gb-font-eyebrow);
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gb-ink-faint);
  }

  .formato-row span[data-label]::before {
    content: none;
  }
}

</style>
