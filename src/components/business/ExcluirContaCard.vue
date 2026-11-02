<script setup>
import { ref } from 'vue'
import axios from '@/services/axios'
import { useAuth } from '@/composables/useAuth'

const { logout } = useAuth()

const confirmandoExclusao = ref(false)
const excluindoConta = ref(false)
const erroExclusao = ref('')

async function excluirConta() {
  excluindoConta.value = true
  erroExclusao.value = ''
  try {
    await axios.delete('/usuarios/me/')
    logout()
  } catch (e) {
    console.error('Erro ao excluir conta:', e)
    erroExclusao.value = 'Não conseguimos excluir sua conta agora. Tente novamente em instantes.'
    excluindoConta.value = false
  }
}
</script>

<template>
  <div class="card">
    <h2 class="card-titulo" style="margin-bottom: 6px;">Excluir conta</h2>
    <p class="card-desc">Remove sua conta business, a página da agência, avaliações e catálogo de programas permanentemente. Não dá pra desfazer.</p>

    <button v-if="!confirmandoExclusao" type="button" class="btn-excluir" @click="confirmandoExclusao = true">Excluir minha conta</button>

    <div v-else class="confirmar-exclusao">
      <p>Tem certeza? Isso apaga sua agência e todos os dados ligados a ela de vez.</p>
      <div class="confirmar-exclusao-acoes">
        <button type="button" class="btn-excluir" :disabled="excluindoConta" @click="excluirConta">{{ excluindoConta ? 'Excluindo...' : 'Sim, excluir minha conta' }}</button>
        <button type="button" class="btn-cancelar-exclusao" :disabled="excluindoConta" @click="confirmandoExclusao = false">Cancelar</button>
      </div>
      <p v-if="erroExclusao" class="erro-exclusao">{{ erroExclusao }}</p>
    </div>
  </div>
</template>

<style scoped src="./painelCard.css"></style>
<style scoped>
.btn-excluir {
  background: #fff; color: #b3261e; border: 1px solid #b3261e; padding: 9px 16px; border-radius: 10px;
  font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11.5px; letter-spacing: 0.05em; text-transform: uppercase;
  cursor: pointer; transition: background-color 150ms ease-out, color 150ms ease-out;
}
.btn-excluir:hover { background: #b3261e; color: #fff; }
.btn-excluir:disabled { opacity: 0.6; cursor: default; }

.confirmar-exclusao { background: #fff5f5; border: 1px solid rgba(179, 38, 30, 0.25); border-radius: 10px; padding: 14px 16px; max-width: 460px; }
.confirmar-exclusao p { margin: 0 0 12px; font-size: 0.82rem; color: #7f1d1d; line-height: 1.5; }
.confirmar-exclusao-acoes { display: flex; gap: 10px; flex-wrap: wrap; }
.btn-cancelar-exclusao {
  background: transparent; color: var(--gb-ink-soft); border: 1px solid var(--gb-purple-deep-16); padding: 9px 16px; border-radius: 10px;
  font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11.5px; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer;
}
.btn-cancelar-exclusao:disabled { opacity: 0.6; cursor: default; }
.erro-exclusao { margin: 10px 0 0 !important; color: #b3261e !important; }
</style>
