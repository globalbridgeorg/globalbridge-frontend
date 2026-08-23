<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/services/axios'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'

const route = useRoute()
const router = useRouter()
const perfil = ref(null)
const carregando = ref(true)
const erro = ref(false)
const precisaLogin = ref(false)

function iniciaisDe(nome) {
  if (!nome) return ''
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

const iniciais = computed(() => iniciaisDe(perfil.value?.name))
const foto = computed(() => perfil.value?.foto_url || perfil.value?.avatar_url || null)
const ehAgencia = computed(() => perfil.value?.tipo === 'agencia')

const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

async function carregarPerfil() {
  carregando.value = true
  erro.value = false
  precisaLogin.value = false

  // Se o username da URL é o meu, isso É o meu perfil — pula direto pra
  // /profile (a página privada) em vez de mostrar a versão pública de mim.
  if (getStoredToken()) {
    try {
      const { data: eu } = await axios.get('/usuarios/me/')
      if (eu.username === route.params.username) {
        router.replace({ name: 'profile' })
        return
      }
    } catch (e) {
      // token inválido/expirado — segue o fluxo normal, o fetch abaixo
      // vai lidar com o 401 se o perfil também exigir login.
    }
  }

  try {
    const { data } = await axios.get(`/usuarios/u/${route.params.username}/`)
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
      <!-- ===== Perfil de AGÊNCIA ===== -->
      <template v-if="ehAgencia">
        <div class="hero-ag">
          <div class="avatar avatar-ag">
            <img v-if="foto" :src="foto" :alt="perfil.name" />
            <span v-else aria-hidden="true">{{ iniciais }}</span>
          </div>
          <div class="hero-ag-info">
            <span class="badge-agencia">Conta de agência</span>
            <h1 class="nome nome-ag">{{ perfil.name }}</h1>
            <p class="hero-ag-sub" v-if="perfil.agencia">
              Fala em nome da <strong>{{ perfil.agencia.nome }}</strong> na GlobalBridge
            </p>
            <p class="hero-ag-sub" v-else>Conta de agência ainda não vinculada a um perfil de agência.</p>
          </div>
        </div>

        <template v-if="perfil.agencia">
          <div class="eyebrow-wrap"><SectionEyebrow label="Agência vinculada" /></div>
          <h2 class="gb-heading section-title">A agência<br />por trás da conta</h2>

          <router-link :to="{ name: 'agencia', params: { id: perfil.agencia.id } }" class="agencia-card-link">
            <div class="agencia-photo-band" aria-hidden="true">{{ iniciaisDe(perfil.agencia.nome) }}</div>
            <div class="agencia-card-body">
              <div class="agencia-card-top">
                <span class="agencia-card-nome">{{ perfil.agencia.nome }}</span>
                <span v-if="perfil.agencia.nota_media !== null" class="agencia-card-stars" aria-hidden="true">
                  <span v-for="n in 5" :key="n">{{ n <= Math.round(perfil.agencia.nota_media) ? '★' : '☆' }}</span>
                </span>
              </div>
              <p class="agencia-card-desc">{{ perfil.agencia.descricao }}</p>
              <div class="agencia-card-foot">
                <span v-if="perfil.agencia.cidade" class="agencia-card-loc">{{ perfil.agencia.cidade }}, {{ perfil.agencia.pais }}</span>
                <span class="btn-ver-agencia">Ver página completa →</span>
              </div>
            </div>
          </router-link>

          <div class="eyebrow-wrap"><SectionEyebrow label="Números da agência" /></div>
          <h2 class="gb-heading section-title">Um resumo<br />rápido</h2>

          <div class="ag-stats">
            <div class="ag-stat-box">
              <div class="ag-stat-num">{{ perfil.agencia.nota_media ?? '—' }}</div>
              <div class="ag-stat-label">Nota média</div>
            </div>
            <div class="ag-stat-box">
              <div class="ag-stat-num">{{ perfil.agencia.total_avaliacoes }}</div>
              <div class="ag-stat-label">Avaliações</div>
            </div>
            <div class="ag-stat-box">
              <div class="ag-stat-num">{{ perfil.agencia.total_programas }}</div>
              <div class="ag-stat-label">Programas</div>
            </div>
            <div class="ag-stat-box">
              <div class="ag-stat-num ag-stat-text">{{ perfil.agencia.cidade || '—' }}</div>
              <div class="ag-stat-label">Cidade</div>
            </div>
          </div>
        </template>
      </template>

      <!-- ===== Perfil de ESTUDANTE ===== -->
      <template v-else>
        <div class="hero-a">
          <div class="avatar avatar-lg">
            <img v-if="foto" :src="foto" :alt="perfil.name" />
            <span v-else aria-hidden="true">{{ iniciais }}</span>
          </div>
          <div class="hero-a-info">
            <span class="badge-tipo badge-estudante">Estudante</span>
            <h1 class="nome nome-a">{{ perfil.name }}</h1>
            <p class="hero-a-sub">Compartilha experiências reais sobre agências de intercâmbio</p>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-num">{{ perfil.total_avaliacoes }}</div>
            <div class="stat-label">Avaliaç{{ perfil.total_avaliacoes === 1 ? 'ão escrita' : 'ões escritas' }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">{{ perfil.nota_media_dada ?? '—' }}</div>
            <div class="stat-label">Nota média dada</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">{{ perfil.agencias_avaliadas }}</div>
            <div class="stat-label">Agênci{{ perfil.agencias_avaliadas === 1 ? 'a avaliada' : 'as avaliadas' }}</div>
          </div>
        </div>

        <div class="eyebrow-wrap">
          <SectionEyebrow :label="`${perfil.total_avaliacoes} avaliaç${perfil.total_avaliacoes === 1 ? 'ão' : 'ões'}`" />
        </div>
        <h2 class="gb-heading section-title">Avaliações de<br />{{ perfil.name?.split(' ')[0] }}</h2>

        <div v-if="perfil.avaliacoes.length" class="review-cards">
          <article v-for="avaliacao in perfil.avaliacoes" :key="avaliacao.id" class="review-card">
            <span class="review-stars" role="img" :aria-label="`${avaliacao.nota} de 5 estrelas`">
              <template v-for="n in 5" :key="n"><span aria-hidden="true">{{ n <= avaliacao.nota ? '★' : '☆' }}</span></template>
            </span>
            <p class="review-text">{{ avaliacao.comentario }}</p>
            <router-link :to="{ name: 'agencia', params: { id: avaliacao.agencia_id } }" class="review-agencia">
              <span class="review-agencia-avatar" aria-hidden="true">{{ iniciaisDe(avaliacao.agencia_nome) }}</span>
              <span class="review-agencia-info">
                <strong>{{ avaliacao.agencia_nome }}</strong>
                <span v-if="avaliacao.agencia_cidade">{{ avaliacao.agencia_cidade }}, {{ avaliacao.agencia_pais }}</span>
              </span>
            </router-link>
          </article>
        </div>
        <p v-else class="estado-vazio">{{ perfil.name }} ainda não escreveu nenhuma avaliação.</p>
      </template>
    </template>
  </div>
</template>

<style scoped>
.perfil-publico-view {
  padding: 120px 5% 90px;
}

.eyebrow-wrap {
  margin-bottom: 14px;
}

.section-title {
  font-size: clamp(1.3rem, 1rem + 1vw, 1.7rem);
  margin-bottom: 24px;
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
  margin: 0 0 6px;
}

/* ---------- Estudante ---------- */
.hero-a {
  display: flex;
  align-items: center;
  gap: 28px;
  background: #fff;
  border-radius: 20px;
  padding: 36px 40px;
  box-shadow: var(--gb-shadow-card);
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
}

.hero-a::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--gb-pink) 0%, rgba(251, 194, 244, 0) 70%);
}

.hero-a-info {
  position: relative;
  z-index: 1;
  flex: 1;
}

.badge-tipo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 20px;
  margin-bottom: 10px;
}

.badge-estudante {
  background: rgba(176, 31, 176, 0.1);
  color: var(--gb-magenta-strong);
}

.nome-a {
  color: var(--gb-dark);
}

.hero-a-sub {
  font-size: 13px;
  color: var(--gb-ink-soft);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

.stat-box {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 20px 22px;
}

.stat-num {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 2.1rem;
  color: var(--gb-dark);
  line-height: 1;
}

.stat-label {
  font-size: 11.5px;
  color: var(--gb-ink-faint);
  margin-top: 6px;
  font-weight: 600;
}

.review-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.review-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--gb-shadow-card);
}

.review-stars {
  color: var(--gb-magenta);
  font-size: 1rem;
  letter-spacing: 2px;
}

.review-text {
  font-size: 0.92rem;
  line-height: 1.6;
  color: #3a3640;
  margin: 0;
}

.review-agencia {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--gb-purple-deep-16);
  text-decoration: none;
}

.review-agencia-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gb-blue), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
}

.review-agencia-info {
  display: flex;
  flex-direction: column;
}

.review-agencia-info strong {
  font-size: 0.85rem;
  color: var(--gb-dark);
  transition: color 0.15s ease;
}

.review-agencia-info span {
  font-size: 0.72rem;
  color: var(--gb-ink-faint);
}

.review-agencia:hover strong {
  color: var(--gb-magenta);
}

/* ---------- Agência ---------- */
.hero-ag {
  display: flex;
  align-items: center;
  gap: 28px;
  background: var(--gb-dark);
  border-radius: 20px;
  padding: 36px 40px;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
}

.hero-ag::before {
  content: '';
  position: absolute;
  top: -80px;
  left: -40px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(176, 31, 176, 0.35) 0%, rgba(176, 31, 176, 0) 70%);
}

.avatar-ag {
  border: 3px solid rgba(255, 255, 255, 0.15);
  position: relative;
  z-index: 1;
}

.hero-ag-info {
  position: relative;
  z-index: 1;
}

.badge-agencia {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 20px;
  background: var(--gb-magenta);
  color: #fff;
  margin-bottom: 10px;
}

.nome-ag {
  color: #fff;
}

.hero-ag-sub {
  font-size: 13px;
  color: rgba(251, 246, 231, 0.65);
}

.hero-ag-sub strong {
  color: rgba(251, 246, 231, 0.9);
}

.agencia-card-link {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  display: flex;
  box-shadow: var(--gb-shadow-card);
  margin-bottom: 40px;
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.agencia-card-link:hover {
  border-color: var(--gb-magenta);
  transform: translateY(-2px);
}

.agencia-photo-band {
  width: 150px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 28px;
  color: rgba(255, 255, 255, 0.85);
}

.agencia-card-body {
  flex: 1;
  padding: 24px 28px;
  min-width: 0;
}

.agencia-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.agencia-card-nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 17px;
  text-transform: uppercase;
  color: var(--gb-dark);
}

.agencia-card-stars {
  color: var(--gb-magenta);
  letter-spacing: 2px;
  font-size: 13px;
  white-space: nowrap;
}

.agencia-card-desc {
  font-size: 12.5px;
  color: var(--gb-ink-soft);
  line-height: 1.6;
  margin-bottom: 16px;
  max-width: 520px;
}

.agencia-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.agencia-card-loc {
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.btn-ver-agencia {
  background: var(--gb-dark);
  color: #fff;
  border-radius: var(--gb-radius-pill);
  padding: 9px 18px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.agencia-card-link:hover .btn-ver-agencia {
  background: var(--gb-magenta);
}

.ag-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.ag-stat-box {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 18px 20px;
  text-align: center;
}

.ag-stat-num {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 1.7rem;
  color: var(--gb-dark);
}

.ag-stat-text {
  font-size: 1rem;
  text-transform: uppercase;
}

.ag-stat-label {
  font-size: 10.5px;
  color: var(--gb-ink-faint);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 4px;
}

/* ---------- Estados ---------- */
.estado-vazio {
  color: var(--gb-ink-soft);
  font-size: 0.95rem;
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
  background: linear-gradient(90deg, rgba(46, 10, 46, 0.06) 25%, rgba(46, 10, 46, 0.1) 37%, rgba(46, 10, 46, 0.06) 63%);
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

@media (max-width: 900px) {
  .stats-row, .review-cards, .ag-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .agencia-card-link {
    flex-direction: column;
  }
  .agencia-photo-band {
    width: 100%;
    height: 90px;
  }
}

@media (max-width: 560px) {
  .stats-row, .review-cards, .ag-stats {
    grid-template-columns: 1fr;
  }
  .hero-a, .hero-ag {
    flex-direction: column;
    text-align: center;
  }
}

/* Header deixou de ser fixed no celular (ver App.vue) — não precisa mais
   do respiro de 120px pra não ficar embaixo dele. */
@media (max-width: 768px) {
  .perfil-publico-view {
    padding: 16px 16px 90px;
  }
}
</style>
