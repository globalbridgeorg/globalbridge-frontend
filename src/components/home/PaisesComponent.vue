<script setup>
import { ref, onMounted, nextTick } from "vue"
import axios from '@/services/axios'
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { palette } from '@/utils/palette'

gsap.registerPlugin(ScrollTrigger)

const paises = ref([])

// Configuração dos gráficos - ADICIONE aqui novos indicadores que
// vierem do backend, sem precisar mexer no template ou na animação.
const metricsConfig = [
  { key: "universidades", label: "Universidades", trackWidth: 60 },
  { key: "intercambistas", label: "Intercambistas", trackWidth: 100 }
]

// Cores de destaque por posição no ranking (top 3 / meio / final), igual referência visual
const rankColors = [palette.red, palette.magentaStrong, palette.red, palette.red, palette.red, palette.green, palette.green, palette.green]
const corPorPosicao = (index) => rankColors[index % rankColors.length]

// Refs dinâmicas (guardadas em objetos por id/chave, já que v-for não permite array de refs facilmente com múltiplos níveis)
const paisRefs = ref({})
const barraRefs = ref({})
const numeroRefs = ref({})
const programasRefs = ref({})

const setPaisRef = (el, id) => { if (el) paisRefs.value[id] = el }
const setBarraRef = (el, key) => { if (el) barraRefs.value[key] = el }
const setNumeroRef = (el, key) => { if (el) numeroRefs.value[key] = el }
const setProgramasRef = (el, id) => { if (el) programasRefs.value[id] = el }

const calcularPercentual = (pais, key) => {
  const valores = paises.value
    .map(p => Number(p[key]) || 0)
    .filter(valor => valor > 0)

  if (!valores.length) return 0

  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  const range = maximo - minimo || 1
  const valor = Number(pais[key]) || 0

  const percentual = ((valor - minimo) / range) * 84 + 16

  return Math.max(16, Math.min(100, Math.round(percentual)))
}

onMounted(async () => {
  try {
    const response = await axios.get("/paises/mais-procurados/", {
      params: { quantidade: 6 }
    })

    paises.value = response.data.map(p => ({
      ...p,
      programasDisponiveis: p.programas_disponiveis ?? p.programasDisponiveis ?? 0
    }))
  } catch (error) {
    console.error("Erro ao buscar países:", error)
    paises.value = []
  }

  await nextTick()
  animarGraficos()
})

const animarGraficos = () => {
  paises.value.forEach(pais => {
    const paisEl = paisRefs.value[pais.id]
    if (!paisEl) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: paisEl,
        start: "top 80%",
        end: "bottom top", // necessário para o onLeaveBack funcionar corretamente
        toggleActions: "restart ",
      }
    })


    // Animação das barras + números de cada métrica
    metricsConfig.forEach(metric => {
      const chave = `${pais.id}-${metric.key}`
      const barraEl = barraRefs.value[chave]
      const numeroEl = numeroRefs.value[chave]
      const percentual = calcularPercentual(pais, metric.key)
      const valorFinal = pais[metric.key] || 0

      if (barraEl) {
        tl.fromTo(barraEl,
          { width: "0%" },
          { width: percentual + "%", duration: 1.2, ease: "power3.out" },
          "<" // começa junto com as outras animações da timeline
        )
      }

      if (numeroEl) {
        const contador = { valor: 0 }
        tl.to(contador, {
          valor: valorFinal,
          duration: 1.2,
          ease: "power3.out",
          onUpdate: () => {
            numeroEl.textContent = Math.round(contador.valor).toLocaleString("pt-BR")
          }
        }, "<")
      }
    })

    // Número grande de "programas disponíveis"
    const programasEl = programasRefs.value[pais.id]
    if (programasEl) {
      const contador = { valor: 0 }
      tl.to(contador, {
        valor: pais.programasDisponiveis || 0,
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          programasEl.textContent = Math.round(contador.valor)
        }
      }, "<")
    }
  })
}
</script>

<template>
  <div class="container">
    <SectionEyebrow number="06" label="Dados de 2026" />

    <div class="heading-row">
      <h2 class="gb-heading">Países mais<br />procurados</h2>
      <p class="heading-desc">
        Ranking dos destinos com maior procura na plataforma nos últimos doze
        meses. As barras mostram o desempenho de cada indicador comparado aos
        demais países da lista.
      </p>
    </div>

    <div class="table-head">
      <span class="col-rank">#</span>
      <span class="col-pais">País</span>
      <span class="col-indicadores">Indicadores</span>
      <span class="col-programas">Programas</span>
    </div>

    <div
      v-for="(pais, index) in paises"
      :key="pais.id"
      class="pais"
      :ref="el => setPaisRef(el, pais.id)"
    >
      <span class="rank-numero" :style="{ color: corPorPosicao(index) }">
        {{ String(index + 1).padStart(2, '0') }}
      </span>

      <div class="esquerda">
        <h3 class="nome" :style="{ color: corPorPosicao(index) }">{{ pais.nome.toUpperCase() }}</h3>
      </div>

      <div class="direita">
        <div
          v-for="metric in metricsConfig"
          :key="metric.key"
          class="grafico"
        >
          <p>{{ metric.label }}</p>

        <div class="linha">
            <div
                class="barra"
                :style="{ width: metric.trackWidth + '%' }"
            >
                <div
                class="preenchido"
                :class="metric.key"
                :style="{ background: corPorPosicao(index) }"
                :ref="el => setBarraRef(el, `${pais.id}-${metric.key}`)"
                ></div>

                <span :ref="el => setNumeroRef(el, `${pais.id}-${metric.key}`)">0</span>
            </div>
        </div>
        </div>
      </div>

      <div class="programas" :style="{ color: corPorPosicao(index) }">
        <span
          class="programas-numero"
          :ref="el => setProgramasRef(el, pais.id)"
        >0</span>
        <span class="programas-label">
          programas<br />disponíveis
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Mobile First - Estilos base para mobile */
.container {
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: var(--gb-space-y) var(--gb-space-x);
    box-sizing: border-box;
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
  max-width: 480px;
  margin: 0;
}

.table-head {
  display: none;
}

.pais {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 30px 0;
    border-top: 1px solid var(--gb-purple-deep-18);
    gap: 16px;
    position: relative;
}

.rank-numero {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.1em;
}

.esquerda {
    width: 100%;
}

.nome {
    font-family: var(--gb-font-display);
    font-weight: 900;
    font-size: 24px;
    margin: 0;
}

.direita {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.grafico p {
    margin-bottom: 6px;
    font-weight: 700;
    color: var(--gb-dark);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.linha {
    display: flex;
    align-items: center;
}

.barra {
    display: flex;
    align-items: center;
    flex: none;
    height: 10px;
    background: rgba(46, 10, 46, 0.08);
    border-radius: 20px;
    overflow: visible;
}

.preenchido {
    height: 100%;
    width: 0%;
    border-radius: 20px;
    flex-shrink: 0;
}

.linha span {
    font-weight: 700;
    color: var(--gb-dark);
    font-size: 13px;
    margin-left: 10px;
    white-space: nowrap;
}

.programas {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.programas-numero {
    display: block;
    font-family: var(--gb-font-display);
    font-size: 42px;
    font-weight: 900;
    line-height: 1;
}

.programas-label {
    display: block;
    font-size: 11px;
    color: var(--gb-ink-faint);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

/* Tablet */
@media (min-width: 768px) {
    .heading-row {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
    }

    .pais {
        flex-direction: row;
        align-items: center;
        gap: 24px;
    }

    .rank-numero {
      font-size: 14px;
      width: 24px;
      flex-shrink: 0;
    }

    .esquerda {
        width: 22%;
    }

    .nome {
        font-size: 28px;
    }

    .direita {
        width: 48%;
        gap: 14px;
    }

    .programas {
      width: 22%;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }

    .programas-numero {
        font-size: 44px;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .table-head {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 0 0 16px;
      font-family: var(--gb-font-eyebrow);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--gb-ink-faint);
    }

    .col-rank { width: 24px; }
    .col-pais { width: 22%; }
    .col-indicadores { width: 48%; }
    .col-programas { width: 22%; text-align: right; margin-left: auto; }

    .pais {
        padding: 32px 0;
    }

    .nome {
        font-size: 2rem;
    }

    .programas-numero {
        font-size: 3vw;
    }

    .direita {
        gap: 20px;
    }

    .barra {
        height: 12px;
    }
}

@media (max-width: 1600px) {
  .container {
    max-width: 1225px;
  }
}
</style>
