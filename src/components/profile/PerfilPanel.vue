<script setup>
import { ref, reactive, watch } from 'vue'
import { atualizarPerfil } from '@/services/api'

const props = defineProps({
  profile: { type: Object, required: true },
})
const emit = defineEmits(['nome-salvo'])

const editForm = reactive({ name: props.profile.name || '' })
const savingProfile = ref(false)
const profileSaved = ref(false)
const erroSalvar = ref('')

watch(() => props.profile.name, (novo) => {
  editForm.name = novo || ''
})

async function saveProfile() {
  erroSalvar.value = ''
  profileSaved.value = false
  const nomeLimpo = editForm.name.trim()
  if (!nomeLimpo) {
    erroSalvar.value = 'Informe seu nome completo.'
    return
  }

  savingProfile.value = true
  try {
    await atualizarPerfil(props.profile.id, { name: nomeLimpo })
    emit('nome-salvo', nomeLimpo)
    profileSaved.value = true
  } catch (err) {
    console.error('Erro ao salvar nome do perfil:', err)
    erroSalvar.value = 'Não foi possível salvar agora. Tente novamente.'
  } finally {
    savingProfile.value = false
  }
}
</script>

<template>
  <div class="panel">
    <h2>Dados pessoais</h2>
    <p class="panel-sub">Informações da sua conta e do seu perfil público</p>
    <div class="field-row">
      <div class="field">
        <label for="perfil-nome">Nome completo</label>
        <input id="perfil-nome" v-model="editForm.name" type="text" autocomplete="name" />
      </div>
      <div class="field">
        <label for="perfil-email">E-mail</label>
        <input id="perfil-email" :value="profile.email" type="email" disabled />
      </div>
      <div v-if="profile.username" class="field">
        <label for="perfil-username">Usuário público</label>
        <input id="perfil-username" :value="`@${profile.username}`" type="text" disabled />
      </div>
    </div>
    <p v-if="erroSalvar" class="erro-campo" role="alert">{{ erroSalvar }}</p>
    <div class="acoes-linha">
      <button type="button" class="btn-save" :disabled="savingProfile" @click="saveProfile">
        {{ savingProfile ? 'Salvando...' : 'Salvar alterações' }}
      </button>
      <span v-if="profileSaved" class="saved-flash">Perfil atualizado ✓</span>
    </div>
  </div>
</template>

<style scoped>
.erro-campo {
  margin: 0 0 12px;
  font-size: 12.5px;
  color: #b3261e;
  font-weight: 600;
}

.acoes-linha {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
