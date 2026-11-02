<script setup>
import { ref } from 'vue'

// Sem endpoint ainda — só nesta sessão. Idioma/programa sobem pro pai (aparecem no menu lateral).
const idioma = defineModel('idioma', { type: String, required: true })
const programa = defineModel('programa', { type: String, required: true })
const notifEmail = ref(true)
const notifWhats = ref(false)
const idiomaOptions = ['Inglês', 'Espanhol', 'Francês', 'Alemão']
const programaOptions = ['Intercâmbio acadêmico', 'Trabalho e estudo', 'Curso de idiomas']
</script>

<template>
  <div class="panel">
    <h2>Preferências</h2>
    <p class="panel-sub">Personalize as recomendações de intercâmbio</p>
    <div class="pref-group">
      <span class="pref-group-label">Idioma de interesse</span>
      <div class="chip-row">
        <button v-for="opt in idiomaOptions" :key="opt" type="button" class="chip" :class="{ picked: idioma === opt }" :aria-pressed="idioma === opt" @click="idioma = opt">{{ opt }}</button>
      </div>
    </div>
    <div class="pref-group">
      <span class="pref-group-label">Tipo de programa</span>
      <div class="chip-row">
        <button v-for="opt in programaOptions" :key="opt" type="button" class="chip" :class="{ picked: programa === opt }" :aria-pressed="programa === opt" @click="programa = opt">{{ opt }}</button>
      </div>
    </div>
    <div class="toggle-row">
      <div class="toggle-label">Notificações por e-mail</div>
      <button class="toggle-sw" :class="{ on: notifEmail }" :aria-pressed="notifEmail" aria-label="Notificações por e-mail" @click="notifEmail = !notifEmail"></button>
    </div>
    <div class="toggle-row">
      <div class="toggle-label">Notificações por WhatsApp</div>
      <button class="toggle-sw" :class="{ on: notifWhats }" :aria-pressed="notifWhats" aria-label="Notificações por WhatsApp" @click="notifWhats = !notifWhats"></button>
    </div>
  </div>
</template>

<style scoped>
.pref-group {
  margin-bottom: 18px;
}

.pref-group:last-child {
  margin-bottom: 0;
}

.pref-group-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  margin-bottom: 8px;
  display: block;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  border: 1px solid var(--gb-purple-deep-16);
  background: #fff;
  color: var(--gb-dark);
  font-size: 12.5px;
  font-family: var(--gb-font-display);
  padding: 7px 14px;
  border-radius: var(--gb-radius-pill);
  cursor: pointer;
}

.chip.picked {
  background: var(--gb-dark);
  color: #fff;
  border-color: var(--gb-dark);
}
</style>
