<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  signUpConta,
  verifySignupOtp,
  resendSignupOtp,
  enviarSolicitacaoAgencia,
} from '@/services/api'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { useContaAtual } from '@/composables/useContaAtual'
import { traduzirErroAuth } from '@/utils/authErrors'
import SolicitarDadosAgencia from '@/components/business/solicitar/SolicitarDadosAgencia.vue'

gsap.registerPlugin(ScrollTrigger)

const router = useRouter()
const { carregarConta } = useContaAtual()
const viewRef = ref(null)
let ctx

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

const aguardandoCodigo = ref(false)
const codigoEmail = ref('')
const infoCodigo = ref('')

function handleDocumento(event) {
  const file = event.target.files?.[0] || null
  if (file && file.size > 10 * 1024 * 1024) {
    erro.value = 'O documento precisa ter no máximo 10 MB.'
    documento.value = null
    return
  }
  documento.value = file
}

function validar() {
  const erros = {}
  if (!form.value.nome.trim()) erros.nome = true
  if (!form.value.cidade.trim()) erros.cidade = true
  if (!form.value.pais_sede) erros.pais_sede = true
  if (!form.value.nome_responsavel.trim()) erros.nome_responsavel = true
  if (!form.value.email_responsavel.trim() || !form.value.email_responsavel.includes('@')) erros.email_responsavel = true
  if (!form.value.senha || form.value.senha.length < 8) erros.senha = true
  if (form.value.confirmarSenha !== form.value.senha) erros.confirmarSenha = true
  if (!documento.value) erros.documento = true
  if (!confirmado.value) erros.confirmado = true
  camposComErro.value = erros
  return Object.keys(erros).length === 0
}

async function concluirEnvioSolicitacao() {
  await enviarSolicitacaoAgencia(form.value, documento.value)
  await carregarConta(true)
  router.push({ name: 'business-analise' })
}

async function enviar() {
  erro.value = ''
  if (!validar()) {
    erro.value = 'Preencha os campos destacados antes de enviar.'
    return
  }

  enviando.value = true
  try {
    const data = await signUpConta({
      email: form.value.email_responsavel,
      password: form.value.senha,
      name: form.value.nome_responsavel,
    })

    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      erro.value = 'Esse e-mail já está cadastrado. Use outro e-mail institucional ou faça login.'
      return
    }

    if (data?.session) {
      await concluirEnvioSolicitacao()
      return
    }

    aguardandoCodigo.value = true
    infoCodigo.value = `Enviamos um código de confirmação para ${form.value.email_responsavel.trim().toLowerCase()}. Confirme para finalizar o pedido.`
  } catch (e) {
    console.error('Erro ao enviar solicitação:', e)
    const msg = String(e?.message || '').toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists')) {
      erro.value = 'Esse e-mail já está cadastrado. Use outro e-mail institucional ou faça login.'
    } else {
      erro.value = traduzirErroAuth(e, 'Não conseguimos enviar seu pedido agora. Tente novamente em instantes.')
    }
  } finally {
    enviando.value = false
  }
}

async function confirmarCodigoEEnviar() {
  erro.value = ''
  if (!codigoEmail.value.trim()) {
    erro.value = 'Informe o código recebido no e-mail.'
    return
  }
  enviando.value = true
  try {
    await verifySignupOtp(form.value.email_responsavel, codigoEmail.value)
    await concluirEnvioSolicitacao()
  } catch (e) {
    console.error('Erro ao confirmar código da solicitação:', e)
    erro.value = traduzirErroAuth(e, 'Código inválido ou expirado. Confira seu e-mail ou reenvie o código.')
  } finally {
    enviando.value = false
  }
}

async function reenviarCodigo() {
  erro.value = ''
  enviando.value = true
  try {
    await resendSignupOtp(form.value.email_responsavel)
    infoCodigo.value = 'Código reenviado — confira sua caixa de entrada.'
  } catch (e) {
    erro.value = traduzirErroAuth(e, 'Não conseguimos reenviar o código agora.')
  } finally {
    enviando.value = false
  }
}

onMounted(() => {
  if (prefersReducedMotion()) return
  setTimeout(() => {
    if (!viewRef.value) return
    ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } })
      tl.from('.hero .badge, .hero .gb-heading, .hero .hero-desc', {
        opacity: 0,
        y: 18,
        duration: 0.5,
        stagger: 0.08,
      }).from('.card-form', { opacity: 0, y: 22, duration: 0.55 }, '-=0.25')

      gsap.utils.toArray('.bloco').forEach((bloco) => {
        gsap.from(bloco, {
          opacity: 0,
          y: 18,
          duration: 0.48,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: bloco, start: 'top 88%' },
        })
      })
    }, viewRef.value)
  }, 260)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="viewRef" class="solicitar-view gb-section">
    <div class="hero">
      <span class="badge">Conta business</span>
      <h1 class="gb-heading">Coloque sua<br />agência na GlobalBridge</h1>
      <p class="hero-desc">Contas de agência passam por uma verificação antes de ficarem no ar — conte quem vocês são, a gente confere e libera o acesso.</p>
    </div>

    <div v-if="aguardandoCodigo" class="card-form">
      <div class="bloco bloco-primeiro">
        <span class="eyebrow">Confirmação de e-mail</span>
        <p class="hint" style="margin-top: 0; margin-bottom: 16px;">{{ infoCodigo }}</p>
        <div class="field">
          <label for="sab-codigo">Código recebido por e-mail</label>
          <input
            id="sab-codigo"
            v-model="codigoEmail"
            class="inp"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="000000"
            @keyup.enter="confirmarCodigoEEnviar"
          >
        </div>
      </div>
      <p v-if="erro" class="erro-msg" role="alert">{{ erro }}</p>
      <button type="button" class="btn-enviar" :disabled="enviando" @click="confirmarCodigoEEnviar">
        {{ enviando ? 'Finalizando pedido...' : 'Confirmar e concluir pedido' }}
      </button>
      <button type="button" class="btn-link-reenviar" :disabled="enviando" @click="reenviarCodigo">
        Reenviar código
      </button>
    </div>

    <form v-else class="card-form" @submit.prevent="enviar">
      <SolicitarDadosAgencia :form="form" :campos-com-erro="camposComErro" />

      <div class="bloco">
        <span class="eyebrow">03 · Quem está pedindo</span>
        <div class="grid-2">
          <div class="field">
            <label for="sab-responsavel">Seu nome</label>
            <input id="sab-responsavel" class="inp" :class="{ erro: camposComErro.nome_responsavel }" v-model="form.nome_responsavel" placeholder="Seu nome completo">
          </div>
          <div class="field">
            <label for="sab-cargo">Cargo na agência</label>
            <input id="sab-cargo" class="inp" v-model="form.cargo_responsavel" placeholder="Ex.: Coordenador de Admissões">
          </div>
          <div class="field field-full">
            <label for="sab-email">E-mail institucional</label>
            <input id="sab-email" class="inp" :class="{ erro: camposComErro.email_responsavel }" type="email" v-model="form.email_responsavel" placeholder="voce@suaagencia.com">
            <p class="hint">É a primeira coisa que a gente confere — e vira o login da conta business assim que aprovado.</p>
          </div>
          <div class="field">
            <label for="sab-senha">Crie uma senha</label>
            <input id="sab-senha" class="inp" :class="{ erro: camposComErro.senha }" type="password" v-model="form.senha" placeholder="Mínimo 8 caracteres">
          </div>
          <div class="field">
            <label for="sab-confirmar">Confirme a senha</label>
            <input id="sab-confirmar" class="inp" :class="{ erro: camposComErro.confirmarSenha }" type="password" v-model="form.confirmarSenha" placeholder="Digite novamente">
          </div>
        </div>
        <p class="hint">Sua conta já é criada agora, com essa senha — dá pra logar e acompanhar o status do pedido a qualquer momento, mesmo antes de ser aprovada.</p>
      </div>

      <div class="bloco">
        <span class="eyebrow">04 · Prova de que a agência é real</span>
        <label class="dropzone" :class="{ erro: camposComErro.documento }">
          <input type="file" accept=".pdf,image/png,image/jpeg,image/webp" aria-label="Anexar documento de registro" class="sr-only-input" @change="handleDocumento">
          <i class="fi fi-rr-document dropzone-doc-icon" aria-hidden="true"></i>
          <span>{{ documento ? documento.name : 'Anexar documento de registro (CNPJ ou equivalente — PDF, JPG ou PNG, até 10 MB)' }}</span>
        </label>
      </div>

      <div class="bloco">
        <label class="eyebrow" for="sab-descricao">05 · Conte um pouco mais</label>
        <textarea id="sab-descricao" class="inp" rows="4" v-model="form.descricao" placeholder="Por que sua agência deveria estar na GlobalBridge?"></textarea>
      </div>

      <label class="checkbox-confirm" :class="{ erro: camposComErro.confirmado }">
        <input type="checkbox" v-model="confirmado">
        Confirmo que as informações acima são verdadeiras e que tenho autorização para representar essa agência na GlobalBridge.
      </label>

      <p v-if="erro" class="erro-msg" role="alert">{{ erro }}</p>

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
  border-radius: var(--gb-radius-card);
  padding: 40px;
  box-shadow: 0 10px 24px rgba(23, 17, 26, 0.06);
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.bloco {
  border-top: 1px solid var(--gb-purple-deep-16);
  padding-top: 24px;
}

.bloco-primeiro {
  border-top: none;
  padding-top: 0;
}

.sr-only-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.btn-link-reenviar {
  background: none;
  border: none;
  color: var(--gb-magenta);
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  align-self: center;
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

.dropzone:focus-within {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
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

.dropzone-doc-icon {
  font-size: 18px;
  color: var(--gb-magenta);
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

@media (max-width: 768px) {
  .solicitar-view {
    padding: 16px 16px 72px;
  }
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
