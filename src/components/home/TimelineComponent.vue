<script setup>
import ButtonComponent from '@/components/common/ButtonComponent.vue'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const etapas = [
  { tempo: '12 meses', titulo: 'Destino e formato', texto: 'Escolha o país e o tipo de programa, e comece a juntar a reserva inicial.' },
  { tempo: '9 meses', titulo: 'Teste de idioma', texto: 'Se o programa exige comprovação, agende IELTS, TOEFL, Goethe ou DELE com folga.' },
  { tempo: '6 meses', titulo: 'Agência e matrícula', texto: 'Feche com a agência verificada e receba a carta de aceite da instituição.' },
  { tempo: '4 meses', titulo: 'Pedido de visto', texto: 'Entre com o processo: comprovação de renda, seguro saúde e carta de aceite em mãos.' },
  { tempo: '2 meses', titulo: 'Passagem e moradia', texto: 'Compre o voo e garanta os primeiros meses de acomodação antes de chegar.' },
  { tempo: '1 mês', titulo: 'Últimos detalhes', texto: 'Documentos traduzidos, cartão internacional, chip local e bagagem dentro do limite.' }
]

const documentos = [
  'Passaporte válido por 6 meses após a volta',
  'Carta de aceite da instituição',
  'Comprovante financeiro dos meses de estadia',
  'Seguro saúde internacional',
  'Certificado de idioma, se o programa exigir',
  'Histórico escolar traduzido',
  'Passagem de ida e volta',
  'Comprovante de moradia'
]

const etapasWrapRef = ref(null)
const checklistRef = ref(null)
const copiado = ref(false)
let ctx
let copiadoTimeout

const copiarChecklist = async () => {
  const lista = documentos.map(doc => `- ${doc}`).join('\n')

  try {
    await navigator.clipboard.writeText(lista)
    copiado.value = true
    clearTimeout(copiadoTimeout)
    copiadoTimeout = setTimeout(() => (copiado.value = false), 2000)
  } catch (error) {
    console.error('Não foi possível copiar o checklist:', error)
  }
}

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from('.etapa', {
      opacity: 0,
      x: -20,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: etapasWrapRef.value, start: 'top 80%' }
    })

    gsap.from('.doc-item', {
      opacity: 0,
      x: 14,
      duration: 0.4,
      stagger: 0.06,
      ease: 'power2.out',
      scrollTrigger: { trigger: checklistRef.value, start: 'top 80%' }
    })
  })
})

onBeforeUnmount(() => {
  ctx?.revert()
  clearTimeout(copiadoTimeout)
})
</script>

<template>
  <section class="timeline">
    <SectionEyebrow label="Cronograma" />

    <div class="heading-row">
      <h2 class="gb-heading">Um ano até<br />o embarque</h2>
      <p class="heading-desc">
        A parte burocrática é o que mais atrasa uma viagem. Esta é a ordem que
        funciona, contando de trás para frente a partir do dia do voo.
      </p>
    </div>

    <div class="content">
      <div class="etapas" ref="etapasWrapRef">
        <div v-for="etapa in etapas" :key="etapa.titulo" class="etapa">
          <span class="tempo">{{ etapa.tempo }}</span>
          <div class="etapa-corpo">
            <h3>{{ etapa.titulo }}</h3>
            <p>{{ etapa.texto }}</p>
          </div>
        </div>
      </div>

      <div class="checklist" ref="checklistRef">
        <span class="checklist-label">Documentos</span>
        <ul>
          <li v-for="doc in documentos" :key="doc" class="doc-item">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8.5L6.2 11.5L13 4.5" stroke="var(--gb-accent-light)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ doc }}</span>
          </li>
        </ul>
        <ButtonComponent
          :text="copiado ? 'Lista copiada!' : 'Copiar checklist'"
          iconType="primary"
          @click="copiarChecklist"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.timeline {
  width: 100%;
  padding: var(--gb-space-y) 0;
}

.heading-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.heading-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 420px;
  margin: 0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.etapas {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.etapa {
  display: flex;
  gap: 20px;
  padding: 18px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.etapa:last-child {
  border-bottom: 1px solid var(--gb-purple-deep-16);
}

.tempo {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-magenta);
  width: 70px;
  flex-shrink: 0;
  padding-top: 3px;
}

.etapa-corpo h3 {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 1rem;
  color: var(--gb-dark);
  margin: 0 0 4px;
}

.etapa-corpo p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--gb-ink-soft);
  margin: 0;
}

.checklist {
  background: var(--gb-purple-deep);
  border-radius: 12px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.checklist-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.checklist ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.checklist li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.9);
}

.checklist li svg {
  flex-shrink: 0;
  margin-top: 3px;
}

.checklist :deep(.swap-btn) {
  align-self: flex-start;
  background: var(--gb-magenta);
}

@media (min-width: 1024px) {
  .heading-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }

  .content {
    flex-direction: row;
  }

  .etapas {
    flex: 1.4;
  }

  .checklist {
    flex: 1;
    align-self: flex-start;
  }
}

</style>
