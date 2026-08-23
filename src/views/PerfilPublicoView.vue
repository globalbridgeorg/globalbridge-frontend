<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/services/axios'

const route = useRoute()
const perfil = ref(null)
const carregando = ref(true)
const erro = ref(false)
const precisaLogin = ref(false)

const iniciais = computed(() => {
  if (!perfil.value?.name) return ''
  return perfil.value.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
})

const foto = computed(() => perfil.value?.foto_url || perfil.value?.avatar_url || null)

async function carregarPerfil() {
  carregando.value = true
  erro.value = false
  precisaLogin.value = false
  try {
    const { data } = await axios.get(`/usuarios/${route.params.id}/`)
    perfil.value = data
  } catch (e) {
    if (e.response?.status === 401) {
      precisaLogin.value = true
    } else {
      console.error('Erro ao buscar perfil:', e)
      erro.value = true
    }
  } finally {
    carregando.value = false
  }
}

onMounted(carregarPerfil)
</script>

<template>
  <div class="perfil-publico-view gb-section">
    <div v-if="carregando" class="estado-skeleton" aria-hidden="true">
      <div class="skeleton-hero"></div>
    </div>

    <div v-else-if="precisaLogin" class="estado-erro">
      <p><router-link to="/login">Entre na sua conta</router-link> pra ver esse perfil.</p>
    </div>

    <div v-else-if="erro" class="estado-erro">
      <p>Não conseguimos carregar esse perfil agora.</p>
      <button class="btn-tentar-novamente" @click="carregarPerfil">Tentar novamente</button>
    </div>

    <template v-else-if="perfil">
      <div class="hero">
        <div class="avatar">
          <img v-if="foto" :src="foto" :alt="perfil.name" />
          <span v-else aria-hidden="true">{{ iniciais }}</span>
        </div>
        <h1 class="nome">{{ perfil.name }}</h1>
      </div>
    </template>
  </div>
</template>

<style scoped>
.perfil-publico-view {
  padding: 120px 5% 72px;
  max-width: 720px;
}

.hero {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 34px;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(1.6rem, 1.1rem + 1.6vw, 2.2rem);
  color: var(--gb-dark);
  margin: 0;
}

.estado-erro {
  padding: 80px 0;
  text-align: center;
  color: var(--gb-ink-soft);
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.estado-erro a {
  color: var(--gb-magenta);
  font-weight: 600;
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

.estado-skeleton {
  padding: 0;
}

.skeleton-hero {
  height: 96px;
  width: 320px;
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
  .skeleton-hero { animation: none; }
}
</style>
