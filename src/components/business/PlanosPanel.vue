<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getProgramas, criarPlano, atualizarPlano, removerPlano } from '@/services/api'

const props = defineProps({
  agenciaId: { type: [Number, String], required: true },
  planos: { type: Array, required: true },
})
const emit = defineEmits(['atualizar'])

const programas = ref([])
const carregandoProgramas = ref(true)
const formAberto = ref(false)
const editandoId = ref(null)
const salvando = ref(false)
const removendoId = ref(null)
const erro = ref('')
const feedback = ref('')

const form = reactive({
  programa_id: '',
  preco: '',
  descricao: '',
  inclui: '',
})

function resetarForm() {
  editandoId.value = null
  form.programa_id = ''
  form.preco = ''
  form.descricao = ''
  form.inclui = ''
  erro.value = ''
}

function abrirNovo() {
  resetarForm()
  feedback.value = ''
  formAberto.value = true
}

function abrirEdicao(plano) {
  editandoId.value = plano.id
  form.programa_id = plano.programa_id
  form.preco = String(plano.preco)
  form.descricao = plano.descricao || ''
  form.inclui = plano.inclui || ''
  erro.value = ''
  feedback.value = ''
  formAberto.value = true
}

function cancelar() {
  formAberto.value = false
  resetarForm()
}

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function salvarPlano() {
  erro.value = ''
  feedback.value = ''

  if (!form.programa_id) {
    erro.value = 'Selecione o tipo de programa.'
    return
  }
  if (!editandoId.value && props.planos.some(p => p.programa_id === Number(form.programa_id))) {
    erro.value = 'Esse tipo de programa já foi adicionado ao catálogo.'
    return
  }
  const precoNum = Number(String(form.preco).replace(',', '.'))
  if (!Number.isFinite(precoNum) || precoNum <= 0) {
    erro.value = 'Informe um preço válido maior que zero.'
    return
  }

  salvando.value = true
  try {
    const payload = {
      programa_id: form.programa_id,
      preco: precoNum,
      descricao: form.descricao,
      inclui: form.inclui,
    }
    if (editandoId.value) {
      await atualizarPlano(editandoId.value, payload)
      feedback.value = 'Programa atualizado ✓'
    } else {
      await criarPlano(props.agenciaId, payload)
      feedback.value = 'Programa adicionado ao catálogo ✓'
    }
    formAberto.value = false
    resetarForm()
    emit('atualizar')
  } catch (e) {
    console.error('Erro ao salvar plano:', e)
    erro.value = 'Não foi possível salvar esse programa agora.'
  } finally {
    salvando.value = false
  }
}

async function excluirPlano(plano) {
  const ok = window.confirm(`Remover "${plano.programa_nome}" do catálogo da agência?`)
  if (!ok) return
  removendoId.value = plano.id
  erro.value = ''
  feedback.value = ''
  try {
    await removerPlano(plano.id)
    if (editandoId.value === plano.id) cancelar()
    feedback.value = 'Programa removido.'
    emit('atualizar')
  } catch (e) {
    console.error('Erro ao remover plano:', e)
    erro.value = 'Não foi possível remover esse programa agora.'
  } finally {
    removendoId.value = null
  }
}

onMounted(async () => {
  try {
    programas.value = await getProgramas()
  } catch (e) {
    console.error('Erro ao carregar tipos de programa:', e)
  } finally {
    carregandoProgramas.value = false
  }
})
</script>

<template>
  <div class="card">
    <div class="card-head">
      <div>
        <h2 class="card-titulo">Catálogo de programas</h2>
        <p class="card-desc" style="margin-bottom: 0;">Adicione, edite ou remova os programas que aparecem na sua página pública.</p>
      </div>
      <button v-if="!formAberto" type="button" class="btn-novo" @click="abrirNovo">
        + Adicionar programa
      </button>
    </div>

    <p v-if="feedback" class="msg-ok" role="status">{{ feedback }}</p>
    <p v-if="erro && !formAberto" class="msg-erro" role="alert">{{ erro }}</p>

    <form v-if="formAberto" class="plano-form" @submit.prevent="salvarPlano">
      <div class="plano-form-head">
        <strong>{{ editandoId ? 'Editar programa' : 'Novo programa' }}</strong>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="plano-programa">Tipo de programa</label>
          <select id="plano-programa" v-model="form.programa_id" :disabled="carregandoProgramas" required>
            <option value="" disabled>{{ carregandoProgramas ? 'Carregando...' : 'Escolha um programa' }}</option>
            <option v-for="prog in programas" :key="prog.id" :value="prog.id">
              {{ prog.nome }} ({{ prog.duracao_min }} a {{ prog.duracao_max }} meses)
            </option>
          </select>
        </div>
        <div class="field">
          <label for="plano-preco">Preço base (R$)</label>
          <input id="plano-preco" v-model="form.preco" type="number" step="0.01" min="1" placeholder="Ex.: 14500" required />
        </div>
      </div>

      <div class="field field-espacado">
        <label for="plano-descricao">Descrição do programa</label>
        <textarea id="plano-descricao" v-model="form.descricao" rows="2" placeholder="Resumo do que torna essa opção interessante na sua agência."></textarea>
      </div>

      <div class="field field-espacado">
        <label for="plano-inclui">O que está incluso</label>
        <textarea id="plano-inclui" v-model="form.inclui" rows="2" placeholder="Ex.: Matrícula, orientação de visto, acomodação nas primeiras 4 semanas, seguro saúde..."></textarea>
      </div>

      <p v-if="erro" class="msg-erro" role="alert">{{ erro }}</p>

      <div class="plano-form-acoes">
        <button type="submit" class="btn-salvar" :disabled="salvando">
          {{ salvando ? 'Salvando...' : (editandoId ? 'Salvar alterações' : 'Adicionar programa') }}
        </button>
        <button type="button" class="btn-cancelar" :disabled="salvando" @click="cancelar">Cancelar</button>
      </div>
    </form>

    <div v-if="!planos.length && !formAberto" class="vazio-pequeno" style="margin-top: 18px;">
      Nenhum programa cadastrado ainda. Clique em "Adicionar programa" para começar.
    </div>

    <div v-else-if="planos.length" class="lista-planos">
      <article v-for="plano in planos" :key="plano.id" class="plano-item">
        <div class="plano-topo">
          <div>
            <h3>{{ plano.programa_nome }}</h3>
            <span class="plano-meta">{{ plano.duracao_min }} a {{ plano.duracao_max }} meses</span>
          </div>
          <strong class="plano-preco">{{ formatarPreco(plano.preco) }}</strong>
        </div>
        <p v-if="plano.descricao" class="plano-desc">{{ plano.descricao }}</p>
        <p v-if="plano.inclui" class="plano-inclui"><strong>Inclui:</strong> {{ plano.inclui }}</p>
        <div class="plano-acoes">
          <button type="button" class="btn-acao" @click="abrirEdicao(plano)">Editar</button>
          <button
            type="button"
            class="btn-acao btn-acao--danger"
            :disabled="removendoId === plano.id"
            @click="excluirPlano(plano)"
          >
            {{ removendoId === plano.id ? 'Removendo...' : 'Remover' }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped src="./painelCard.css"></style>
<style scoped>
.btn-novo {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 9px 16px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-novo:hover {
  background: var(--gb-magenta);
}

.plano-form {
  margin-top: 18px;
  padding: 18px 20px;
  border-radius: 10px;
  background: var(--gb-cream);
  border: 1px solid var(--gb-purple-deep-16);
}

.plano-form-head {
  margin-bottom: 14px;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: var(--gb-dark);
}

.field-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

.field-espacado {
  margin-bottom: 12px;
}

.field label {
  display: block;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  margin-bottom: 6px;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 9px;
  font-size: 13.5px;
  font-family: 'Montserrat', sans-serif;
  color: var(--gb-dark);
  background: #fff;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 1px;
  border-color: var(--gb-magenta);
}

.plano-form-acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-salvar {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  padding: 9px 18px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-salvar:hover:not(:disabled) {
  background: var(--gb-magenta);
}

.btn-cancelar {
  background: #fff;
  color: var(--gb-ink-soft);
  border: 1px solid var(--gb-purple-deep-16);
  padding: 9px 16px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
}

.msg-ok {
  margin: 12px 0 0;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  color: var(--gb-green);
}

.msg-erro {
  margin: 10px 0 12px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #b3261e;
}

.lista-planos {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plano-item {
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 10px;
  padding: 16px 18px;
  background: #fff;
}

.plano-topo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 6px;
}

.plano-topo h3 {
  margin: 0;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.95rem;
  color: var(--gb-dark);
}

.plano-meta {
  font-size: 0.78rem;
  color: var(--gb-ink-faint);
}

.plano-preco {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 1rem;
  color: var(--gb-magenta-strong);
  white-space: nowrap;
}

.plano-desc,
.plano-inclui {
  margin: 6px 0 0;
  font-size: 0.84rem;
  color: var(--gb-ink-soft);
  line-height: 1.5;
}

.plano-acoes {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(46, 10, 46, 0.08);
}

.btn-acao {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--gb-dark);
  cursor: pointer;
}

.btn-acao:hover {
  color: var(--gb-magenta);
  text-decoration: underline;
}

.btn-acao--danger {
  color: #b3261e;
}

.btn-acao--danger:hover {
  color: #7f1d1d;
}
</style>
