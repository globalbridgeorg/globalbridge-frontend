<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/services/axios'

const fotoPreview = ref(null)
const loading = ref(false)
const mensagem = ref('')

function getToken() {
  return localStorage.getItem('access_token') 
    || sessionStorage.getItem('access_token')
}

// Busca os dados do usuário ao carregar a página
onMounted(async () => {
  const token = getToken()
  if (!token) return

  try {
    const response = await axios.get('/usuarios/me/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    // Se o usuário já tem foto, exibe ela
    if (response.data.foto_url) {
  fotoPreview.value = response.data.foto_url
}

  } catch (err) {
    console.error('Erro ao buscar usuário:', err)
  }
})

async function uploadFoto(event) {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('foto', file)

  const token = getToken()
  if (!token) {
    mensagem.value = 'Você precisa estar logado!'
    return
  }

  loading.value = true

  try {
    const response = await axios.patch(
      `${API_URL}/perfil/foto/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    )

    // Usa a URL real que o backend retornou
    fotoPreview.value = response.data.foto_url
    mensagem.value = '✅ Foto enviada com sucesso!'

  } catch (err) {
    mensagem.value = '❌ Erro ao enviar foto'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="container">
    <h1>Teste Upload de Foto</h1>

    <div class="foto-container">
      <img 
        v-if="fotoPreview" 
        :src="fotoPreview" 
        alt="Preview"
        class="foto-preview"
      />
      <div v-else class="foto-placeholder">
        📷
      </div>
    </div>

    <label class="btn-upload">
      {{ loading ? 'Enviando...' : 'Escolher Foto' }}
      <input 
        type="file" 
        accept="image/*" 
        @change="uploadFoto"
        :disabled="loading"
        hidden
      />
    </label>

    <p v-if="mensagem" class="mensagem">{{ mensagem }}</p>
  </main>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  font-family: Arial, sans-serif;
}

h1 {
  margin-bottom: 30px;
}

.foto-container {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 20px;
  border: 3px solid #4F46E5;
}

.foto-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-placeholder {
  width: 100%;
  height: 100%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
}

.btn-upload {
  background: #4F46E5;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-upload:hover {
  opacity: 0.9;
}

.mensagem {
  margin-top: 20px;
  font-size: 16px;
}
</style>