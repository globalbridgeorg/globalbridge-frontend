<script setup>
import { ref } from 'vue'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'

defineProps({ email: { type: String, default: '' } })

// Ilustrativo — sem verificação/atividade real no backend ainda.
const docSent = ref(false)
const activity = [
  { label: 'Perfil atualizado', when: 'há 2 dias', color: 'var(--gb-magenta-strong)' },
  { label: 'Login em novo dispositivo · iPhone 13', when: 'há 2 dias', color: 'var(--gb-blue)' },
  { label: 'Novo favorito: Irlanda', when: 'há 3 semanas', color: 'var(--gb-orange)' },
  { label: 'Preferências de intercâmbio atualizadas', when: 'há 1 mês', color: 'var(--gb-green)' }
]
</script>

<template>
  <SectionEyebrow label="Status e histórico" />
  <div class="heading-row">
    <h2 class="gb-heading" style="font-size: clamp(1.3rem, 1rem + 1.6vw, 2rem);">Sua conta em detalhes</h2>
    <p class="heading-desc">Verificações, acessos conectados e o que aconteceu por aqui recentemente.</p>
  </div>

  <div class="account-grid">
    <div class="panel account-panel">
      <h3>Verificações e acesso</h3>
      <p class="panel-sub">O que confirma que a conta é sua</p>

      <div class="verify-row">
        <div class="verify-icon ok"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div class="verify-text"><span class="verify-label">E-mail verificado</span><span class="verify-meta">{{ email }}</span></div>
      </div>
      <div class="verify-row">
        <div class="verify-icon" :class="docSent ? 'ok' : 'pending'">
          <svg v-if="docSent" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.5h.01" stroke-width="2.2" stroke-linecap="round"/></svg>
        </div>
        <div class="verify-text">
          <span class="verify-label">Documento de identidade</span>
          <span class="verify-meta">{{ docSent ? 'Enviado, em análise' : 'Pendente de envio' }}</span>
        </div>
        <button v-if="!docSent" class="link-verify" @click="docSent = true">Enviar agora</button>
      </div>
    </div>

    <div class="panel account-panel">
      <h3>Atividade recente</h3>
      <p class="panel-sub">Últimas ações na sua conta</p>
      <div class="timeline">
        <div v-for="(ev, i) in activity" :key="i" class="timeline-item">
          <div class="timeline-dot" :style="{ background: ev.color }"></div>
          <div class="timeline-text"><span class="timeline-label">{{ ev.label }}</span><span class="timeline-when">{{ ev.when }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heading-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

@media (min-width: 768px) {
  .heading-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.heading-desc {
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--gb-ink-soft);
  max-width: 340px;
  margin: 0;
}

.account-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 800px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}

/* .panel vem do ProfileView (:deep); o .panel aqui garante que este padding vença. */
.panel.account-panel {
  padding: 24px 26px;
}

.verify-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.verify-row:first-of-type {
  border-top: none;
}

.verify-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verify-icon svg {
  width: 14px;
  height: 14px;
  stroke: #fff;
}

.verify-icon.ok {
  background: var(--gb-green);
}

.verify-icon.pending {
  background: var(--gb-orange);
}

.verify-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.verify-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.verify-meta {
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.link-verify {
  background: none;
  border: none;
  color: var(--gb-magenta);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  flex-shrink: 0;
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.timeline-item:first-of-type {
  border-top: none;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.timeline-text {
  display: flex;
  flex-direction: column;
}

.timeline-label {
  font-size: 13px;
  color: var(--gb-dark);
}

.timeline-when {
  font-size: 11px;
  color: var(--gb-ink-faint);
}
</style>
