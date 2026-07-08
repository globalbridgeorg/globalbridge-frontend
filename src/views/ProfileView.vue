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

const profileCards = ref([
  { title: 'informações do seu perfil', subtitle: 'dados pessoais da sua conta' },
  { title: 'segurança', subtitle: 'senha, autenticação e acesso' },
  { title: 'favoritos', subtitle: 'salve seus destinos preferidos' },
  { title: 'minhas avaliações', subtitle: 'conte suas experiências' },
  { title: 'preferências de intercâmbio', subtitle: 'configure seu perfil de estudo' }
])

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
    <div class="top-banner"></div>

    <div class="content">
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
          <div v-for="card in profileCards" :key="card.title" class="card">
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

.content {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
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
  font-size: 28px;
  font-weight: 600;
  color: #444;
}

.user-text p {
  margin: 4px 0 0;
  font-size: 18px;
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
  min-height: 50px;
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
  min-height: 50px;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.close-placeholder {
  padding: 0 16px;
  font-size: 18px;
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
