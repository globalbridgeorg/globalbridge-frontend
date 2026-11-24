<script setup>
import { useAuth } from '@/composables/useAuth'

defineProps({
  agencia: { type: Object, required: true },
  alterado: { type: Boolean, default: false },
  salvo: { type: Boolean, default: false },
  salvando: { type: Boolean, default: false }
})
defineEmits(['publicar'])

const { logout } = useAuth()
</script>

<template>
  <div class="topbar">
    <div class="topbar-info">
      <router-link :to="{ name: 'business' }" class="link-voltar-painel">← Painel</router-link>
      <span class="divisor" aria-hidden="true"></span>
      <h1 class="titulo-editando">Editor da página · <strong>{{ agencia.nome }}</strong></h1>
    </div>
    <div class="topbar-actions">
      <span v-if="alterado" class="msg-pendente">Alterações não publicadas</span>
      <router-link :to="{ name: 'agencia', params: { id: agencia.id } }" target="_blank" rel="noopener noreferrer" class="link-ver-pagina">Ver página pública</router-link>
      <button type="button" class="link-sair" @click="logout">Sair da conta</button>
      <span aria-live="polite">
        <Transition name="toast">
          <span v-if="salvo" class="msg-salvo">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
            Publicado!
          </span>
        </Transition>
      </span>
      <button type="button" class="btn-publicar" :disabled="salvando" @click="$emit('publicar')">{{ salvando ? 'Publicando...' : 'Publicar alterações' }}</button>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  min-height: 156px;
  background: linear-gradient(120deg, var(--gb-purple-deep) 0%, var(--gb-dark) 100%);
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  align-content: flex-end;
  justify-content: space-between;
  gap: 14px 24px;
  padding: 92px 24px 18px;
  color: #fff;
  flex-shrink: 0;
}

.topbar-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.link-voltar-painel {
  font-family: var(--gb-font-eyebrow);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
}
.link-voltar-painel:hover { color: #fff; }

.divisor {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.22);
}

.titulo-editando {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.72);
}

.titulo-editando strong {
  color: #fff;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
}

.topbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.link-ver-pagina {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: underline;
}

.link-ver-pagina:hover {
  color: #fff;
}

.link-sair {
  font-family: inherit;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.link-sair:hover {
  color: #fff;
}

.msg-salvo {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: var(--gb-green);
  font-weight: 700;
  white-space: nowrap;
}

.toast-enter-active { transition: opacity 0.28s cubic-bezier(.16,1,.3,1), transform 0.28s cubic-bezier(.16,1,.3,1); }
.toast-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-6px) scale(0.96); }
.toast-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }

.msg-pendente {
  font-size: 0.78rem;
  color: #F0C419;
  font-weight: 600;
}

.btn-publicar {
  background: var(--gb-magenta);
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 9px 18px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-publicar:disabled { opacity: 0.6; cursor: default; }
.btn-publicar:not(:disabled):hover { background: var(--gb-magenta-strong); }

@media (max-width: 768px) {
  .topbar {
    min-height: auto;
    padding: 16px;
  }

  .topbar-info {
    gap: 8px 14px;
  }

  .divisor {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn-publicar, .toast-enter-active, .toast-leave-active { transition: none; }
}
</style>
