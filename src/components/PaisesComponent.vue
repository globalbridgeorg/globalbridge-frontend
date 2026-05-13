        <script setup>
        import { ref, onMounted } from "vue"
        import axios from "axios"

        const paises = ref([])

        onMounted(async () => {
            try {
                const response = await axios.get(
                    "http://localhost:8000/api/paises/mais-procurados/"
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
.container {
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 40px 15%;
}

span.best {
    font-size: 0.78vw;
    color: #66635C;
    background-color: #E5E0CF;
    padding: 10px 8px;
    border-radius: 10px;
}

h2 {
    margin-top: 15px;
    font-size: 2vw;
    margin-bottom: 100px;
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
    justify-content: space-between;
    align-items: flex-start;
    padding: 30px 0;
    border-top: 1px solid #d3a58f;
}

.esquerda {
    width: 30%;
}

.nome {
    font-size: 2.5rem;
    color: #6e1c00;
}

.direita {
    width: 80%;
    display: flex;
    flex-direction: column;
    gap: 25px;
    margin-right: 100px;
}

.grafico p {
    margin-bottom: 8px;
    font-weight: bold;
    color: #6e1c00;
}

.linha {
    display: flex;
    align-items: center;
    gap: 15px;
}

.barra {
    width: 100%;
    height: 30px;
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
}
</style>