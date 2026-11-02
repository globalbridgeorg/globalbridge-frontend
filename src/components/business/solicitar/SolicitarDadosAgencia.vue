<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/services/axios'

// form é o objeto reativo do pai — os campos são preenchidos direto nele.
const props = defineProps({
  form: { type: Object, required: true },
  camposComErro: { type: Object, required: true }
})

const paises = ref([])
const carregandoPaises = ref(true)

async function carregarPaises() {
  try {
    const { data } = await axios.get('/paises/')
    paises.value = [...data].sort((a, b) => a.nome.localeCompare(b.nome))
  } catch (e) {
    console.error('Erro ao buscar países:', e)
  } finally {
    carregandoPaises.value = false
  }
}

function toggleAtendido(id) {
  const atendidos = props.form.paises_atendidos
  const idx = atendidos.indexOf(id)
  if (idx === -1) atendidos.push(id)
  else atendidos.splice(idx, 1)
}

onMounted(carregarPaises)
</script>

<template>
  <div class="bloco">
    <span class="eyebrow">01 · Sobre a agência</span>
    <div class="grid-2">
      <div class="field">
        <label for="sab-nome">Nome da agência</label>
        <input id="sab-nome" class="inp" :class="{ erro: camposComErro.nome }" v-model="form.nome" placeholder="Nome da sua agência">
      </div>
      <div class="field">
        <label for="sab-site">Site oficial</label>
        <input id="sab-site" class="inp" v-model="form.site" placeholder="https://suaagencia.com">
      </div>
      <div class="field">
        <label for="sab-cidade">Cidade da sede</label>
        <input id="sab-cidade" class="inp" :class="{ erro: camposComErro.cidade }" v-model="form.cidade" placeholder="Cidade">
      </div>
      <div class="field">
        <label for="sab-pais">País da sede</label>
        <select id="sab-pais" class="inp" :class="{ erro: camposComErro.pais_sede }" v-model="form.pais_sede" :disabled="carregandoPaises">
          <option value="" disabled>{{ carregandoPaises ? 'Carregando...' : 'Escolha um país' }}</option>
          <option v-for="p in paises" :key="p.id" :value="p.id">{{ p.nome }}</option>
        </select>
      </div>
      <div class="field">
        <label for="sab-ano">Ano de fundação</label>
        <input id="sab-ano" class="inp" type="number" v-model="form.ano_fundacao" placeholder="Ex.: 2014">
      </div>
    </div>
  </div>

  <div class="bloco">
    <span class="eyebrow">02 · Sua agência atende outros países?</span>
    <p class="hint">Marque, além da sede, todo país onde a agência também tem unidade ou atuação — como a EF Education, que aparece em vários.</p>
    <div class="paises-grid">
      <label v-for="p in paises" :key="p.id" class="pais-chip" :class="{ active: form.paises_atendidos.includes(p.id) }">
        <input type="checkbox" :checked="form.paises_atendidos.includes(p.id)" @change="toggleAtendido(p.id)" hidden>
        {{ p.nome }}
      </label>
    </div>
  </div>
</template>

<style scoped>
.bloco {
  border-top: 1px solid var(--gb-purple-deep-16);
  padding-top: 24px;
}

.bloco:first-child {
  border-top: none;
  padding-top: 0;
}

.eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-mauve);
  display: block;
  margin-bottom: 16px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field-full {
  grid-column: 1 / -1;
}

.field label {
  display: block;
  margin-bottom: 8px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
}

.inp {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 10px;
  font-size: 14px;
  font-family: var(--gb-font-display);
  background: #fff;
  color: var(--gb-dark);
  transition: border-color 0.2s ease;
}

.inp:focus {
  outline: 2px solid var(--gb-magenta); outline-offset: 1px;
  border-color: var(--gb-magenta);
}

.inp.erro {
  border-color: #dc2626;
}

.hint {
  font-size: 12px;
  color: var(--gb-ink-faint);
  margin-top: 6px;
  line-height: 1.5;
}

.paises-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pais-chip {
  border: 1.5px solid var(--gb-purple-deep-16);
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gb-ink-soft);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.pais-chip.active {
  border-color: var(--gb-magenta);
  background: rgba(176, 31, 176, 0.08);
  color: var(--gb-magenta-strong);
}

@media (max-width: 640px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
