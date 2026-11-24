<script setup>
import { ref, reactive, watch } from 'vue'
import { atualizarAgencia } from '@/services/api'
import { sanitizarUrl } from '@/utils/url'

const props = defineProps({
  agencia: { type: Object, required: true },
})
const emit = defineEmits(['atualizado'])

const form = reactive({
  nome: '',
  descricao: '',
  como_funciona: '',
  contato: '',
  telefone: '',
  site: '',
  endereco: '',
})

function sincronizar(ag) {
  if (!ag) return
  form.nome = ag.nome || ''
  form.descricao = ag.descricao || ''
  form.como_funciona = ag.como_funciona || ''
  form.contato = ag.contato || ''
  form.telefone = ag.telefone || ''
  form.site = ag.site || ''
  form.endereco = ag.endereco || ''
}

watch(() => props.agencia, sincronizar, { immediate: true })

const salvando = ref(false)
const salvo = ref(false)
const erro = ref('')

async function salvar() {
  erro.value = ''
  salvo.value = false

  if (!form.nome.trim()) {
    erro.value = 'O nome da agência é obrigatório.'
    return
  }

  let siteFinal = form.site.trim()
  if (siteFinal) {
    const seguro = sanitizarUrl(siteFinal)
    if (!seguro) {
      erro.value = 'Informe um endereço de site válido (ex.: https://suaagencia.com).'
      return
    }
    siteFinal = seguro
  }

  salvando.value = true
  try {
    const atualizada = await atualizarAgencia(props.agencia.id, {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      como_funciona: form.como_funciona.trim(),
      contato: form.contato.trim(),
      telefone: form.telefone.trim(),
      site: siteFinal,
      endereco: form.endereco.trim(),
    })
    salvo.value = true
    emit('atualizado', atualizada)
  } catch (e) {
    console.error('Erro ao salvar dados da agência:', e)
    erro.value = 'Não foi possível salvar os dados agora. Tente novamente.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <form class="card" @submit.prevent="salvar">
    <h2 class="card-titulo">Dados da agência</h2>
    <p class="card-desc">Informações exibidas na sua página pública e nos resultados de busca.</p>

    <div class="field-row">
      <div class="field">
        <label for="ag-nome">Nome da agência</label>
        <input id="ag-nome" v-model="form.nome" type="text" required />
      </div>
      <div class="field">
        <label for="ag-contato">E-mail de contato</label>
        <input id="ag-contato" v-model="form.contato" type="email" placeholder="contato@suaagencia.com" />
      </div>
      <div class="field">
        <label for="ag-telefone">Telefone / WhatsApp</label>
        <input id="ag-telefone" v-model="form.telefone" type="tel" placeholder="+55 11 99999-9999" />
      </div>
      <div class="field">
        <label for="ag-site">Site oficial</label>
        <input id="ag-site" v-model="form.site" type="url" placeholder="https://suaagencia.com" />
      </div>
    </div>

    <div class="field field-espacado">
      <label for="ag-endereco">Endereço da sede</label>
      <input id="ag-endereco" v-model="form.endereco" type="text" placeholder="Rua, número, bairro, cidade" />
    </div>

    <div class="field field-espacado">
      <label for="ag-descricao">Descrição resumida</label>
      <textarea id="ag-descricao" v-model="form.descricao" rows="3" placeholder="Apresente a agência em poucas linhas — aparece no topo da página e nos cards de busca."></textarea>
    </div>

    <div class="field field-espacado">
      <label for="ag-como-funciona">Como funciona o processo</label>
      <textarea id="ag-como-funciona" v-model="form.como_funciona" rows="4" placeholder="Explique como o estudante é atendido do primeiro contato até o embarque."></textarea>
    </div>

    <p v-if="erro" class="msg-erro" role="alert">{{ erro }}</p>

    <div class="acoes">
      <button type="submit" class="btn-salvar" :disabled="salvando">
        {{ salvando ? 'Salvando...' : 'Salvar alterações' }}
      </button>
      <span v-if="salvo" class="msg-ok" role="status">Dados atualizados ✓</span>
    </div>
  </form>
</template>

<style scoped src="./painelCard.css"></style>
<style scoped>
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

.field-espacado {
  margin-bottom: 14px;
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
.field textarea:focus {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 1px;
  border-color: var(--gb-magenta);
}

.field textarea {
  resize: vertical;
}

.msg-erro {
  margin: 0 0 12px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #b3261e;
}

.acoes {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.btn-salvar {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-salvar:hover:not(:disabled) {
  background: var(--gb-magenta);
}

.btn-salvar:disabled {
  opacity: 0.6;
  cursor: default;
}

.msg-ok {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  color: var(--gb-green);
}
</style>
