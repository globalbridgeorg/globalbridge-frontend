<script setup>
import { ref } from 'vue'
import axios from '@/services/axios'
import { useAuth } from '@/composables/useAuth'

const { logout } = useAuth()

// Sem endpoint de senha/sessões ainda — fica só na tela.
const pwSaved = ref(false)
const twoFa = ref(false)

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
  <div class="panel">
    <h2>Segurança</h2>
    <p class="panel-sub">Senha, autenticação e dispositivos conectados</p>
    <div class="field" style="margin-bottom:14px; max-width:360px;"><label for="seg-senha-atual">Senha atual</label><input id="seg-senha-atual" type="password" autocomplete="current-password" placeholder="••••••••" /></div>
    <div class="field-row">
      <div class="field"><label for="seg-senha-nova">Nova senha</label><input id="seg-senha-nova" type="password" autocomplete="new-password" placeholder="Crie uma nova senha" /></div>
      <div class="field"><label for="seg-senha-confirmar">Confirmar nova senha</label><input id="seg-senha-confirmar" type="password" autocomplete="new-password" placeholder="Digite novamente" /></div>
    </div>
    <button class="btn-save" @click="pwSaved = true">Atualizar senha</button>
    <span v-if="pwSaved" class="saved-flash">Senha atualizada ✓</span>

    <div class="toggle-row" style="margin-top:20px;">
      <div><div class="toggle-label">Verificação em duas etapas</div><div class="toggle-sub">Adiciona uma etapa de confirmação por e-mail no login</div></div>
      <button class="toggle-sw" :class="{ on: twoFa }" :aria-pressed="twoFa" aria-label="Verificação em duas etapas" @click="twoFa = !twoFa"></button>
    </div>

    <div class="session-row" style="margin-top:8px;">
      <div><div class="session-device">Este dispositivo</div><div class="session-meta">Sessão atual</div></div>
      <span class="session-tag">Atual</span>
    </div>
    <div class="session-row">
      <div><div class="session-device">iPhone 13 · Safari</div><div class="session-meta">há 2 dias</div></div>
      <button class="link-danger">Encerrar</button>
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
.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.session-row:first-of-type {
  border-top: none;
}

.session-device {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.session-meta {
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.session-tag {
  font-size: 10px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gb-green);
  background: rgba(61, 154, 75, 0.12);
  padding: 3px 9px;
  border-radius: var(--gb-radius-pill);
}

.link-danger {
  background: none;
  border: none;
  color: #b3261e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
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
