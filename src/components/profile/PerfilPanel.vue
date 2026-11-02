<script setup>
import { ref, reactive } from 'vue'
import axios from '@/services/axios'

const props = defineProps({
  profile: { type: Object, required: true }
})
const emit = defineEmits(['nome-salvo'])

// Nome é salvo de verdade; telefone/cidade/bio ainda não têm campo no backend.
const editForm = reactive({ name: props.profile.name, telefone: '', cidade: '', sobre: '' })
const savingProfile = ref(false)
const profileSaved = ref(false)

async function saveProfile() {
  savingProfile.value = true
  profileSaved.value = false
  try {
    await axios.patch(`/usuarios/${props.profile.id}/`, { name: editForm.name })
    emit('nome-salvo', editForm.name)
    profileSaved.value = true
  } catch (err) {
    console.error('Erro ao salvar nome do perfil:', err)
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
      <div class="field"><label for="perfil-nome">Nome completo</label><input id="perfil-nome" v-model="editForm.name" type="text" autocomplete="name" /></div>
      <div class="field"><label for="perfil-email">E-mail</label><input id="perfil-email" :value="profile.email" type="email" disabled /></div>
      <div class="field"><label for="perfil-telefone">Telefone</label><input id="perfil-telefone" v-model="editForm.telefone" type="tel" autocomplete="tel" placeholder="(11) 90000-0000" /></div>
      <div class="field"><label for="perfil-cidade">Cidade / Estado</label><input id="perfil-cidade" v-model="editForm.cidade" type="text" autocomplete="address-level2" placeholder="Sua cidade" /></div>
    </div>
    <div class="field" style="margin-bottom:16px;">
      <label for="perfil-sobre">Sobre você</label>
      <textarea id="perfil-sobre" v-model="editForm.sobre" rows="3" placeholder="Conte um pouco sobre seus planos de intercâmbio..."></textarea>
    </div>
    <button class="btn-save" :disabled="savingProfile" @click="saveProfile">{{ savingProfile ? 'Salvando...' : 'Salvar alterações' }}</button>
    <span v-if="profileSaved" class="saved-flash">Perfil atualizado ✓</span>
  </div>
</template>
