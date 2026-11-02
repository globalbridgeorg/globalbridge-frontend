<script setup>
import { ref, computed } from 'vue'
import axios from '@/services/axios'

const props = defineProps({
  agenciaId: { type: [Number, String], required: true },
  painel: { type: Object, required: true },
  todosPaises: { type: Array, required: true }
})
// A mensagem fica no pai: depois do pedido o painel recarrega inteiro
// (esse card é desmontado e montado de novo) e ela precisa sobreviver.
const mensagemPedido = defineModel('mensagem', { type: String, default: '' })
const emit = defineEmits(['atualizar'])

const formularioAberto = ref(false)
const paisSelecionado = ref('')
const enviandoPedido = ref(false)

const paisesDisponiveis = computed(() => {
  const idsOcupados = new Set([
    ...props.painel.paises_atendidos.map((p) => p.id),
    ...props.painel.paises_pendentes.map((p) => p.id),
  ])
  return props.todosPaises.filter((p) => !idsOcupados.has(p.id))
})

async function enviarPedidoPais() {
  if (!paisSelecionado.value) return
  enviandoPedido.value = true
  mensagemPedido.value = ''
  try {
    await axios.post(`/agencia/${props.agenciaId}/paises/solicitar/`, { pais: paisSelecionado.value })
    mensagemPedido.value = 'Pedido enviado — vai aparecer como pendente até o time aprovar.'
    formularioAberto.value = false
    paisSelecionado.value = ''
    emit('atualizar')
  } catch (e) {
    mensagemPedido.value = e.response?.data?.detail || 'Não conseguimos enviar o pedido agora.'
  } finally {
    enviandoPedido.value = false
  }
}
</script>

<template>
  <div class="card">
    <div class="card-head">
      <h2 class="card-titulo">Países atendidos</h2>
      <button class="btn-adicionar" :aria-expanded="formularioAberto" aria-controls="form-pais-solicitar" @click="formularioAberto = !formularioAberto">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Solicitar novo país
      </button>
    </div>
    <p class="card-desc">Baseado nos países aprovados no seu cadastro. Pra atender um novo país, o time da GlobalBridge confirma antes — igual foi na verificação inicial.</p>

    <div class="chips-paises">
      <span v-for="pais in painel.paises_atendidos" :key="pais.id" class="chip-pais">
        <span class="chip-sigla">{{ pais.sigla }}</span>{{ pais.nome }}
      </span>
      <span v-for="pais in painel.paises_pendentes" :key="'p' + pais.id" class="chip-pais pendente">
        <span class="chip-sigla pendente">{{ pais.sigla }}</span>{{ pais.nome }}
        <span class="chip-pendente-tag">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
          Pendente
        </span>
      </span>
    </div>

    <p v-if="mensagemPedido" class="mensagem-pedido" role="status">{{ mensagemPedido }}</p>

    <!-- grid-template-rows 0fr→1fr é o truque que deixa a altura
         animar sem precisar saber o tamanho do conteúdo (height:auto
         não é animável). O wrapper interno com overflow:hidden é o
         que faz o conteúdo ser cortado enquanto abre. -->
    <div id="form-pais-solicitar" class="form-pais-wrap" :class="{ aberta: formularioAberto }">
      <div class="form-pais-inner">
        <div class="form-pais">
          <label for="select-novo-pais">Escolher país pra solicitar</label>
          <div class="form-pais-linha">
            <select id="select-novo-pais" v-model="paisSelecionado">
              <option value="">Selecione um país...</option>
              <option v-for="p in paisesDisponiveis" :key="p.id" :value="p.id">{{ p.nome }}</option>
            </select>
            <button :disabled="!paisSelecionado || enviandoPedido" @click="enviarPedidoPais">{{ enviandoPedido ? 'Enviando...' : 'Enviar pedido' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./painelCard.css"></style>
<style scoped>
.chips-paises { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-pais { display: inline-flex; align-items: center; gap: 6px; background: rgba(176,31,176,0.06); color: var(--gb-magenta-strong); border-radius: 20px; padding: 7px 14px 7px 8px; font-size: 0.84rem; font-weight: 600; }
.chip-pais.pendente { background: #F4F4F5; color: var(--gb-ink-soft); }
.chip-sigla { width: 20px; height: 20px; border-radius: 50%; background: var(--gb-dark); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; }
.chip-sigla.pendente { background: #D4D4D8; color: var(--gb-ink-soft); }
.chip-pendente-tag { display: inline-flex; align-items: center; gap: 3px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 9px; letter-spacing: 0.04em; text-transform: uppercase; }

.btn-adicionar { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1.5px dashed var(--gb-purple-deep-16); border-radius: 20px; padding: 7px 14px; font-size: 0.8rem; font-weight: 600; color: var(--gb-ink-soft); cursor: pointer; }
.mensagem-pedido { margin: 12px 0 0; font-size: 0.82rem; color: var(--gb-magenta-strong); }

.form-pais-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(.4, 0, .2, 1);
}
.form-pais-wrap.aberta { grid-template-rows: 1fr; }
.form-pais-inner { overflow: hidden; }
.form-pais-wrap .form-pais {
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.22s ease 0.06s, transform 0.22s ease 0.06s;
}
.form-pais-wrap.aberta .form-pais { opacity: 1; transform: translateY(0); }

.form-pais { border-top: 1px solid var(--gb-purple-deep-16); padding-top: 16px; margin-top: 16px; }
.form-pais label { display: block; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gb-ink-faint); margin-bottom: 8px; }
.form-pais-linha { display: flex; gap: 10px; flex-wrap: wrap; }
.form-pais-linha select { flex: 1; min-width: 200px; padding: 10px 12px; border: 1px solid var(--gb-purple-deep-16); border-radius: 10px; font-size: 0.85rem; font-family: var(--gb-font-display); color: var(--gb-dark); background: #fff; }
.form-pais-linha button { background: var(--gb-dark); color: #fff; border: none; border-radius: 10px; padding: 0 20px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11.5px; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; }
.form-pais-linha button:disabled { opacity: 0.5; cursor: default; }

@media (prefers-reduced-motion: reduce) {
  .form-pais-wrap,
  .form-pais-wrap .form-pais { transition: none; }
}
</style>
