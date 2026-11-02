<script setup>
import { ref } from 'vue'
import axios from '@/services/axios'

// Upload/remoção vão direto pro backend (não esperam o "Publicar"), por
// isso não marcam a página como alterada.
const props = defineProps({
  agenciaId: { type: [Number, String], required: true }
})
const galeria = defineModel({ type: Array, required: true })
const emit = defineEmits(['erro'])

const enviandoGaleria = ref(false)

async function adicionarFotoGaleria(event) {
  const arquivo = event.target.files?.[0]
  if (!arquivo) return
  enviandoGaleria.value = true
  try {
    const formData = new FormData()
    formData.append('imagem', arquivo)
    const { data } = await axios.post(`/agencia/${props.agenciaId}/galeria/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    galeria.value = [...galeria.value, data]
  } catch (e) {
    console.error('Erro ao subir foto da galeria:', e)
    emit('erro', 'Não conseguimos subir essa foto agora.')
  } finally {
    enviandoGaleria.value = false
    event.target.value = ''
  }
}

async function removerFotoGaleria(id) {
  try {
    await axios.delete(`/agencia/${props.agenciaId}/galeria/${id}/`)
    galeria.value = galeria.value.filter((img) => img.id !== id)
  } catch (e) {
    console.error('Erro ao remover foto da galeria:', e)
  }
}
</script>

<template>
  <div class="bloco-conteudo">
    <div class="galeria-grid">
      <div v-for="img in galeria" :key="img.id" class="galeria-slot filled" :style="{ backgroundImage: `url(${img.url})` }">
        <button class="galeria-remover" @click="removerFotoGaleria(img.id)" aria-label="Remover esta foto da galeria">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
      </div>
      <label class="galeria-slot vazio">
        <input type="file" accept="image/*" @change="adicionarFotoGaleria" :disabled="enviandoGaleria" class="sr-only-input" aria-label="Adicionar foto à galeria">
        <svg v-if="!enviandoGaleria" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        <span v-else style="font-size: 0.7rem;">Enviando...</span>
      </label>
    </div>
    <p class="bloco-dica">Fotos da agência, do espaço ou dos alunos. Aparece em grade na página.</p>
  </div>
</template>

<style scoped src="./editorCampos.css"></style>
<style scoped>
.galeria-remover:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

.galeria-slot:focus-within {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

.galeria-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.galeria-slot { aspect-ratio: 1; border-radius: 6px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; position: relative; }
.galeria-slot.vazio { border: 1.5px dashed var(--gb-purple-deep-16); color: var(--gb-purple-deep-16); cursor: pointer; }
.galeria-slot.vazio:hover { border-color: var(--gb-magenta); color: var(--gb-magenta); }
.galeria-remover { position: absolute; top: 2px; right: 2px; width: 26px; height: 26px; border-radius: 6px; background: rgba(23, 17, 26, 0.7); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
</style>
