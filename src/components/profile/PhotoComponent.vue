<script setup>
import { ref, watch } from 'vue'
import { uploadAvatar } from '@/services/api'

const props = defineProps({
  initialPreview: { type: String, default: '' },
  userId: { type: String, default: '' },
})

const emit = defineEmits(['avatar-updated'])

const fileInput = ref(null)
const fotoPreview = ref(props.initialPreview || null)
const loading = ref(false)
const imageError = ref(false)
const erroUpload = ref('')

function abrirSeletor() {
  if (loading.value) return
  erroUpload.value = ''
  fileInput.value?.click()
}

async function aoEscolherArquivo(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !props.userId) return

  if (!file.type.startsWith('image/')) {
    erroUpload.value = 'Escolha uma imagem (JPG, PNG ou WebP).'
    return
  }
  if (file.size > 3 * 1024 * 1024) {
    erroUpload.value = 'A foto precisa ter no máximo 3 MB.'
    return
  }

  loading.value = true
  erroUpload.value = ''
  try {
    const avatarUrl = await uploadAvatar(props.userId, file)
    imageError.value = false
    fotoPreview.value = avatarUrl
    emit('avatar-updated', avatarUrl)
  } catch (err) {
    console.error('Erro ao enviar avatar:', err)
    erroUpload.value = 'Não conseguimos salvar sua foto agora.'
  } finally {
    loading.value = false
  }
}

watch(() => props.initialPreview, (value) => {
  imageError.value = false
  fotoPreview.value = value || null
})
</script>

<template>
  <div class="photo-card">
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      aria-label="Selecionar foto de perfil"
      class="sr-only-input"
      @change="aoEscolherArquivo"
    />
    <button
      type="button"
      class="foto-container"
      :class="{ loading }"
      :disabled="loading"
      aria-label="Alterar foto de perfil"
      @click="abrirSeletor"
    >
      <img
        v-if="fotoPreview && !imageError"
        :src="fotoPreview"
        alt="Avatar do usuário"
        class="foto-preview"
        @error="imageError = true"
      />

      <div v-else class="foto-placeholder">
        <i class="fi fi-rr-camera" aria-hidden="true"></i>
        <span>Adicionar foto</span>
      </div>

      <div class="overlay">
        <span>{{ loading ? 'Enviando...' : 'Editar' }}</span>
      </div>
    </button>
    <p v-if="erroUpload" class="erro-upload" role="alert">{{ erroUpload }}</p>
  </div>
</template>

<style scoped>
.sr-only-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.erro-upload {
  margin: 0;
  font-size: 11.5px;
  color: #b3261e;
  font-weight: 600;
  text-align: center;
  max-width: 160px;
}

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

.foto-placeholder .fi {
  font-size: 24px;
  color: currentColor;
}

.foto-placeholder span {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
}
</style>

