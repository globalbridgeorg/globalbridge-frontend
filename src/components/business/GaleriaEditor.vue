<script setup>
import { ref } from 'vue'
import { uploadFotoGaleria, removerFotoGaleria as removerFotoApi } from '@/services/api'

const props = defineProps({
  agenciaId: { type: [Number, String], required: true }
})
const galeria = defineModel({ type: Array, required: true })
const emit = defineEmits(['erro'])

const enviandoGaleria = ref(false)

async function adicionarFotoGaleria(event) {
  const arquivo = event.target.files?.[0]
  event.target.value = ''
  if (!arquivo) return
  if (!arquivo.type.startsWith('image/')) {
    emit('erro', 'Escolha um arquivo de imagem (JPG, PNG ou WebP).')
    return
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    emit('erro', 'Cada foto da galeria precisa ter no máximo 5 MB.')
    return
  }

  enviandoGaleria.value = true
  try {
    const data = await uploadFotoGaleria(props.agenciaId, arquivo, galeria.value.length)
    galeria.value = [...galeria.value, data]
  } catch (e) {
    console.error('Erro ao subir foto da galeria:', e)
    emit('erro', 'Não conseguimos subir essa foto agora.')
  } finally {
    enviandoGaleria.value = false
  }
}

async function removerFotoGaleria(img) {
  try {
    await removerFotoApi(img)
    galeria.value = galeria.value.filter((item) => item.id !== img.id)
  } catch (e) {
    console.error('Erro ao remover foto da galeria:', e)
    emit('erro', 'Não conseguimos remover essa foto agora.')
  }
}
</script>

<template>
  <div class="bloco-conteudo">
    <div class="galeria-grid">
      <div v-for="img in galeria" :key="img.id" class="galeria-slot filled" :style="{ backgroundImage: `url(${img.url})` }">
        <button type="button" class="galeria-remover" @click="removerFotoGaleria(img)" aria-label="Remover esta foto da galeria">
          <i class="fi fi-rr-cross-small" aria-hidden="true"></i>
        </button>
      </div>
      <label class="galeria-slot vazio">
        <input type="file" accept="image/*" @change="adicionarFotoGaleria" :disabled="enviandoGaleria" class="sr-only-input" aria-label="Adicionar foto à galeria">
        <i v-if="!enviandoGaleria" class="fi fi-rr-plus" aria-hidden="true"></i>
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
