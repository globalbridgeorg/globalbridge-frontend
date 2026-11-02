<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'
import PhotoComponent from '@/components/profile/PhotoComponent.vue'
import NotificationBanner from '@/components/profile/NotificationBanner.vue'
import ProfileSideNav from '@/components/profile/ProfileSideNav.vue'
import PerfilPanel from '@/components/profile/PerfilPanel.vue'
import SegurancaPanel from '@/components/profile/SegurancaPanel.vue'
import FavoritosPanel from '@/components/profile/FavoritosPanel.vue'
import PreferenciasPanel from '@/components/profile/PreferenciasPanel.vue'
import ContaDetalhes from '@/components/profile/ContaDetalhes.vue'
import { useAuth } from '@/composables/useAuth'
import { useFavoritos } from '@/composables/useFavoritos'
import { useTrocaAnimada } from '@/composables/useTrocaAnimada'

const router = useRouter()
const { logout } = useAuth()
const { favoritos } = useFavoritos()
const loading = ref(true)
const error = ref('')
const profile = ref({ id: null, name: '', email: '', avatar_url: '' })

const section = ref('perfil')
const sidebarItems = [
  { key: 'perfil', label: 'Perfil', image: '/images/profile_perfil.png' },
  { key: 'seguranca', label: 'Segurança', image: '/images/profile_secure.png' },
  { key: 'favoritos', label: 'Favoritos', image: '/images/profile_favorite.png' },
  { key: 'avaliacoes', label: 'Avaliações', image: '/images/profile_saved.png' },
  { key: 'preferencias', label: 'Preferências', image: '/images/profile_settings.png' }
]

// Avaliações: o backend só tem avaliação de agência hoje — isto aqui é só demonstrativo.
const reviews = [
  { country: 'Irlanda · Dublin', date: 'publicada há 3 meses', rating: 4, text: 'Cidade acolhedora e universidade muito organizada com estudantes internacionais.' }
]
// Preferências ficam aqui (e não só no painel) porque aparecem no menu lateral.
const idioma = ref('Inglês')
const programa = ref('Intercâmbio acadêmico')

const sidebarMeta = computed(() => ({
  perfil: 'Dados pessoais',
  seguranca: 'Senha e sessões',
  favoritos: favoritos.length + ' destino' + (favoritos.length === 1 ? '' : 's') + ' salvo' + (favoritos.length === 1 ? '' : 's'),
  avaliacoes: reviews.length + ' publicada' + (reviews.length === 1 ? '' : 's'),
  preferencias: (idioma.value || 'Sem idioma') + ' · ' + (programa.value || 'sem programa')
}))

const panelShell = ref(null)
const selectSection = useTrocaAnimada(panelShell, section)

// Busca sempre de novo ao abrir o perfil (o useFavoritos guarda cache entre telas).
const favoritesLoading = ref(true)
async function fetchFavorites() {
  favoritesLoading.value = true
  try {
    const { data } = await axios.get('/favoritos/')
    favoritos.splice(0, favoritos.length, ...data)
  } catch (e) {
    console.error('Erro ao buscar favoritos:', e)
  } finally {
    favoritesLoading.value = false
  }
}

const showWelcome = ref(false)

async function fetchProfile() {
  if (!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'))) {
    router.push({ name: 'login' })
    return
  }
  try {
    const data = (await axios.get('/usuarios/me/')).data || {}
    profile.value.id = data.id ?? null
    profile.value.name = data.name || data.full_name || ''
    profile.value.email = data.email || ''
    profile.value.avatar_url = data.avatar_url || data.avatar || data.photo_url || ''
  } catch (err) {
    if (err.response?.status === 401) {
      router.push({ name: 'login' })
      return
    }
    error.value = 'Não foi possível carregar seu perfil. Tente novamente mais tarde.'
    console.error('Profile fetch error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
  fetchFavorites()
  try {
    if (!sessionStorage.getItem('seenProfileWelcome')) {
      showWelcome.value = true
      sessionStorage.setItem('seenProfileWelcome', '1')
    }
  } catch (e) {
    // sessionStorage pode falhar em alguns ambientes; falhar silenciosamente
  }
})
</script>

<template>
  <div class="profile-page">
    <div class="top-banner"><span>Minha conta</span></div>

    <div class="content gb-section">
      <div v-if="loading" class="loading-state">Carregando perfil...</div>

      <template v-else>
        <div v-if="error" class="profile-error">{{ error }}</div>

        <div class="profile-header">
          <PhotoComponent
            :initial-preview="profile.avatar_url"
            @avatar-updated="(url) => (profile.avatar_url = url)"
          />
          <div class="who">
            <h1>{{ profile.name || 'Usuário' }}</h1>
            <p>{{ profile.email || 'email@exemplo.com' }}</p>
          </div>
        </div>

        <NotificationBanner
          v-if="showWelcome"
          message="Bem-vindo ao seu painel de perfil."
          @close="showWelcome = false"
        />

        <div class="layout">
          <ProfileSideNav :items="sidebarItems" :meta="sidebarMeta" :section="section" @select="selectSection" @logout="logout" />

          <div>
            <div class="panel-shell" ref="panelShell">
              <!-- KeepAlive: o que foi digitado/alternado num painel continua lá ao voltar pra ele. -->
              <KeepAlive>
                <PerfilPanel v-if="section === 'perfil'" :profile="profile" @nome-salvo="(nome) => (profile.name = nome)" />
                <SegurancaPanel v-else-if="section === 'seguranca'" />
                <FavoritosPanel v-else-if="section === 'favoritos'" :loading="favoritesLoading" />
                <div v-else-if="section === 'avaliacoes'" class="panel">
                  <h2>Avaliações</h2>
                  <p class="panel-sub">Experiências que você compartilhou com outros estudantes</p>
                  <div v-for="(rev, i) in reviews" :key="i" class="review-item">
                    <div class="review-top"><span class="review-country">{{ rev.country }}</span><span class="review-date">{{ rev.date }}</span></div>
                    <div class="review-stars" role="img" :aria-label="`${rev.rating} de 5 estrelas`">
                      <svg v-for="n in 5" :key="n" viewBox="0 0 24 24" :class="{ empty: n > rev.rating }" aria-hidden="true"><path d="M12 17.3l-5.3 3 1.4-6-4.6-4 6-.5L12 4l2.5 5.8 6 .5-4.6 4 1.4 6z"/></svg>
                    </div>
                    <p class="review-text">{{ rev.text }}</p>
                  </div>
                  <p v-if="!reviews.length" class="panel-empty">Você ainda não escreveu nenhuma avaliação.</p>
                  <button class="cta-write">Escrever nova avaliação</button>
                </div>
                <PreferenciasPanel v-else-if="section === 'preferencias'" v-model:idioma="idioma" v-model:programa="programa" />
              </KeepAlive>
            </div>
          </div>
        </div>

        <ContaDetalhes :email="profile.email" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: white;
}

.top-banner {
  width: 100%;
  height: 190px;
  background: linear-gradient(120deg, var(--gb-purple-deep) 0%, var(--gb-dark) 100%);
  display: flex;
  align-items: flex-end;
  padding: 0 5%;
}

.top-banner span {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  padding-bottom: 16px;
}

.content {
  padding: 32px 24px 90px;
}

.loading-state,
.profile-error {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 10px;
  background: #fff4f4;
  color: #7f1d1d;
  font-weight: 600;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}
.who p {
  margin: 0;
  font-size: 13px;
  color: var(--gb-ink-soft);
}

.layout {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 24px;
  margin-top: 12px;
  align-items: start;
  padding-bottom: 40px;
}

@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.panel-shell {
  transition: height 0.28s ease;
}

.panel-shell.resizing {
  overflow: hidden;
}

/* Base dos painéis (cards, campos, botão salvar, toggles) — usada pelos painéis filhos em components/profile. */
:deep(.panel) {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 26px 28px;
}

:deep(.panel h2),
:deep(.panel h3) {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 17px;
  color: var(--gb-dark);
  margin: 0 0 4px;
}

:deep(.panel .panel-sub) {
  font-size: 12.5px;
  color: var(--gb-ink-soft);
  margin: 0 0 20px;
}

:deep(.panel-empty) {
  font-size: 13px;
  color: var(--gb-ink-faint);
}

:deep(.field-row) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 560px) {
  :deep(.field-row) {
    grid-template-columns: 1fr;
  }
}

:deep(.field label) {
  display: block;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  margin-bottom: 6px;
}

:deep(.field input),
:deep(.field textarea) {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 9px;
  font-size: 13.5px;
  font-family: var(--gb-font-display);
  color: var(--gb-dark);
  background: #fff;
}

:deep(.field input:disabled) {
  background: #f5f3ef;
  color: var(--gb-ink-faint);
}

:deep(.field input:focus),
:deep(.field textarea:focus) {
  outline: none;
  border-color: var(--gb-magenta);
  box-shadow: 0 0 0 3px rgba(176, 31, 176, 0.12);
}

:deep(.btn-save) {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

:deep(.btn-save:hover) {
  background: var(--gb-magenta);
}

:deep(.btn-save:disabled) {
  opacity: 0.6;
  cursor: default;
}

:deep(.saved-flash) {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  color: var(--gb-green);
  margin-left: 12px;
}

:deep(.toggle-row) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 420px;
  padding: 10px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

:deep(.toggle-row:first-of-type) {
  border-top: none;
}

:deep(.toggle-label) {
  font-size: 13px;
  color: var(--gb-dark);
}

:deep(.toggle-sub) {
  font-size: 11px;
  color: var(--gb-ink-faint);
}

:deep(.toggle-sw) {
  width: 38px;
  height: 22px;
  border-radius: 20px;
  background: var(--gb-purple-deep-16);
  position: relative;
  cursor: pointer;
  border: none;
  padding: 0;
  flex-shrink: 0;
}

:deep(.toggle-sw::after) {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}

:deep(.toggle-sw.on) {
  background: var(--gb-green);
}

:deep(.toggle-sw.on::after) {
  transform: translateX(16px);
}

.review-item {
  padding: 14px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.review-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.review-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.review-country {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.review-date {
  font-size: 11px;
  color: var(--gb-ink-faint);
}

.review-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 6px;
}

.review-stars svg {
  width: 14px;
  height: 14px;
  fill: var(--gb-orange);
  stroke: var(--gb-orange);
}

.review-stars svg.empty {
  fill: none;
  stroke: var(--gb-purple-deep-16);
}

.review-text {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--gb-ink-soft);
  margin: 0;
}

.cta-write {
  margin-top: 16px;
  background: transparent;
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
  padding: 9px 18px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.cta-write:hover {
  background: rgba(46, 10, 46, 0.05);
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel-shell {
    transition: none;
  }
}
</style>
