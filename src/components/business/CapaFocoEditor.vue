<script setup>
import { ref } from 'vue'
import axios from '@/services/axios'

const props = defineProps({
  agencia: { type: Object, required: true }
})
const focoX = defineModel('focoX', { type: Number, required: true })
const focoY = defineModel('focoY', { type: Number, required: true })
const emit = defineEmits(['alterado', 'capa-atualizada', 'erro'])

const enviandoCapa = ref(false)

function moverFoco(event, container) {
  const rect = container.getBoundingClientRect()
  const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
  const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100))
  focoX.value = Math.round(x)
  focoY.value = Math.round(y)
  emit('alterado')
}

function iniciarArrastoFoco(event) {
  const container = event.currentTarget
  moverFoco(event, container)
  const onMove = (e) => moverFoco(e, container)
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// Alternativa por teclado ao arrasto do ponto focal — sem isso, quem
// navega só com teclado não conseguia ajustar o foco de jeito nenhum.
// Setas movem 2%, Shift+seta move 10%.
function ajustarFocoTeclado(event) {
  const teclas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const direcao = teclas[event.key]
  if (!direcao) return
  event.preventDefault()
  const passo = event.shiftKey ? 10 : 2
  focoX.value = Math.min(100, Math.max(0, focoX.value + direcao[0] * passo))
  focoY.value = Math.min(100, Math.max(0, focoY.value + direcao[1] * passo))
  emit('alterado')
}

async function trocarCapa(event) {
  const arquivo = event.target.files?.[0]
  if (!arquivo) return
  enviandoCapa.value = true
  try {
    const formData = new FormData()
    formData.append('imagem_capa', arquivo)
    const { data } = await axios.patch(`/agencia/${props.agencia.id}/capa/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    emit('capa-atualizada', data)
  } catch (e) {
    console.error('Erro ao trocar imagem de capa:', e)
    emit('erro', 'Não conseguimos subir essa imagem agora.')
  } finally {
    enviandoCapa.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <div class="img-field">
    <span class="img-field-lbl">Imagem de capa</span>
    <div
      class="foco-preview"
      :style="agencia.imagem_capa_url ? { backgroundImage: `url(${agencia.imagem_capa_url})`, backgroundPosition: `${focoX}% ${focoY}%` } : {}"
      :tabindex="agencia.imagem_capa_url ? 0 : -1"
      role="group"
      :aria-label="agencia.imagem_capa_url ? `Ponto focal da imagem: ${focoX}% horizontal, ${focoY}% vertical. Use as setas do teclado pra ajustar.` : 'Envie uma imagem pra poder ajustar o ponto focal.'"
      @pointerdown="agencia.imagem_capa_url && iniciarArrastoFoco($event)"
      @keydown="agencia.imagem_capa_url && ajustarFocoTeclado($event)"
    >
      <span v-if="!agencia.imagem_capa_url" class="foco-vazio">Nenhuma imagem enviada ainda</span>
      <div v-else class="foco-ponto" :style="{ left: focoX + '%', top: focoY + '%' }" aria-hidden="true"></div>
    </div>
    <p v-if="agencia.imagem_capa_url" class="foco-dica">Arraste o ponto (ou use as setas do teclado, com o quadro focado) pra escolher o que fica visível quando a tela cortar a imagem.</p>
    <label class="dropzone">
      <input type="file" accept="image/*" @change="trocarCapa" :disabled="enviandoCapa" class="sr-only-input" aria-label="Enviar imagem de capa">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gb-magenta)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>
      <span>{{ enviandoCapa ? 'Enviando...' : (agencia.imagem_capa_url ? 'Trocar imagem' : 'Enviar imagem') }} — JPG ou PNG, até 5MB</span>
    </label>
  </div>
</template>

<style scoped src="./editorCampos.css"></style>
<style scoped>
.dropzone:focus-within {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

.foco-preview:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 3px;
}

.foco-preview {
  position: relative;
  width: 100%;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--gb-dark);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
  touch-action: none;
}
.foco-vazio { color: rgba(255,255,255,0.5); font-size: 0.75rem; }
.foco-ponto {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2.5px solid var(--gb-magenta);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.foco-dica { font-size: 11px; color: var(--gb-ink-soft); line-height: 1.4; }

.dropzone {
  border: 1.5px dashed var(--gb-purple-deep-16);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.dropzone:hover { border-color: var(--gb-magenta); }
.dropzone span { font-size: 11px; color: var(--gb-ink-soft); }
</style>
