<script setup>
import { ref } from 'vue'
import { atualizarSenha, excluirMinhaConta } from '@/services/api'
import { useAuth } from '@/composables/useAuth'

const { logout } = useAuth()

const novaSenha = ref('')
const confirmarSenha = ref('')
const salvandoSenha = ref(false)
const pwSaved = ref(false)
const erroSenha = ref('')

const confirmandoExclusao = ref(false)
const excluindoConta = ref(false)
const erroExclusao = ref('')

async function salvarNovaSenha() {
  erroSenha.value = ''
  pwSaved.value = false

  if (novaSenha.value.length < 8) {
    erroSenha.value = 'A nova senha precisa ter no mínimo 8 caracteres.'
    return
  }
  if (novaSenha.value !== confirmarSenha.value) {
    erroSenha.value = 'As senhas não coincidem.'
    return
  }

  salvandoSenha.value = true
  try {
    await atualizarSenha(novaSenha.value)
    novaSenha.value = ''
    confirmarSenha.value = ''
    pwSaved.value = true
  } catch (e) {
    console.error('Erro ao atualizar senha:', e)
    erroSenha.value = 'Não foi possível atualizar a senha agora. Tente novamente.'
  } finally {
    salvandoSenha.value = false
  }
}

async function excluirConta() {
  excluindoConta.value = true
  erroExclusao.value = ''
  try {
    await excluirMinhaConta()
    await logout()
  } catch (e) {
    console.error('Erro ao excluir conta:', e)
    erroExclusao.value = 'Não conseguimos excluir sua conta agora. Tente novamente em instantes.'
    excluindoConta.value = false
  }
}
</script>

<template>
  <div class="panel">
    <h2>Segurança</h2>
    <p class="panel-sub">Alteração de senha e gerenciamento definitivo da conta</p>

    <div class="field-row">
      <div class="field">
        <label for="seg-senha-nova">Nova senha</label>
        <input id="seg-senha-nova" v-model="novaSenha" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres" />
      </div>
      <div class="field">
        <label for="seg-senha-confirmar">Confirmar nova senha</label>
        <input id="seg-senha-confirmar" v-model="confirmarSenha" type="password" autocomplete="new-password" placeholder="Digite novamente" @keyup.enter="salvarNovaSenha" />
      </div>
    </div>

    <p v-if="erroSenha" class="erro-senha" role="alert">{{ erroSenha }}</p>

    <div class="acoes-linha">
      <button type="button" class="btn-save" :disabled="salvandoSenha" @click="salvarNovaSenha">
        {{ salvandoSenha ? 'Atualizando...' : 'Atualizar senha' }}
      </button>
      <span v-if="pwSaved" class="saved-flash">Senha atualizada ✓</span>
    </div>

    <div class="danger-zone">
      <div class="danger-zone-head">
        <div class="toggle-label">Excluir conta</div>
        <div class="toggle-sub">Remove seu perfil, favoritos e avaliações permanentemente. Não dá pra desfazer.</div>
      </div>

      <button v-if="!confirmandoExclusao" type="button" class="btn-excluir" @click="confirmandoExclusao = true">Excluir minha conta</button>

      <div v-else class="confirmar-exclusao">
        <p>Tem certeza? Isso apaga sua conta e todos os seus dados de vez.</p>
        <div class="confirmar-exclusao-acoes">
          <button type="button" class="btn-excluir" :disabled="excluindoConta" @click="excluirConta">{{ excluindoConta ? 'Excluindo...' : 'Sim, excluir minha conta' }}</button>
          <button type="button" class="btn-cancelar-exclusao" :disabled="excluindoConta" @click="confirmandoExclusao = false">Cancelar</button>
        </div>
        <p v-if="erroExclusao" class="erro-exclusao">{{ erroExclusao }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.erro-senha {
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

.danger-zone {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--gb-purple-deep-16);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.danger-zone-head {
  max-width: 420px;
}

.btn-excluir {
  background: #fff;
  color: #b3261e;
  border: 1px solid #b3261e;
  padding: 9px 16px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 150ms ease-out, color 150ms ease-out;
}

.btn-excluir:hover {
  background: #b3261e;
  color: #fff;
}

.btn-excluir:disabled {
  opacity: 0.6;
  cursor: default;
}

.confirmar-exclusao {
  background: #fff5f5;
  border: 1px solid rgba(179, 38, 30, 0.25);
  border-radius: 10px;
  padding: 14px 16px;
  max-width: 420px;
}

.confirmar-exclusao p {
  margin: 0 0 12px;
  font-size: 12.5px;
  color: #7f1d1d;
  line-height: 1.5;
}

.confirmar-exclusao-acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-cancelar-exclusao {
  background: transparent;
  color: var(--gb-ink-soft);
  border: 1px solid var(--gb-purple-deep-16);
  padding: 9px 16px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-cancelar-exclusao:disabled {
  opacity: 0.6;
  cursor: default;
}

.erro-exclusao {
  margin: 10px 0 0 !important;
  color: #b3261e !important;
}
</style>
