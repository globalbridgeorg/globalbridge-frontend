<script setup>
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import ButtonComponent from '@/components/common/ButtonComponent.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const idiomas = ['Inglês', 'Espanhol', 'Japonês', 'Alemão', '+8 idiomas']

const opcoes = [
  'custo de vida',
  'recepção local',
  'cultura interna',
  'nível de idioma'
]

const sectionRef = ref(null)
const cardPinkRef = ref(null)
const cardBlueRef = ref(null)
const destinoRef = ref(null)
const opcoesRef = ref(null)
const listItemRefs = ref([])

let triggers = []

onMounted(() => {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top 75%'
      }
    })

    tl.from(cardPinkRef.value, { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' })
      .from(cardBlueRef.value, { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')

    gsap.from(destinoRef.value, {
      opacity: 0,
      x: -30,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: destinoRef.value, start: 'top 80%' }
    })

    gsap.from(opcoesRef.value, {
      opacity: 0,
      x: 30,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: opcoesRef.value, start: 'top 80%' }
    })

    gsap.from(listItemRefs.value, {
      opacity: 0,
      y: 12,
      duration: 0.5,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: { trigger: opcoesRef.value, start: 'top 75%' }
    })
  }, sectionRef.value)

  triggers.push(ctx)
})

onBeforeUnmount(() => {
  triggers.forEach(ctx => ctx.revert())
})
</script>

<template>
  <section class="programas" ref="sectionRef">
    <SectionEyebrow number="03" label="Programas disponíveis" />

    <div class="cards-row">
      <div class="card card-pink" ref="cardPinkRef">
        <svg class="quote-icon" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 24V14.4C0 9.87 1.28 6.24 3.84 3.5C6.4 0.9 9.6 0 13.44 0V4.8C10.88 4.8 8.96 5.6 7.68 7.2C6.4 8.66 5.76 10.75 5.76 13.44H13.44V24H0ZM18.56 24V14.4C18.56 9.87 19.84 6.24 22.4 3.5C24.96 0.9 28.16 0 32 0V4.8C29.44 4.8 27.52 5.6 26.24 7.2C24.96 8.66 24.32 10.75 24.32 13.44H32V24H18.56Z" fill="#42023C"/>
        </svg>
        <p class="quote-text">
          Planos de intercâmbio intensivo com ensino universitário
          <em>“Study &amp; Work”</em>, <em>“Au Pair”</em> e residência garantida.
          Programas completos para quem deseja estudar, trabalhar e viver uma
          experiência internacional com mais segurança e planejamento.
        </p>
        <ButtonComponent text="Saiba mais" iconType="primary" />
      </div>

      <div class="card card-blue" ref="cardBlueRef">
        <h3 class="blue-title">INTERCÂMBIO SEM<br />SABER O IDIOMA</h3>
        <p class="blue-subtitle">
          Veja planos de intercâmbio com ensino de idioma integrado. Comece seu futuro hoje!
        </p>
        <ButtonComponent text="Ver os planos" iconType="secondary" style="background-color: white; color: #42023C;" />

        <ul class="idiomas-pills">
          <li v-for="idioma in idiomas" :key="idioma">{{ idioma }}</li>
        </ul>
      </div>
    </div>

    <div class="destino-row">
      <div class="destino-imagem" ref="destinoRef">
        <img src="/images/imagemgb2.png" alt="Destino em destaque" />
        <span class="destino-caption">destino em destaque — rua movimentada</span>
      </div>

      <div class="opcoes" ref="opcoesRef">
        <span class="opcoes-badge">+40 países</span>
        <h2 class="opcoes-title">NOSSAS OPÇÕES</h2>
        <p class="opcoes-desc">
          Explore nossa seleção com mais de 40 países ao redor do mundo. Compare
          destinos e descubra qual combina com seu perfil, planeje sua experiência
          internacional com mais segurança e confiança com base em:
        </p>

        <ul class="opcoes-list">
          <li v-for="(opcao, i) in opcoes" :key="opcao" :ref="el => (listItemRefs[i] = el)">
            <span>{{ opcao }}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </li>
        </ul>

        <div class="opcoes-footer">
          <span class="opcoes-updated">Seleção atualizada 2026</span>
          <ButtonComponent text="Veja todos" iconType="tertiary" style="background-color: #17111A; color: #fff;" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.programas {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 5% 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.cards-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.card {
  flex: 1;
  border-radius: 12px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 260px;
  box-sizing: border-box;
}

.card-pink {
  background-color: var(--gb-pink);
}

.quote-icon {
  width: 32px;
  height: 24px;
  margin-bottom: 20px;
}

.quote-text {
  font-family: var(--gb-font-display);
  font-size: 1rem;
  line-height: 1.5;
  color: #42023C;
  margin: 0 0 20px;
}

.quote-text em {
  font-style: italic;
}

.card-blue {
  background-color: var(--gb-blue);
  color: #fff;
}

.blue-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(1.4rem, 1rem + 2vw, 2rem);
  line-height: 1.15;
  margin: 0 0 12px;
}

.blue-subtitle {
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 20px;
  opacity: 0.92;
}

.idiomas-pills {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0 0;
  padding: 0;
}

.idiomas-pills li {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.destino-row {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.destino-imagem {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  min-height: 280px;
  background: #E5E0CF;
}

.destino-imagem img {
  width: 100%;
  height: 100%;
  min-height: 280px;
  object-fit: cover;
  display: block;
}

.destino-caption {
  position: absolute;
  left: 16px;
  bottom: 16px;
  background: rgba(23, 17, 26, 0.55);
  color: #fff;
  backdrop-filter: blur(6px);
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 20px;
}

.opcoes {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.opcoes-badge {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gb-magenta);
  margin-bottom: 12px;
}

.opcoes-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(1.4rem, 1rem + 2vw, 2rem);
  color: var(--gb-dark);
  margin: 0 0 14px;
}

.opcoes-desc {
  font-size: 0.95rem;
  line-height: 1.55;
  color: #55505A;
  margin: 0 0 20px;
}

.opcoes-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
}

.opcoes-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-top: 1px solid var(--gb-purple-deep-18);
  font-weight: 600;
  color: var(--gb-dark);
}

.opcoes-list li:last-child {
  border-bottom: 1px solid var(--gb-purple-deep-18);
}

.opcoes-list li svg {
  color: var(--gb-magenta);
  flex-shrink: 0;
}

.opcoes-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.opcoes-updated {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8A8479;
}

@media (min-width: 900px) {
  .cards-row {
    flex-direction: row;
  }

  .card {
    min-height: 324px;
  }

  .destino-row {
    flex-direction: row;
    align-items: stretch;
  }

  .destino-imagem {
    flex: 0.8;
    min-height: 0;
  }

  .destino-imagem img {
    min-height: 0;
  }

  .opcoes {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 1600px) {
  .programas {
    max-width: 1225px;
  }
}
</style>
