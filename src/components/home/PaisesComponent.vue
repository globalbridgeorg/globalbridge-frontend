<script setup>
import { ref, onMounted, nextTick } from "vue"
import axios from '@/services/axios'
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const paises = ref([])

// Configuração dos gráficos - ADICIONE aqui novos indicadores que
// vierem do backend, sem precisar mexer no template ou na animação.
const metricsConfig = [
  { key: "universidades", label: "Universidades", trackWidth: 60 },
  { key: "intercambistas", label: "Intercambistas", trackWidth: 100 }
]

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
    <span class="best">o melhor para você</span>
    <h2>PAÍSES MAIS PROCURADOS</h2>

    <div
      v-for="pais in paises"
      :key="pais.id"
      class="pais"
      :ref="el => setPaisRef(el, pais.id)"
    >
      <div class="esquerda">
        <h3 class="nome">{{ pais.nome.toUpperCase() }}</h3>

        <div class="programas">
          <span
            class="programas-numero"
            :ref="el => setProgramasRef(el, pais.id)"
          >0</span>
          <span class="programas-label">
            programas<br />disponíveis
          </span>
        </div>
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
                :ref="el => setBarraRef(el, `${pais.id}-${metric.key}`)"
                ></div>

                <span :ref="el => setNumeroRef(el, `${pais.id}-${metric.key}`)">0</span>
            </div>
        </div>
        </div>
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
    padding: 40px 0;
    box-sizing: border-box;
}

span.best {
    font-size: 12px;
    color: #66635C;
    background-color: #E5E0CF;
    padding: 6px 12px;
    border-radius: 10px;
    display: inline-block;
}

h2 {
    margin-top: 12px;
    font-size: 24px;
    margin-bottom: 40px;
}

.pais {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 30px 0;
    border-top: 1px solid #d3a58f;
    gap: 20px;
}

.esquerda {
    width: 100%;
}

.nome {
    font-size: 28px;
    color: #6e1c00;
    margin: 0;
}

/* --- Programas disponíveis (número grande) --- */
.programas {
    margin-top: 20px;
}

.programas-numero {
    display: block;
    font-size: 42px;
    font-weight: 800;
    color: #c0431f;
    line-height: 1;
}

.programas-label {
    display: block;
    font-size: 13px;
    color: #9b4c26;
    font-weight: 600;
    margin-top: 6px;
}

.direita {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 25px;
}

.grafico p {
    margin-bottom: 8px;
    font-weight: bold;
    color: #6e1c00;
    font-size: 14px;
}

.linha {
    display: flex;
    align-items: center;
}

.barra {
    display: flex; /* novo: alinha preenchido + número na mesma linha */
    align-items: center;
    flex: none;
    height: 28px;
    background: none;
    border-radius: 20px;
    overflow: visible; /* precisa ser visible agora, senão o número fica cortado se a barra crescer perto do limite */
}

.preenchido {
    height: 100%;
    width: 0%;
    border-radius: 20px;
    background: #FFAE91;
    flex-shrink: 0; /* garante que o preenchido não encolha pra "abrir espaço" pro número */
}

.linha span {
    font-weight: bold;
    color: #9b4c26;
    font-size: 14px;
    margin-left: 8px; /* espacinho entre a ponta da barra e o número */
    white-space: nowrap; /* evita quebra de linha do número */
}

/* Tablet */
@media (min-width: 768px) {
    span.best {
        font-size: 13px;
        padding: 8px 16px;
    }

    h2 {
        font-size: 32px;
        margin-bottom: 60px;
    }

    .pais {
        flex-direction: row;
        gap: 30px;
    }

    .esquerda {
        width: 35%;
    }

    .nome {
        font-size: 32px;
    }

    .programas-numero {
        font-size: 52px;
    }

    .direita {
        width: 65%;
        gap: 20px;
    }

    .grafico p {
        font-size: 15px;
    }

    .barra {
        height: 32px;
    }

    .linha span {
        font-size: 15px;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    span.best {
        font-size: 0.78vw;
        padding: 10px 18px;
    }

    h2 {
        font-size: 2vw;
        margin-bottom: 80px;
    }

    .pais {
        padding: 40px 0;
        gap: 40px;
    }

    .esquerda {
        width: 30%;
    }

    .nome {
        font-size: 2.5rem;
    }

    .programas-numero {
        font-size: 3.5vw;
    }

    .direita {
        width: 70%;
        margin-right: 100px;
        gap: 25px;
    }

    .grafico p {
        font-size: 16px;
    }

    .barra {
        height: 30px;
    }

    .linha {
        gap: 15px;
    }

    .linha span {
        font-size: 16px;
    }
}

/* Desktop Grande */
@media (min-width: 1440px) {
    .pais {
        gap: 50px;
    }
}
</style>