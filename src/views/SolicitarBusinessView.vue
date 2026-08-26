<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'

const router = useRouter()

const paises = ref([])
const carregandoPaises = ref(true)

const form = ref({
  nome: '',
  site: '',
  cidade: '',
  pais_sede: '',
  paises_atendidos: [],
  ano_fundacao: '',
  nome_responsavel: '',
  cargo_responsavel: '',
  email_responsavel: '',
  senha: '',
  confirmarSenha: '',
  descricao: '',
})
const documento = ref(null)
const confirmado = ref(false)
const enviando = ref(false)
const erro = ref('')
const camposComErro = ref({})

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

function handleDocumento(event) {
  documento.value = event.target.files?.[0] || null
}

function toggleAtendido(id) {
  const idx = form.value.paises_atendidos.indexOf(id)
  if (idx === -1) form.value.paises_atendidos.push(id)
  else form.value.paises_atendidos.splice(idx, 1)
}

function validar() {
  const erros = {}
  if (!form.value.nome.trim()) erros.nome = true
  if (!form.value.cidade.trim()) erros.cidade = true
  if (!form.value.pais_sede) erros.pais_sede = true
  if (!form.value.nome_responsavel.trim()) erros.nome_responsavel = true
  if (!form.value.email_responsavel.trim()) erros.email_responsavel = true
  if (!form.value.senha || form.value.senha.length < 8) erros.senha = true
  if (form.value.confirmarSenha !== form.value.senha) erros.confirmarSenha = true
  if (!documento.value) erros.documento = true
  if (!confirmado.value) erros.confirmado = true
  camposComErro.value = erros
  return Object.keys(erros).length === 0
}

async function enviar() {
  erro.value = ''
  if (!validar()) {
    erro.value = 'Preenche os campos destacados antes de enviar.'
    return
  }

  enviando.value = true
  try {
    const formData = new FormData()
    formData.append('nome', form.value.nome)
    formData.append('site', form.value.site)
    formData.append('cidade', form.value.cidade)
    formData.append('pais_sede', form.value.pais_sede)
    const atendidos = new Set([...form.value.paises_atendidos, Number(form.value.pais_sede)])
    atendidos.forEach((id) => formData.append('paises_atendidos', id))
    if (form.value.ano_fundacao) formData.append('ano_fundacao', form.value.ano_fundacao)
    formData.append('nome_responsavel', form.value.nome_responsavel)
    formData.append('cargo_responsavel', form.value.cargo_responsavel)
    formData.append('email_responsavel', form.value.email_responsavel)
    formData.append('senha', form.value.senha)
    formData.append('descricao', form.value.descricao)
    formData.append('documento', documento.value)

    const { data } = await axios.post('/solicitacoes-agencia/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // O pedido já cria a conta (sem agência vinculada ainda) com a senha
    // que a pessoa escolheu acima — loga na hora com ela, assim dá pra
    // voltar e ver o status depois só entrando normalmente, sem depender
    // de um link salvo no navegador.
    try {
      const { data: tokens } = await axios.post('/token/', {
        email: form.value.email_responsavel,
        password: form.value.senha
      })
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
    } catch (e) {
      // Segue o fluxo mesmo se o login automático falhar — a pessoa
      // ainda consegue entrar manualmente depois com o que cadastrou.
    }

    localStorage.setItem('solicitacao_agencia_id', data.id)
    router.push({ name: 'business-analise', query: { id: data.id } })
  } catch (e) {
    console.error('Erro ao enviar solicitação:', e)
    if (e.response?.data?.email_responsavel) {
      erro.value = e.response.data.email_responsavel[0]
    } else {
      erro.value = 'Não conseguimos enviar seu pedido agora. Tenta de novo em instantes.'
    }
  } finally {
    enviando.value = false
  }
}

onMounted(carregarPaises)
</script>

<template>
  <div class="solicitar-view gb-section">
    <div class="hero">
      <span class="badge">Conta business</span>
      <h1 class="gb-heading">Coloque sua<br />agência na GlobalBridge</h1>
      <p class="hero-desc">Contas de agência passam por uma verificação antes de ficarem no ar — conta pra gente quem vocês são, a gente confere e libera o acesso.</p>
    </div>

    <form class="card-form" @submit.prevent="enviar">
      <div class="bloco">
        <span class="eyebrow">01 · Sobre a agência</span>
        <div class="grid-2">
          <div class="field">
            <label>Nome da agência</label>
            <input class="inp" :class="{ erro: camposComErro.nome }" v-model="form.nome" placeholder="Nome da sua agência">
          </div>
          <div class="field">
            <label>Site oficial</label>
            <input class="inp" v-model="form.site" placeholder="https://suaagencia.com">
          </div>
          <div class="field">
            <label>Cidade da sede</label>
            <input class="inp" :class="{ erro: camposComErro.cidade }" v-model="form.cidade" placeholder="Cidade">
          </div>
          <div class="field">
            <label>País da sede</label>
            <select class="inp" :class="{ erro: camposComErro.pais_sede }" v-model="form.pais_sede" :disabled="carregandoPaises">
              <option value="" disabled>{{ carregandoPaises ? 'Carregando...' : 'Escolha um país' }}</option>
              <option v-for="p in paises" :key="p.id" :value="p.id">{{ p.nome }}</option>
            </select>
          </div>
          <div class="field">
            <label>Ano de fundação</label>
            <input class="inp" type="number" v-model="form.ano_fundacao" placeholder="Ex.: 2014">
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

      <div class="bloco">
        <span class="eyebrow">03 · Quem está pedindo</span>
        <div class="grid-2">
          <div class="field">
            <label>Seu nome</label>
            <input class="inp" :class="{ erro: camposComErro.nome_responsavel }" v-model="form.nome_responsavel" placeholder="Seu nome completo">
          </div>
          <div class="field">
            <label>Cargo na agência</label>
            <input class="inp" v-model="form.cargo_responsavel" placeholder="Ex.: Coordenador de Admissões">
          </div>
          <div class="field field-full">
            <label>E-mail institucional</label>
            <input class="inp" :class="{ erro: camposComErro.email_responsavel }" type="email" v-model="form.email_responsavel" placeholder="voce@suaagencia.com">
            <p class="hint">É a primeira coisa que a gente confere — e vira o login da conta business assim que aprovado.</p>
          </div>
          <div class="field">
            <label>Crie uma senha</label>
            <input class="inp" :class="{ erro: camposComErro.senha }" type="password" v-model="form.senha" placeholder="Mínimo 8 caracteres">
          </div>
          <div class="field">
            <label>Confirme a senha</label>
            <input class="inp" :class="{ erro: camposComErro.confirmarSenha }" type="password" v-model="form.confirmarSenha" placeholder="Digite novamente">
          </div>
        </div>
        <p class="hint">Sua conta já é criada agora, com essa senha — dá pra logar e acompanhar o status do pedido a qualquer momento, mesmo antes de ser aprovada.</p>
      </div>

      <div class="bloco">
        <span class="eyebrow">04 · Prova de que a agência é real</span>
        <label class="dropzone" :class="{ erro: camposComErro.documento }">
          <input type="file" @change="handleDocumento" hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B01FB0" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>
          <span>{{ documento ? documento.name : 'Anexar documento de registro (CNPJ ou equivalente)' }}</span>
        </label>
      </div>

      <div class="bloco">
        <span class="eyebrow">05 · Conte um pouco mais</span>
        <textarea class="inp" rows="4" v-model="form.descricao" placeholder="Por que sua agência deveria estar na GlobalBridge?"></textarea>
      </div>

      <label class="checkbox-confirm" :class="{ erro: camposComErro.confirmado }">
        <input type="checkbox" v-model="confirmado">
        Confirmo que as informações acima são verdadeiras e que tenho autorização para representar essa agência na GlobalBridge.
      </label>

      <p v-if="erro" class="erro-msg">{{ erro }}</p>

      <button type="submit" class="btn-enviar" :disabled="enviando">{{ enviando ? 'Enviando...' : 'Enviar pedido de verificação' }}</button>
      <p class="footer-hint">A análise costuma levar até 5 dias úteis. Você vai poder acompanhar o status na próxima tela.</p>
    </form>
  </div>
</template>

<style scoped>
.solicitar-view {
  padding: 120px 5% 90px;
  max-width: 800px;
}

.hero {
  text-align: center;
  margin-bottom: 40px;
}

.badge {
  display: inline-block;
  background: rgba(176, 31, 176, 0.1);
  color: var(--gb-magenta-strong);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.hero-desc {
  font-size: 1rem;
  color: var(--gb-ink-soft);
  line-height: 1.6;
  max-width: 520px;
  margin: 12px auto 0;
}

.card-form {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 20px;
  padding: 44px;
  box-shadow: 0 10px 24px rgba(23, 17, 26, 0.06);
  display: flex;
  flex-direction: column;
  gap: 28px;
}

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
  outline: none;
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

.dropzone {
  border: 1.5px dashed var(--gb-purple-deep-16);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--gb-ink-soft);
  transition: border-color 0.2s ease;
}

.dropzone:hover {
  border-color: var(--gb-magenta);
}

.dropzone.erro {
  border-color: #dc2626;
}

.checkbox-confirm {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--gb-ink-soft);
  line-height: 1.5;
  cursor: pointer;
}

.checkbox-confirm input {
  width: 18px;
  height: 18px;
  accent-color: var(--gb-magenta);
  margin-top: 1px;
  flex-shrink: 0;
}

.checkbox-confirm.erro {
  color: #dc2626;
}

.erro-msg {
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.btn-enviar {
  width: 100%;
  padding: 15px;
  background: var(--gb-dark);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-enviar:hover {
  background: var(--gb-magenta);
}

.btn-enviar:disabled {
  opacity: 0.6;
  cursor: default;
}

.footer-hint {
  text-align: center;
  font-size: 0.8rem;
  color: var(--gb-ink-faint);
}

@media (max-width: 640px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .card-form {
    padding: 24px;
  }
}
</style>
