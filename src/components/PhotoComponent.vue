<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from '@/services/axios'

const props = defineProps({
  initialPreview: {
    type: String,
    default: ''
  },
  uploadUrl: {
    type: String,
    default: '/perfil/foto/'
  },
  fetchUrl: {
    type: String,
    default: '/usuarios/me/'
  }
})

const emit = defineEmits(['avatar-updated'])

const fotoPreview = ref(props.initialPreview || null)
const loading = ref(false)
const mensagem = ref('')
const imageError = ref(false)
const temporaryPreview = ref(null)

function getToken() {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
}

function normalizeAvatarUrl(data) {
  return data?.avatar_url || data?.foto_url || data?.photo_url || data?.avatar || ''
}

function revokeTemporaryPreview() {
  if (temporaryPreview.value) {
    URL.revokeObjectURL(temporaryPreview.value)
    temporaryPreview.value = null
  }
}

async function loadCurrentPhoto() {
  const token = getToken()
  if (!token) return

  try {
    const response = await axios.get(props.fetchUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const avatarUrl = normalizeAvatarUrl(response.data)
    if (avatarUrl) {
      imageError.value = false
      revokeTemporaryPreview()
      fotoPreview.value = avatarUrl
      emit('avatar-updated', avatarUrl)
    }
  } catch (err) {
    console.error('Erro ao buscar foto do usuário:', err)
  }
}

async function uploadFoto(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const token = getToken()
  if (!token) {
    mensagem.value = 'Você precisa estar logado!'
    return
  }

  revokeTemporaryPreview()
  temporaryPreview.value = URL.createObjectURL(file)
  fotoPreview.value = temporaryPreview.value
  imageError.value = false

  loading.value = true
  mensagem.value = ''

  const formData = new FormData()
  formData.append('foto', file)
  formData.append('avatar', file)

  const endpoints = [props.uploadUrl, '/usuarios/me/', '/api/usuarios/me/']

  try {
    let response = null
    let lastError = null

    for (const endpoint of endpoints) {
      try {
        response = await axios.patch(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        })
        break
      } catch (err) {
        lastError = err
        if (err.response?.status !== 404 && err.response?.status !== 405) {
          throw err
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Nenhum endpoint de upload respondeu')
    }

    const avatarUrl = normalizeAvatarUrl(response.data)
    if (avatarUrl) {
      imageError.value = false
      revokeTemporaryPreview()
      fotoPreview.value = avatarUrl
      emit('avatar-updated', avatarUrl)
      mensagem.value = '✅ Foto enviada com sucesso!'
    } else {
      mensagem.value = '✅ Foto selecionada com sucesso!'
    }
  } catch (err) {
    mensagem.value = '❌ Erro ao enviar foto. Verifique o endpoint do backend.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function handleImageError() {
  imageError.value = true
}

watch(() => props.initialPreview, (value) => {
  if (value) {
    imageError.value = false
    revokeTemporaryPreview()
    fotoPreview.value = value
  }
})

onMounted(() => {
  if (props.initialPreview) {
    fotoPreview.value = props.initialPreview
  }
  loadCurrentPhoto()
})
</script>

<template>
  <div class="photo-card">
    <label class="foto-container" :class="{ loading: loading }">
      <img
        v-if="fotoPreview && !imageError"
        :src="fotoPreview"
        alt=""
        class="foto-preview"
        @error="handleImageError"
      />

      <div v-else class="foto-placeholder">
        <span>Selecionar foto</span>
      </div>

      <div class="overlay">
        <span>{{ loading ? 'Enviando...' : 'Editar' }}</span>
      </div>

      <input
        type="file"
        accept="image/*"
        @change="uploadFoto"
        :disabled="loading"
        hidden
      />
    </label>

    <p v-if="mensagem" class="mensagem">{{ mensagem }}</p>
  </div>
</template>

<style scoped>
.photo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.foto-container {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #444                    ;
  background: #f3f4f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.foto-container .overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: white;
  font-size: 12px;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.foto-container:hover .overlay,
.foto-container:focus-within .overlay {
  opacity: 1;
}

.foto-container.loading {
  opacity: 0.8;
}

.foto-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #6b7280;
}

.mensagem {
  margin: 0;
  font-size: 12px;
  color: #374151;
  text-align: center;
}
</style>
