<script setup>
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { ref, onMounted, onBeforeUnmount } from "vue"
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
  title: {
    type: String,
    default: "PERGUNTAS FREQUENTES"
  },
  faqs: {
    type: Array,
    default: () => [
      {
        id: 1,
        question: "Como escolher o melhor destino para mim?",
        answer: "Você pode utilizar o mapa disponível na plataforma para explorar os destinos e encontrar opções que se encaixem nos seus objetivos. Nele, é possível visualizar países, comparar alternativas e decidir com mais facilidade."
      },
      {
        id: 2,
        question: "Qual é a duração dos programas?",
        answer: "Os programas podem variar bastante, indo de poucas semanas até vários meses ou anos. A duração ideal depende do seu objetivo, disponibilidade de tempo e tipo de intercâmbio escolhido."
      },
      {
        id: 3,
        question: "Existe limite de idade para fazer intercâmbio?",
        answer: "Alguns programas possuem restrições de idade, principalmente os acadêmicos ou de trabalho. No entanto, existem diversas opções disponíveis para diferentes faixas etárias."
      },
      {
        id: 4,
        question: "Quais tipos de intercâmbio posso encontrar?",
        answer: "Há diversas opções, como intercâmbio de estudo, cursos de idioma, trabalho, voluntariado e programas culturais. Cada um atende a objetivos e perfis diferentes."
      },
      {
        id: 5,
        question: "Preciso saber falar outro idioma para participar?",
        answer: "Depende do programa escolhido. Alguns exigem conhecimento básico ou intermediário do idioma, enquanto outros são voltados para iniciantes que desejam aprender desde o início."
      },
      {
        id: 6,
        question: "Quanto custa um intercâmbio?",
        answer: "Os custos variam conforme o destino, duração e tipo de programa. Geralmente incluem taxas, passagem, hospedagem e alimentação, podendo mudar conforme as escolhas do participante."
      },
      {
        id: 7,
        question: "Posso trabalhar durante o intercâmbio?",
        answer: "Isso depende das regras do país e do tipo de visto obtido. Em alguns casos, é permitido trabalhar meio período, enquanto em outros há restrições mais rígidas."
      }
    ]
  }
})

// Deixei preparado caso queira transformar em accordion no futuro
// (por enquanto todas as respostas ficam visíveis, igual na referência)
const activeId = ref(null)
const toggleFaq = (id) => {
  activeId.value = activeId.value === id ? null : id
}

const listRef = ref(null)
let ctx

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.from('.faq-item', {
      opacity: 0,
      y: 16,
      duration: 0.5,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: listRef.value, start: 'top 80%' }
    })
  }, listRef.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section class="faq-section">
    <SectionEyebrow number="07" label="Perguntas frequentes" />

    <h2 class="faq-title gb-heading">{{ title }}</h2>

    <div class="faq-list" ref="listRef">
      <div
        v-for="faq in faqs"
        :key="faq.id"
        class="faq-item"
      >
        <h3 class="faq-question">{{ faq.question }}</h3>
        <p class="faq-answer">{{ faq.answer }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Mobile First */
.faq-section {
    width: 100%;
    padding: 30px 0 30px 0;
    max-width: 1440px;
    margin: 0 auto;
    box-sizing: border-box;
}

.faq-title {
    margin-top: 24px;
    margin-bottom: 20px;
}

.faq-list {
    display: flex;
    flex-direction: column;
}

.faq-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px 0;
    border-top: 1px solid #e5ded0;
}

.faq-item:last-child {
    border-bottom: 1px solid #e5ded0;
}

.faq-question {
    font-size: 18px;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.3;
}

.faq-answer {
    font-size: 14px;
    line-height: 1.6;
    color: #6b6b6b;
    margin: 0;
}

/* Tablet */
@media (min-width: 768px) {

    .faq-title {
        margin-bottom: 30px;
    }

    .faq-item {
        flex-direction: row;
        align-items: flex-start;
        gap: 40px;
        padding: 30px 0;
    }

    .faq-question {
        width: 40%;
        font-size: 20px;
    }

    .faq-answer {
        width: 60%;
        font-size: 15px;
    }
}

/* Desktop */
@media (min-width: 1024px) {


    .faq-title {
        margin-bottom: 40px;
    }

    .faq-item {
        padding: 35px 0;
        gap: 60px;
    }

    .faq-question {
        width: 35%;
        font-size: 1.5rem;
    }

    .faq-answer {
        width: 65%;
        font-size: 16px;
    }
}

@media (max-width: 1600px) {
  .faq-section {
    max-width: 1225px;
  }
}
</style>