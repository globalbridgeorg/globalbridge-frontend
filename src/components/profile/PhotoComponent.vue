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
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 8.5C4 7.67 4.67 7 5.5 7h2.4l1-1.6c.3-.5.85-.8 1.44-.8h3.32c.59 0 1.14.3 1.44.8l1 1.6h2.4c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-13C4.67 19 4 18.33 4 17.5v-9Z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
        <span>Adicionar foto</span>
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
  border: 1px solid var(--gb-purple-deep-16);
  background: var(--gb-cream);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.foto-container:hover {
  border-color: var(--gb-magenta);
  background: #fff;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--gb-ink-faint);
  transition: color 0.2s ease;
}

.foto-container:hover .foto-placeholder {
  color: var(--gb-magenta);
}

.foto-placeholder svg {
  width: 26px;
  height: 26px;
  stroke: currentColor;
}

.foto-placeholder span {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
}
</style>

