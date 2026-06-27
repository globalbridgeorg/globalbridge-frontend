<script setup>
import { ref, onMounted } from "vue"
import axios from '@/services/axios'

const paises = ref([])

onMounted(async () => {
    try {
        const response = await axios.get(
            "/paises/mais-procurados/"
        )
        paises.value = response.data

    } catch (error) {
        console.error("Erro ao buscar países:", error)
    }
})

const calcularUniversidades = (valor) => {
    const max = Math.max(...paises.value.map(p => p.universidades))
    return (valor / max) * 100
}

const calcularIntercambistas = (valor) => {
    const max = Math.max(...paises.value.map(p => p.intercambistas))
    return (valor / max) * 100
}
</script>

<template>
    <div class="container">
        <span class="best">o melhor para você</span>
        <h2>PAÍSES MAIS PROCURADOS</h2>

        <div v-for="pais in paises" :key="pais.id" class="pais">

            <div class="esquerda">
                <h3 class="nome">
                    {{ pais.nome.toUpperCase() }}
                </h3>
            </div>

            <div class="direita">

                <div class="grafico">
                    <p>Universidades</p>

                    <div class="linha">
                        <div class="barra">
                            <div class="preenchido universidades"
                                :style="{ width: calcularUniversidades(pais.universidades) + '%' }"></div>
                        </div>

                        <span>{{ pais.universidades }}</span>
                    </div>
                </div>

                <div class="grafico">
                    <p>Intercambistas</p>

                    <div class="linha">
                        <div class="barra">
                            <div class="preenchido intercambistas"
                                :style="{ width: calcularIntercambistas(pais.intercambistas) + '%' }"></div>
                        </div>

                        <span>{{ pais.intercambistas }}</span>
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
    padding: 20px 16px;
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

.info {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    border-top: 1px #f5490085 solid;
    margin: 0 0 30px 0;
    padding: 20px 0 0 0;
}

.pais {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
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
    gap: 12px;
}

.barra {
    flex: 1;
    height: 28px;
    background: #eaded4;
    border-radius: 20px;
    overflow: hidden;
}

.preenchido {
    height: 100%;
    border-radius: 20px;
    transition: width 0.5s ease;
}

.universidades {
    background: #FFAE91;
}

.intercambistas {
    background: #FFAE91;
}

.linha span {
    font-weight: bold;
    color: #9b4c26;
    font-size: 14px;
    min-width: 40px;
    text-align: right;
}

/* Tablet */
@media (min-width: 768px) {
    .container {
        padding: 30px 40px;
    }

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
    .container {
        padding: 40px 80px;
    }

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
    .container {
        padding: 50px 120px;
    }

    .pais {
        gap: 50px;
    }
}
</style>