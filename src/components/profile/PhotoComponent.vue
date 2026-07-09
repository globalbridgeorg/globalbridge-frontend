<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from '@/services/axios'
import { openCloudinaryWidget } from '@/services/cloudinary'

const props = defineProps({
  initialPreview: {
    type: String,
    default: ''
  },
  fetchUrl: {
    type: String,
    default: '/usuarios/me/'
  }
})

const emit = defineEmits(['avatar-updated'])

const fotoPreview = ref(props.initialPreview || null)
const loading = ref(false)
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

async function saveAvatarToBackend(imageUrl) {
  const token = getToken()
  if (!token) return

  try {
    loading.value = true

    const response = await axios.patch(
      '/usuarios/me/avatar/',
      { avatar_url: imageUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )

    const avatarUrl = normalizeAvatarUrl(response.data)

    if (avatarUrl) {
      imageError.value = false
      revokeTemporaryPreview()
      fotoPreview.value = avatarUrl
      emit('avatar-updated', avatarUrl)
    }
  } catch (err) {
    console.error('Erro ao salvar foto no backend:', err)
  } finally {
    loading.value = false
  }
}

function handleImageError() {
  imageError.value = true
}

function openPhotoUpload() {
  loading.value = true

  openCloudinaryWidget(
    (imageUrl) => {
      loading.value = false
      revokeTemporaryPreview()

      fotoPreview.value = imageUrl
      saveAvatarToBackend(imageUrl)
    },
    (error) => {
      loading.value = false
      console.error("Erro no upload:", error)
    }
  )
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
    <button @click="openPhotoUpload" class="foto-container" :class="{ loading: loading }" type="button">
      <img
        v-if="fotoPreview && !imageError"
        :src="fotoPreview"
        alt="Avatar do usuário"
        class="foto-preview"
        @error="handleImageError"
      />

      <div v-else class="foto-placeholder">
        <span>Selecionar foto</span>
      </div>

      <div class="overlay">
        <span>{{ loading ? 'Enviando...' : 'Editar' }}</span>
      </div>
    </button>
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
  border: 1px solid #444;
  background: #f3f4f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  transition: opacity 0.2s ease;
}

.foto-container:hover {
  opacity: 0.9;
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
</style>

