<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/services/axios'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'

// Mapa em projeção ortográfica de cada continente (Wikimedia Commons, uso
// livre) por cima do gradiente — antes disso era só cor sólida, sem
// nenhuma imagem representando o continente de verdade.
const REGIOES = [
  {
    valor: 'asia', label: 'Ásia', gradient: 'linear-gradient(135deg, #3d1247, #B01FB0)',
    imagem: 'https://commons.wikimedia.org/wiki/Special:FilePath/Asia_(orthographic_projection).svg?width=500'
  },
  {
    valor: 'europa', label: 'Europa', gradient: 'linear-gradient(135deg, #1d1d4a, #3972DE)',
    imagem: 'https://commons.wikimedia.org/wiki/Special:FilePath/Europe_orthographic_Caucasus_Urals_boundary_(with_borders).svg?width=500'
  },
  {
    valor: 'america_norte', label: 'América do Norte', gradient: 'linear-gradient(135deg, #4a0e1d, #B01FB0)',
    imagem: 'https://commons.wikimedia.org/wiki/Special:FilePath/North_America_(orthographic_projection).svg?width=500'
  },
  {
    valor: 'america_sul', label: 'América do Sul', gradient: 'linear-gradient(135deg, #4a3d0e, #F0651E)',
    imagem: 'https://commons.wikimedia.org/wiki/Special:FilePath/South_America_(orthographic_projection).svg?width=500'
  },
  {
    valor: 'oceania', label: 'Oceania', gradient: 'linear-gradient(135deg, #0e4d3d, #3D9A4B)',
    imagem: 'https://commons.wikimedia.org/wiki/Special:FilePath/Oceania_(orthographic_projection).svg?width=500'
  },
  {
    valor: 'africa', label: 'África', gradient: 'linear-gradient(135deg, #7a2e0e, #F0651E)',
    imagem: 'https://commons.wikimedia.org/wiki/Special:FilePath/Africa_(orthographic_projection).svg?width=500'
  }
]

const contagens = ref({})
const carregando = ref(true)
const erro = ref(false)

async function carregarContagens() {
  carregando.value = true
  erro.value = false
  try {
    const { data } = await axios.get('/paises/')
    const paises = Array.isArray(data) ? data : (data.results ?? [])
    const porRegiao = {}
    for (const pais of paises) {
      if (!pais.regiao) continue
      porRegiao[pais.regiao] = (porRegiao[pais.regiao] ?? 0) + 1
    }
    contagens.value = porRegiao
  } catch (e) {
    console.error('Erro ao buscar destinos:', e)
    erro.value = true
  } finally {
    carregando.value = false
  }
}

const regioesComContagem = computed(() =>
  REGIOES.map((r) => ({ ...r, count: contagens.value[r.valor] ?? 0 }))
)

onMounted(carregarContagens)
</script>

<template>
  <div class="destinos-view gb-section">
    <div class="hero">
      <span class="hero-eyebrow">Explore o mapa</span>
      <h1 class="gb-heading">Por onde você <span class="accent">quer ir</span>?</h1>
      <p>Escolha o continente pra ver os países disponíveis — e as agências parceiras de cada um.</p>
    </div>

    <div class="continentes">
      <SectionEyebrow label="Continentes" />

      <div v-if="carregando" class="continente-skeleton" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </div>

      <div v-else-if="erro" class="estado-erro">
        <p>Não conseguimos carregar os destinos agora.</p>
        <button class="btn-tentar-novamente" @click="carregarContagens">Tentar novamente</button>
      </div>

      <div v-else class="continentes-grid">
        <router-link
          v-for="regiao in regioesComContagem"
          :key="regiao.valor"
          :to="{ name: 'regiao', params: { regiao: regiao.valor } }"
          class="continente-card-link"
        >
          <article class="continente-card">
            <div class="art" :style="{ background: regiao.gradient }">
              <img :src="regiao.imagem" :alt="regiao.label" class="art-img" loading="lazy" />
            </div>
            <div class="body">
              <h2 class="nome">{{ regiao.label }}</h2>
              <span class="count">{{ regiao.count }} {{ regiao.count === 1 ? 'destino' : 'destinos' }}</span>
            </div>
          </article>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.destinos-view {
  padding: 120px 5% 72px;
}

.hero {
  max-width: 680px;
  margin-bottom: 8px;
}

.hero-eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-mauve);
}

.hero h1 {
  margin: 12px 0 14px;
}

.hero p {
  font-size: 1rem;
  line-height: 1.65;
  color: var(--gb-ink-soft);
  margin: 0;
}

.continentes {
  padding-top: 40px;
}

.continentes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.continente-card-link {
  text-decoration: none;
  display: block;
}

.continente-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.continente-card-link:hover .continente-card {
  box-shadow: var(--gb-shadow-card);
  border-color: var(--gb-magenta);
  transform: translateY(-2px);
}

.art {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.art-img {
  width: 68%;
  height: 68%;
  object-fit: contain;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.25));
  opacity: 0.92;
}

.body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 1.3rem;
  text-transform: uppercase;
  color: var(--gb-dark);
  margin: 0;
}

.count {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  color: var(--gb-ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.continente-skeleton {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.skeleton-card {
  height: 210px;
  border-radius: var(--gb-radius-card);
  background: linear-gradient(90deg, rgba(46,10,46,0.06) 25%, rgba(46,10,46,0.1) 37%, rgba(46,10,46,0.06) 63%);
  background-size: 400% 100%;
  animation: gb-skeleton-shimmer 1.6s ease-in-out infinite;
}

@keyframes gb-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card { animation: none; }
}

.estado-erro {
  padding: 40px 0;
  color: var(--gb-ink-soft);
  font-size: 0.95rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}

.btn-tentar-novamente {
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 11px 22px;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
}

.btn-tentar-novamente:hover {
  background: rgba(46, 10, 46, 0.04);
}

@media (max-width: 900px) {
  .continentes-grid, .continente-skeleton { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 560px) {
  .continentes-grid, .continente-skeleton { grid-template-columns: 1fr; }
}

/* O header não é mais fixed no celular (ver App.vue), então não precisa
   mais desse respiro artificial pra não ficar embaixo dele. */
@media (max-width: 768px) {
  .destinos-view {
    padding: 16px 16px 72px;
  }
}
</style>
