/**
 * ============================================
 * CLOUDINARY SERVICE
 * ============================================
 * 
 * Centraliza toda lógica relacionada ao Cloudinary
 * Tenta usar o widget, com fallback para upload tradicional
 * 
 * CONFIGURAÇÃO NECESSÁRIA:
 * 1. Edite CLOUDINARY_CONFIG com suas credenciais
 * 2. Se widget não funcionar, usa upload via backend
 * ============================================
 */

import axios from './axios'

const CLOUDINARY_CONFIG = {
  cloudName: 'lpeamt9y',
  uploadPreset: 'uploadimgs',
}

let widgetLoaded = false
let loadingPromise = null

/**
 * Carrega o script do Cloudinary Upload Widget
 */
async function ensureCloudinaryLoaded() {
  if (widgetLoaded && window.cloudinary) {
    return true
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise((resolve) => {
    if (window.cloudinary) {
      widgetLoaded = true
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://upload-widget.cloudinary.com/latest/index.js'
    script.async = true

    let done = false

    const onLoadOrError = () => {
      if (!done) {
        done = true
        widgetLoaded = window.cloudinary !== undefined
        resolve(widgetLoaded)
        loadingPromise = null
      }
    }

    script.onload = onLoadOrError
    script.onerror = onLoadOrError

    // Timeout de 5 segundos
    setTimeout(onLoadOrError, 5000)

    document.head.appendChild(script)
  })

  return loadingPromise
}

/**
 * Abre o widget do Cloudinary
 * @param {Function} onSuccess - Callback quando upload for bem-sucedido
 * @param {Function} onError - Callback quando houver erro
 */
export function openCloudinaryWidget(onSuccess, onError) {
  if (!CLOUDINARY_CONFIG.cloudName || CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUD_NAME') {
    console.error('❌ Cloudinary não está configurado')
    console.log('Configure em: src/services/cloudinary.js')
    onError?.('Cloudinary não configurado')
    return
  }

  ensureCloudinaryLoaded().then((loaded) => {
    if (!loaded || !window.cloudinary) {
      console.log('⚠️  Widget Cloudinary não disponível. Usando upload tradicional.')
      fallbackToFileInput(onSuccess, onError)
      return
    }

    try {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CONFIG.cloudName,
          uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
          sources: ['local', 'url', 'camera'],
          maxFileSize: 10000000,
          clientAllowedFormats: ['image'],
          folder: 'avatars',
          maxFiles: 1,
          showAdvancedOptions: false,
          cropping: true,
          croppingAspectRatio: 1,
          croppingDefaultSelectionRatio: 1,
          multiple: false,
          defaultSource: 'local',
          showPoweredBy: false,
        },
        (error, result) => {
          if (error) {
            console.error('❌ Erro no upload Cloudinary:', error)
            onError?.(error.message)
            return
          }

          if (result.event === 'success') {
            const imageUrl = result.info.secure_url
            console.log('✅ Upload Cloudinary bem-sucedido')
            onSuccess?.(imageUrl)
          }
        }
      )

      widget.open()
    } catch (err) {
      console.error('❌ Erro ao criar widget:', err)
      fallbackToFileInput(onSuccess, onError)
    }
  })
}

/**
 * Fallback: Abre seletor de arquivo tradicional
 * Upload ocorre via backend
 */
function fallbackToFileInput(onSuccess, onError) {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'

  fileInput.onchange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadFileToBackend(file, onSuccess, onError)
    } catch (err) {
      onError?.(err.message || 'Erro ao fazer upload')
    }
  }

  fileInput.click()
}

/**
 * Upload tradicional via backend
 * Backend salva em Cloudinary Storage automaticamente
 */
export async function uploadFileToBackend(file, onSuccess, onError) {
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    formData.append('foto', file)

    const response = await axios.patch('/usuarios/me/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const avatarUrl = response.data?.avatar_url || response.data?.avatar || ''
    if (avatarUrl) {
      console.log('✅ Upload via backend bem-sucedido')
      onSuccess?.(avatarUrl)
    } else {
      onError?.('URL não retornada pelo backend')
    }
  } catch (err) {
    console.error('❌ Erro ao fazer upload:', err)
    onError?.(err.message || 'Erro ao fazer upload')
  }
}

export default {
  openCloudinaryWidget,
  uploadFileToBackend,
  ensureCloudinaryLoaded,
}
