<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'
import PhotoComponent from '@/components/PhotoComponent.vue'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const profile = ref({
  name: '',
  email: '',
  username: '',
  avatar_url: '',
  bio: ''
})

// Itens da sidebar "Meu perfil"
const sidebarItems = ref([
  { key: 'perfil', label: 'Perfil', icon: 'user' },
  { key: 'seguranca', label: 'Segurança', icon: 'shield' },
  { key: 'favoritos', label: 'Favoritos', icon: 'bookmark' },
  { key: 'avaliacoes', label: 'Avaliações', icon: 'star' },
  { key: 'preferencias', label: 'Preferências', icon: 'settings' }
])

const activeSection = ref('perfil')

const profileCards = ref([
  { key: 'perfil', title: 'informações do seu perfil', subtitle: 'dados pessoais da sua conta' },
  { key: 'seguranca', title: 'segurança', subtitle: 'senha, autenticação e acesso' },
  { key: 'favoritos', title: 'favoritos', subtitle: 'salve seus destinos preferidos' },
  { key: 'avaliacoes', title: 'minhas avaliações', subtitle: 'conte suas experiências' },
  { key: 'preferencias', title: 'preferências de intercâmbio', subtitle: 'configure seu perfil de estudo' }
])

const selectSection = (key) => {
  activeSection.value = key
}

const getAuthToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
}

const fetchProfile = async () => {
  const token = getAuthToken()
  if (!token) {
    router.push({ name: 'login' })
    return
  }

  const profileEndpoints = ['/usuarios/me/', '/api/usuarios/me/', '/me/', '/profile/']
  let response = null

  try {
    for (const endpoint of profileEndpoints) {
      try {
        response = await axios.get(endpoint)
        break
      } catch (err) {
        if (err.response?.status !== 404) {
          throw err
        }
      }
    }

    if (!response) {
      throw new Error('Profile endpoint not found')
    }

    const data = response.data || {}
    profile.value.name = data.name || data.full_name || ''
    profile.value.email = data.email || ''
    profile.value.username = data.username || data.user_name || ''
    profile.value.avatar_url = data.avatar_url || data.avatar || data.photo_url || ''
    profile.value.bio = data.bio || data.description || ''
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

onMounted(fetchProfile)
</script>

<template>
  <div class="profile-page">
    <!-- Banner roxo no topo -->
    <div class="top-banner"></div>

    <div class="page-body">
      <!-- Sidebar "Meu perfil" -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="hamburger">☰</span>
          <span>Meu perfil</span>
        </div>

        <nav class="sidebar-nav">
          <button
            v-for="item in sidebarItems"
            :key="item.key"
            class="sidebar-item"
            :class="{ active: activeSection === item.key }"
            @click="selectSection(item.key)"
          >
            <span class="sidebar-icon-placeholder"></span>
            <span class="sidebar-label">{{ item.label }}</span>
            <span class="sidebar-chevron">›</span>
          </button>
        </nav>
      </aside>

      <!-- Conteúdo principal -->
      <div class="content-area">
        <div v-if="loading" class="loading-state">Carregando perfil...</div>
        <div v-else>
          <div v-if="error" class="profile-error">{{ error }}</div>

          <div class="user-info">
            <PhotoComponent
              :initial-preview="profile.avatar_url"
              @avatar-updated="(url) => profile.avatar_url = url"
            />

            <div class="user-text">
              <h2>{{ profile.name || 'Usuário' }}</h2>
              <p>{{ profile.email || 'email@exemplo.com' }}</p>
              <p v-if="profile.username" class="user-handle">@{{ profile.username }}</p>
              <p v-if="profile.bio" class="user-bio">{{ profile.bio }}</p>
            </div>
          </div>

          <div class="notification-banner">
            <div class="notification-indicator"></div>
            <div class="notification-content">
              <p>Bem-vindo ao seu painel de perfil.</p>
            </div>
            <div class="close-placeholder">✕</div>
          </div>

          <div class="cards-grid">
            <div
              v-for="card in profileCards"
              :key="card.title"
              class="card"
              :class="{ active: activeSection === card.key }"
              @click="selectSection(card.key)"
            >
              <div class="icon-placeholder"></div>
              <div class="card-text">
                <h3>{{ card.title }}</h3>
                <p>{{ card.subtitle }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f4f1eb;
}

.top-banner {
  width: 100%;
  height: 145px;
  background: #43256f;
}

.page-body {
  display: flex;
}

/* Sidebar */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #f4f1eb;
  padding: 24px 12px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 600;
  color: #333;
  padding: 8px 10px 20px;
}

.hamburger {
  font-size: 18px;
  line-height: 1;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 10px;
  border-radius: 8px;
  font-size: 15px;
  color: #444;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.sidebar-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.sidebar-item.active {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  color: #43256f;
  font-weight: 600;
}

.sidebar-icon-placeholder {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 4px;
  background: #bdbdbd;
}

.sidebar-label {
  flex: 1;
}

.sidebar-chevron {
  color: #999;
  font-size: 16px;
}

/* Conteúdo */
.content-area {
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
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

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.user-text h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #444;
}

.user-text p {
  margin: 4px 0 0;
  font-size: 15px;
  color: #777;
}

.user-handle {
  color: #6b7280;
}

.user-bio {
  max-width: 560px;
}

.notification-banner {
  display: flex;
  align-items: center;
  min-height: 46px;
  margin-bottom: 30px;
  background: #f7f4ee;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.notification-indicator {
  width: 5px;
  align-self: stretch;
  background: #e34b57;
}

.notification-content {
  flex: 1;
  min-height: 46px;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.close-placeholder {
  padding: 0 16px;
  font-size: 16px;
  color: #b0b0b0;
  cursor: pointer;
  user-select: none;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.card {
  min-height: 110px;
  padding: 18px;
  background: #f7f4ee;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.card.active {
  outline: 2px solid #43256f;
}

.icon-placeholder {
  width: 22px;
  height: 22px;
  margin-bottom: 14px;
  border-radius: 4px;
  background: #bdbdbd;
}

.card-text h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #222;
}

.card-text p {
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}

@media (max-width: 900px) {
  .cards-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .page-body {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 6px;
  }

  .sidebar-item {
    white-space: nowrap;
  }

  .sidebar-chevron {
    display: none;
  }
}

@media (max-width: 640px) {
  .user-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>