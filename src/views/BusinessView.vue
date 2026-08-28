<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import gsap from 'gsap'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { logout } = useAuth()

const carregando = ref(true)
const erro = ref('')
const agencia = ref(null)
const salvando = ref(false)
const salvo = ref(false)
const enviandoCapa = ref(false)
const enviandoGaleria = ref(false)

// Mesmo padrão do AgenciaView — hero sempre primeiro (só a variante dele
// muda), as outras três seções centrais podem trocar de ordem entre si.
// As demais (galeria, vídeo, equipe...) são opcionais — só entram no
// layout quando a agência clica pra adicionar (ver SECOES_ADICIONAIS).
const LAYOUT_PADRAO = [
  { tipo: 'hero', variante: 'foto' },
  { tipo: 'como_funciona', variante: 'texto' },
  { tipo: 'catalogo', variante: 'grade' },
  { tipo: 'avaliacoes', variante: 'grade' }
]

const VARIANTES = {
  hero: [
    { valor: 'foto', label: 'Foto + nota' },
    { valor: 'banner', label: 'Banner cheio' }
  ],
  como_funciona: [
    { valor: 'texto', label: 'Só texto' },
    { valor: 'destaque', label: 'Citação em destaque' }
  ],
  catalogo: [
    { valor: 'grade', label: 'Grade' },
    { valor: 'lista', label: 'Lista' }
  ],
  avaliacoes: [
    { valor: 'grade', label: 'Grade 3 colunas' },
    { valor: 'compacta', label: 'Compacta' }
  ]
}

const LABELS = {
  hero: 'Apresentação', como_funciona: 'Como funciona', catalogo: 'Catálogo', avaliacoes: 'Avaliações',
  galeria: 'Galeria de fotos', video: 'Vídeo institucional', equipe: 'Equipe',
  certificacoes: 'Certificações e parcerias', faq: 'Perguntas frequentes',
  localizacao: 'Localização e mapa', redes_sociais: 'Redes sociais', contato_whatsapp: 'Fale conosco (WhatsApp)',
}

const TAGS = {
  hero: 'Hero', como_funciona: 'Texto', catalogo: 'Programas', avaliacoes: 'Depoimentos',
  galeria: 'Espaço', video: 'Vídeo', equipe: 'Time', certificacoes: 'Selos',
  faq: 'Dúvidas', localizacao: 'Mapa', redes_sociais: 'Social', contato_whatsapp: 'WhatsApp',
}

// As 8 seções opcionais — aparecem colapsadas até a agência clicar pra
// adicionar. Cada uma guarda seu conteúdo em conteudoBlocos[tipo] (ver
// normalizarConteudo), exceto "galeria" — essa usa upload de arquivo de
// verdade (agencia.galeria), não texto.
const SECOES_ADICIONAIS = [
  { tipo: 'galeria', icone: 'M4 5h16v14H4z M4 15l4-4 3 3 5-6 4 5' },
  { tipo: 'video', icone: 'M8 5v14l11-7z' },
  { tipo: 'equipe', icone: 'M9 7a3 3 0 100 6 3 3 0 000-6z M2 21a7 7 0 0114 0 M17 7a3 3 0 100 6 3 3 0 000-6z M16 21a7 7 0 00-4.3-13.6' },
  { tipo: 'certificacoes', icone: 'M12 3l2.9 6.3 6.9.9-5 4.9 1.2 6.9L12 17.8l-6 3.2 1.2-6.9-5-4.9 6.9-.9z' },
  { tipo: 'faq', icone: 'M12 21a9 9 0 100-18 9 9 0 000 18z M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5 M12 17h.01' },
  { tipo: 'localizacao', icone: 'M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z' },
  { tipo: 'redes_sociais', icone: 'M3 3h18v18H3z M12 12a4 4 0 100 8 4 4 0 000-8z M17.2 6.8h.01' },
  { tipo: 'contato_whatsapp', icone: 'M3 5a2 2 0 012-2h2l2 5-2.5 1.5a11 11 0 005 5L13 12l5 2v2a2 2 0 01-2 2A15 15 0 013 5z' },
]

const layout = ref([...LAYOUT_PADRAO])
const conteudoBlocos = ref(normalizarConteudo({}))
const galeria = ref([])
const focoX = ref(50)
const focoY = ref(50)
const arrastandoFoco = ref(false)
const secaoAberta = ref('hero')
const alterado = ref(false)
const arrastandoIndex = ref(null)
const sobreIndex = ref(null)
let timerSalvo = null

// Dispara em qualquer edição de texto (campos com v-model direto em
// conteudoBlocos, que não passam pelas funções mutadoras abaixo) — a
// primeira execução é sempre o carregamento inicial dos dados, não uma
// edição de verdade, por isso é ignorada.
let primeiraExecucaoWatch = true
watch(conteudoBlocos, () => {
  if (primeiraExecucaoWatch) { primeiraExecucaoWatch = false; return }
  alterado.value = true
}, { deep: true })

function normalizarConteudo(raw) {
  return {
    video: { url: '', ...raw.video },
    equipe: { membros: [], ...(raw.equipe || {}) },
    certificacoes: { itens: [], ...(raw.certificacoes || {}) },
    faq: { perguntas: [], ...(raw.faq || {}) },
    localizacao: { link_mapa: '', ...(raw.localizacao || {}) },
    redes_sociais: { instagram: '', facebook: '', tiktok: '', linkedin: '', youtube: '', ...(raw.redes_sociais || {}) },
    contato_whatsapp: { numero: '', mensagem: '', ...(raw.contato_whatsapp || {}) },
  }
}

const secoesAdicionadasTipos = computed(() => new Set(layout.value.map((b) => b.tipo)))
const secoesDisponiveis = computed(() => SECOES_ADICIONAIS.filter((s) => !secoesAdicionadasTipos.value.has(s.tipo)))

const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

function alternarAberta(tipo) {
  secaoAberta.value = secaoAberta.value === tipo ? null : tipo
}

function setVariante(tipo, valor) {
  const bloco = layout.value.find((b) => b.tipo === tipo)
  if (bloco) bloco.variante = valor
  salvo.value = false
  alterado.value = true
}

function mover(tipo, direcao) {
  const i = layout.value.findIndex((b) => b.tipo === tipo)
  const alvo = i + direcao
  if (alvo < 1 || alvo >= layout.value.length) return
  const copia = [...layout.value]
  ;[copia[i], copia[alvo]] = [copia[alvo], copia[i]]
  layout.value = copia
  salvo.value = false
  alterado.value = true
}

function adicionarSecao(tipo) {
  layout.value = [...layout.value, { tipo, variante: 'padrao' }]
  secaoAberta.value = tipo
  salvo.value = false
  alterado.value = true
}

// Cada seção "opcional" tem uma forma diferente de guardar conteúdo —
// isso só decide se remover deveria pedir confirmação (não apaga o
// conteúdo de verdade: se a agência adicionar a seção de novo antes de
// publicar, o que já tinha preenchido continua lá).
function secaoTemConteudo(tipo) {
  switch (tipo) {
    case 'galeria': return galeria.value.length > 0
    case 'video': return Boolean(conteudoBlocos.value.video.url)
    case 'equipe': return conteudoBlocos.value.equipe.membros.length > 0
    case 'certificacoes': return conteudoBlocos.value.certificacoes.itens.length > 0
    case 'faq': return conteudoBlocos.value.faq.perguntas.length > 0
    case 'localizacao': return Boolean(conteudoBlocos.value.localizacao.link_mapa)
    case 'redes_sociais': return Object.values(conteudoBlocos.value.redes_sociais).some(Boolean)
    case 'contato_whatsapp': return Boolean(conteudoBlocos.value.contato_whatsapp.numero)
    default: return false
  }
}

function removerSecao(tipo) {
  if (secaoTemConteudo(tipo)) {
    const confirmado = window.confirm(
      `Remover "${LABELS[tipo]}"? Ela some da página assim que você publicar — o que você já preencheu fica guardado e volta se adicionar a seção de novo antes disso.`
    )
    if (!confirmado) return
  }
  layout.value = layout.value.filter((b) => b.tipo !== tipo)
  if (secaoAberta.value === tipo) secaoAberta.value = null
  salvo.value = false
  alterado.value = true
}

function adicionarItem(tipoBloco, campo, vazio) {
  conteudoBlocos.value[tipoBloco][campo].push({ ...vazio })
  salvo.value = false
  alterado.value = true
}

function removerItem(tipoBloco, campo, index) {
  conteudoBlocos.value[tipoBloco][campo].splice(index, 1)
  salvo.value = false
  alterado.value = true
}

// Reordenar arrastando (mouse) — o hero fica travado na primeira posição
// sempre. Os botões de subir/descer fazem a MESMA coisa e continuam
// funcionando pra quem usa teclado ou não quer arrastar; arrastar é só
// um atalho a mais, nunca a única forma de reordenar.
function onDragStart(index) {
  if (index === 0) return
  arrastandoIndex.value = index
}

function onDropSecao(index) {
  sobreIndex.value = null
  if (arrastandoIndex.value === null || index === 0 || arrastandoIndex.value === index) {
    arrastandoIndex.value = null
    return
  }
  const copia = [...layout.value]
  const [item] = copia.splice(arrastandoIndex.value, 1)
  copia.splice(index, 0, item)
  layout.value = copia
  arrastandoIndex.value = null
  salvo.value = false
  alterado.value = true
}

function moverFoco(event, container) {
  const rect = container.getBoundingClientRect()
  const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
  const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100))
  focoX.value = Math.round(x)
  focoY.value = Math.round(y)
  salvo.value = false
  alterado.value = true
}

function iniciarArrastoFoco(event) {
  arrastandoFoco.value = true
  const container = event.currentTarget
  moverFoco(event, container)
  const onMove = (e) => moverFoco(e, container)
  const onUp = () => {
    arrastandoFoco.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// Alternativa por teclado ao arrasto do ponto focal — sem isso, quem
// navega só com teclado não conseguia ajustar o foco de jeito nenhum.
// Setas movem 2%, Shift+seta move 10%.
function ajustarFocoTeclado(event) {
  const teclas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const direcao = teclas[event.key]
  if (!direcao) return
  event.preventDefault()
  const passo = event.shiftKey ? 10 : 2
  focoX.value = Math.min(100, Math.max(0, focoX.value + direcao[0] * passo))
  focoY.value = Math.min(100, Math.max(0, focoY.value + direcao[1] * passo))
  salvo.value = false
  alterado.value = true
}

// Vídeo embutido na prévia ao vivo — mesma lógica do AgenciaView.
function videoEmbedUrl(url) {
  if (!url) return null
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/)
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

function iniciaisDe(nome) {
  if (!nome) return ''
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function estrelasTexto(nota) {
  const cheias = Math.round(nota ?? 0)
  return '★'.repeat(cheias) + '☆'.repeat(5 - cheias)
}

async function carregar() {
  carregando.value = true
  erro.value = ''

  if (!getStoredToken()) {
    router.replace({ name: 'login' })
    return
  }

  try {
    const { data: eu } = await axios.get('/usuarios/me/')
    if (eu.tipo !== 'agencia') {
      erro.value = 'Essa área é só pra contas business verificadas.'
      carregando.value = false
      return
    }
    if (!eu.agencia_id) {
      router.replace({ name: 'business-analise' })
      return
    }

    const { data } = await axios.get(`/agencia/${eu.agencia_id}/`)
    agencia.value = data
    layout.value = data.layout?.length ? data.layout.map((b) => ({ ...b })) : [...LAYOUT_PADRAO]
    conteudoBlocos.value = normalizarConteudo(data.conteudo_blocos || {})
    galeria.value = data.galeria || []
    focoX.value = data.imagem_capa_foco_x ?? 50
    focoY.value = data.imagem_capa_foco_y ?? 50
  } catch (e) {
    console.error('Erro ao carregar painel business:', e)
    erro.value = 'Não conseguimos carregar sua página agora.'
  } finally {
    carregando.value = false
  }
}

async function publicar() {
  if (!agencia.value) return
  salvando.value = true
  salvo.value = false
  try {
    await axios.patch(`/agencia/${agencia.value.id}/`, {
      layout: layout.value,
      conteudo_blocos: conteudoBlocos.value,
      imagem_capa_foco_x: focoX.value,
      imagem_capa_foco_y: focoY.value,
    })
    salvo.value = true
    alterado.value = false
    // Some sozinho — antes ficava na tela pra sempre, e depois de uma
    // segunda edição virava informação errada ("Publicado!" ao lado de
    // alterações não publicadas).
    clearTimeout(timerSalvo)
    timerSalvo = setTimeout(() => { salvo.value = false }, 2600)
  } catch (e) {
    console.error('Erro ao publicar layout:', e)
    erro.value = 'Não conseguimos salvar agora — tenta de novo em instantes.'
  } finally {
    salvando.value = false
  }
}

async function trocarCapa(event) {
  const arquivo = event.target.files?.[0]
  if (!arquivo || !agencia.value) return
  enviandoCapa.value = true
  try {
    const formData = new FormData()
    formData.append('imagem_capa', arquivo)
    const { data } = await axios.patch(`/agencia/${agencia.value.id}/capa/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    agencia.value = data
  } catch (e) {
    console.error('Erro ao trocar imagem de capa:', e)
    erro.value = 'Não conseguimos subir essa imagem agora.'
  } finally {
    enviandoCapa.value = false
    event.target.value = ''
  }
}

async function adicionarFotoGaleria(event) {
  const arquivo = event.target.files?.[0]
  if (!arquivo || !agencia.value) return
  enviandoGaleria.value = true
  try {
    const formData = new FormData()
    formData.append('imagem', arquivo)
    const { data } = await axios.post(`/agencia/${agencia.value.id}/galeria/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    galeria.value = [...galeria.value, data]
  } catch (e) {
    console.error('Erro ao subir foto da galeria:', e)
    erro.value = 'Não conseguimos subir essa foto agora.'
  } finally {
    enviandoGaleria.value = false
    event.target.value = ''
  }
}

async function removerFotoGaleria(id) {
  if (!agencia.value) return
  try {
    await axios.delete(`/agencia/${agencia.value.id}/galeria/${id}/`)
    galeria.value = galeria.value.filter((img) => img.id !== id)
  } catch (e) {
    console.error('Erro ao remover foto da galeria:', e)
  }
}

// Entrada da página — barra lateral e prévia entram juntas, com as
// seções da lateral em cascata. Mesmo vocabulário do resto do site
// (clearProps pra não deixar transform grudado depois).
let ctx
function animarEntrada() {
  if (prefersReducedMotion()) return
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'transform,opacity' } })
    tl.from('.sidebar', { opacity: 0, x: -16, duration: 0.4 })
      .from('.phone', { opacity: 0, y: 20, scale: 0.98, duration: 0.5 }, '-=0.3')
      .from('.sidebar .secao-bloco', { opacity: 0, y: 10, duration: 0.35, stagger: 0.04 }, '-=0.35')
  })
}

function avisarSaidaComEdicaoPendente(event) {
  if (!alterado.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(async () => {
  window.addEventListener('beforeunload', avisarSaidaComEdicaoPendente)
  await carregar()
  if (agencia.value) {
    await nextTick()
    animarEntrada()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', avisarSaidaComEdicaoPendente)
  ctx?.revert()
})

// Navegar pra outra rota do próprio site (ex.: clicar em "← Painel") —
// o beforeunload acima só cobre fechar a aba/recarregar.
onBeforeRouteLeave(() => {
  if (!alterado.value) return true
  return window.confirm('Você tem alterações não publicadas nessa página. Sair mesmo assim?')
})
</script>

<template>
  <div class="business-view">
    <div v-if="carregando" class="estado-tela">Carregando seu painel...</div>

    <div v-else-if="erro && !agencia" class="estado-tela">
      <p>{{ erro }}</p>
      <router-link to="/profile" class="link-voltar">Voltar pro meu perfil</router-link>
    </div>

    <template v-else-if="agencia">
      <div class="topbar">
        <div class="topbar-info">
          <router-link :to="{ name: 'business' }" class="link-voltar-painel">← Painel</router-link>
          <span class="divisor"></span>
          <h1 class="titulo-editando">Editando página — {{ agencia.nome }}</h1>
        </div>
        <div class="topbar-actions">
          <span v-if="alterado" class="msg-pendente">Alterações não publicadas</span>
          <router-link :to="{ name: 'agencia', params: { id: agencia.id } }" target="_blank" class="link-ver-pagina">Ver página pública</router-link>
          <button type="button" class="link-sair" @click="logout">Sair da conta</button>
          <span aria-live="polite">
            <Transition name="toast">
              <span v-if="salvo" class="msg-salvo">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                Publicado!
              </span>
            </Transition>
          </span>
          <button class="btn-publicar" :disabled="salvando" @click="publicar">{{ salvando ? 'Publicando...' : 'Publicar alterações' }}</button>
        </div>
      </div>

      <p v-if="erro" class="erro-inline" role="alert">{{ erro }}</p>

      <div class="editor-layout">
        <!-- ───────────────── Barra lateral ───────────────── -->
        <aside class="sidebar" data-lenis-prevent>
          <div class="sidebar-head">
            <span class="eyebrow">Monte por blocos</span>
            <p>Escolha um jeito pra cada seção, envie suas fotos e reordene o que puder mudar de lugar.</p>
          </div>

          <div
            v-for="(bloco, index) in layout"
            :key="bloco.tipo"
            class="secao-bloco"
            :class="{ 'arrastando-sobre': sobreIndex === index, 'sendo-arrastada': arrastandoIndex === index }"
            :draggable="bloco.tipo !== 'hero'"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @dragenter="arrastandoIndex !== null && index !== 0 && (sobreIndex = index)"
            @dragleave="sobreIndex === index && (sobreIndex = null)"
            @drop="onDropSecao(index)"
            @dragend="arrastandoIndex = null; sobreIndex = null"
          >
            <button
              class="secao-bloco-head"
              :id="`secao-cabecalho-${bloco.tipo}`"
              :aria-expanded="secaoAberta === bloco.tipo"
              :aria-controls="`secao-corpo-${bloco.tipo}`"
              @click="alternarAberta(bloco.tipo)"
            >
              <svg class="drag-handle" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="8" cy="6" r="1.6"/><circle cx="16" cy="6" r="1.6"/><circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/><circle cx="8" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/></svg>
              <span class="secao-label">{{ LABELS[bloco.tipo] }}</span>
              <span class="secao-tag">{{ TAGS[bloco.tipo] }}</span>
              <svg class="chevron" :class="{ aberto: secaoAberta === bloco.tipo }" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
            </button>

            <!-- Sempre renderizado (não v-if) pra altura poder animar via
                 CSS: grid-template-rows 0fr→1fr é o único jeito de animar
                 até "auto". Em troca, o corpo fechado continuaria
                 alcançável por tab — por isso o `inert`, que tira o
                 conteúdo do foco e dos leitores de tela enquanto fechado.
                 Já tentei fazer isso com animação por JS (GSAP + hooks de
                 <Transition>) e dava pra travar a seção invisível quando o
                 callback de fim não disparava; CSS puro não tem esse risco. -->
            <div
              class="secao-corpo-wrap"
              :class="{ aberta: secaoAberta === bloco.tipo }"
              :inert="secaoAberta !== bloco.tipo"
            >
            <div class="secao-corpo-inner">
            <div :id="`secao-corpo-${bloco.tipo}`" :aria-labelledby="`secao-cabecalho-${bloco.tipo}`" class="secao-corpo">
              <div class="secao-corpo-actions">
                <div v-if="bloco.tipo !== 'hero'" class="reorder-btns">
                  <button class="reorder-btn" :disabled="index <= 1" @click.stop="mover(bloco.tipo, -1)" :aria-label="`Mover ${LABELS[bloco.tipo]} pra cima`">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10l4-4 4 4"/></svg>
                  </button>
                  <button class="reorder-btn" :disabled="index >= layout.length - 1" @click.stop="mover(bloco.tipo, 1)" :aria-label="`Mover ${LABELS[bloco.tipo]} pra baixo`">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
                  </button>
                </div>
                <button v-if="!VARIANTES[bloco.tipo]" class="btn-remover-secao" @click.stop="removerSecao(bloco.tipo)">Remover seção</button>
              </div>

              <div v-if="VARIANTES[bloco.tipo]" class="variant-row">
                <button
                  v-for="v in VARIANTES[bloco.tipo]"
                  :key="v.valor"
                  class="variant-thumb"
                  :class="{ active: bloco.variante === v.valor }"
                  @click="setVariante(bloco.tipo, v.valor)"
                >
                  <span class="variant-thumb-inner" :class="`swatch-${bloco.tipo}-${v.valor}`"></span>
                  <span class="variant-name">{{ v.label }}</span>
                </button>
              </div>

              <!-- Hero: upload de capa + ponto focal -->
              <div v-if="bloco.tipo === 'hero' && bloco.variante === 'banner'" class="img-field">
                <span class="img-field-lbl">Imagem de capa</span>
                <div
                  class="foco-preview"
                  :style="agencia.imagem_capa_url ? { backgroundImage: `url(${agencia.imagem_capa_url})`, backgroundPosition: `${focoX}% ${focoY}%` } : {}"
                  :tabindex="agencia.imagem_capa_url ? 0 : -1"
                  role="group"
                  :aria-label="agencia.imagem_capa_url ? `Ponto focal da imagem: ${focoX}% horizontal, ${focoY}% vertical. Use as setas do teclado pra ajustar.` : 'Envie uma imagem pra poder ajustar o ponto focal.'"
                  @pointerdown="agencia.imagem_capa_url && iniciarArrastoFoco($event)"
                  @keydown="agencia.imagem_capa_url && ajustarFocoTeclado($event)"
                >
                  <span v-if="!agencia.imagem_capa_url" class="foco-vazio">Nenhuma imagem enviada ainda</span>
                  <div v-else class="foco-ponto" :class="{ arrastando: arrastandoFoco }" :style="{ left: focoX + '%', top: focoY + '%' }" aria-hidden="true"></div>
                </div>
                <p v-if="agencia.imagem_capa_url" class="foco-dica">Arraste o ponto (ou use as setas do teclado, com o quadro focado) pra escolher o que fica visível quando a tela cortar a imagem.</p>
                <label class="dropzone">
                  <input type="file" accept="image/*" @change="trocarCapa" :disabled="enviandoCapa" class="sr-only-input" aria-label="Enviar imagem de capa">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gb-magenta)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M8 11l4 4 4-4"/><path d="M4 19h16"/></svg>
                  <span>{{ enviandoCapa ? 'Enviando...' : (agencia.imagem_capa_url ? 'Trocar imagem' : 'Enviar imagem') }} — JPG ou PNG, até 5MB</span>
                </label>
              </div>

              <!-- Galeria de fotos -->
              <div v-if="bloco.tipo === 'galeria'" class="bloco-conteudo">
                <div class="galeria-grid">
                  <div v-for="img in galeria" :key="img.id" class="galeria-slot filled" :style="{ backgroundImage: `url(${img.url})` }">
                    <button class="galeria-remover" @click="removerFotoGaleria(img.id)" aria-label="Remover esta foto da galeria">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
                    </button>
                  </div>
                  <label class="galeria-slot vazio">
                    <input type="file" accept="image/*" @change="adicionarFotoGaleria" :disabled="enviandoGaleria" class="sr-only-input" aria-label="Adicionar foto à galeria">
                    <svg v-if="!enviandoGaleria" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                    <span v-else style="font-size: 0.7rem;">Enviando...</span>
                  </label>
                </div>
                <p class="bloco-dica">Fotos da agência, do espaço ou dos alunos. Aparece em grade na página.</p>
              </div>

              <!-- Vídeo institucional -->
              <div v-if="bloco.tipo === 'video'" class="bloco-conteudo">
                <label class="campo-label" :for="`campo-video-url`">Link do vídeo (YouTube, Vimeo...)</label>
                <input :id="`campo-video-url`" type="text" v-model="conteudoBlocos.video.url" placeholder="https://youtube.com/watch?v=..." class="campo-input">
              </div>

              <!-- Equipe -->
              <div v-if="bloco.tipo === 'equipe'" class="bloco-conteudo">
                <div v-for="(membro, i) in conteudoBlocos.equipe.membros" :key="i" class="item-lista">
                  <input type="text" v-model="membro.nome" placeholder="Nome" class="campo-input" :aria-label="`Nome da pessoa ${i + 1} da equipe`">
                  <input type="text" v-model="membro.cargo" placeholder="Cargo" class="campo-input" :aria-label="`Cargo da pessoa ${i + 1} da equipe`">
                  <button class="btn-remover-item" @click="removerItem('equipe', 'membros', i)" :aria-label="`Remover ${membro.nome || 'esta pessoa'} da equipe`">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
                  </button>
                </div>
                <button class="btn-add-item" @click="adicionarItem('equipe', 'membros', { nome: '', cargo: '' })">+ Adicionar pessoa</button>
              </div>

              <!-- Certificações e parcerias -->
              <div v-if="bloco.tipo === 'certificacoes'" class="bloco-conteudo">
                <div v-for="(item, i) in conteudoBlocos.certificacoes.itens" :key="i" class="item-lista">
                  <input type="text" v-model="item.nome" placeholder="Nome (ex: British Council)" class="campo-input" :aria-label="`Nome da certificação ${i + 1}`">
                  <input type="text" v-model="item.descricao" placeholder="Descrição curta" class="campo-input" :aria-label="`Descrição da certificação ${i + 1}`">
                  <button class="btn-remover-item" @click="removerItem('certificacoes', 'itens', i)" :aria-label="`Remover ${item.nome || 'esta certificação'}`">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
                  </button>
                </div>
                <button class="btn-add-item" @click="adicionarItem('certificacoes', 'itens', { nome: '', descricao: '' })">+ Adicionar certificação</button>
              </div>

              <!-- FAQ -->
              <div v-if="bloco.tipo === 'faq'" class="bloco-conteudo">
                <div v-for="(item, i) in conteudoBlocos.faq.perguntas" :key="i" class="item-lista item-lista-coluna">
                  <input type="text" v-model="item.pergunta" placeholder="Pergunta" class="campo-input" :aria-label="`Pergunta ${i + 1}`">
                  <textarea v-model="item.resposta" placeholder="Resposta" class="campo-textarea" rows="2" :aria-label="`Resposta da pergunta ${i + 1}`"></textarea>
                  <button class="btn-remover-item" @click="removerItem('faq', 'perguntas', i)">Remover</button>
                </div>
                <button class="btn-add-item" @click="adicionarItem('faq', 'perguntas', { pergunta: '', resposta: '' })">+ Adicionar pergunta</button>
              </div>

              <!-- Localização e mapa -->
              <div v-if="bloco.tipo === 'localizacao'" class="bloco-conteudo">
                <label class="campo-label" for="campo-link-mapa">Link do Google Maps (opcional)</label>
                <input id="campo-link-mapa" type="text" v-model="conteudoBlocos.localizacao.link_mapa" placeholder="https://maps.google.com/..." class="campo-input">
                <p class="bloco-dica">O endereço ({{ agencia.endereco }}) já aparece automaticamente — esse link vira um botão "Ver no mapa".</p>
              </div>

              <!-- Redes sociais -->
              <div v-if="bloco.tipo === 'redes_sociais'" class="bloco-conteudo">
                <input type="text" v-model="conteudoBlocos.redes_sociais.instagram" placeholder="Instagram (link)" class="campo-input" aria-label="Link do Instagram">
                <input type="text" v-model="conteudoBlocos.redes_sociais.facebook" placeholder="Facebook (link)" class="campo-input" aria-label="Link do Facebook">
                <input type="text" v-model="conteudoBlocos.redes_sociais.tiktok" placeholder="TikTok (link)" class="campo-input" aria-label="Link do TikTok">
                <input type="text" v-model="conteudoBlocos.redes_sociais.linkedin" placeholder="LinkedIn (link)" class="campo-input" aria-label="Link do LinkedIn">
                <input type="text" v-model="conteudoBlocos.redes_sociais.youtube" placeholder="YouTube (link)" class="campo-input" aria-label="Link do YouTube">
              </div>

              <!-- Fale conosco (WhatsApp) -->
              <div v-if="bloco.tipo === 'contato_whatsapp'" class="bloco-conteudo">
                <input type="text" v-model="conteudoBlocos.contato_whatsapp.numero" placeholder="Número (com DDI, ex: 5511999999999)" class="campo-input" aria-label="Número do WhatsApp com DDI">
                <input type="text" v-model="conteudoBlocos.contato_whatsapp.mensagem" placeholder="Mensagem inicial (opcional)" class="campo-input" aria-label="Mensagem inicial do WhatsApp">
              </div>
            </div>
            </div>
            </div>
          </div>

          <template v-if="secoesDisponiveis.length">
            <div class="group-header">Mostre mais</div>
            <button v-for="s in secoesDisponiveis" :key="s.tipo" class="secao-collapsed" @click="adicionarSecao(s.tipo)">
              <span class="add-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path :d="s.icone"/></svg></span>
              <span class="secao-label">{{ LABELS[s.tipo] }}</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#757067" stroke-width="1.6"><path d="M4 6l4 4 4-4"/></svg>
            </button>
          </template>
        </aside>

        <!-- ───────────────── Prévia ao vivo ─────────────────
             É um espelho visual do que a página pública vai mostrar, não
             conteúdo navegável de verdade (quem edita usa os campos da
             barra lateral) — aria-hidden pra não duplicar títulos/headings
             da página do editor nem confundir quem usa leitor de tela. -->
        <div class="canvas" aria-hidden="true" data-lenis-prevent>
          <div class="phone">
            <template v-for="bloco in layout" :key="'preview-' + bloco.tipo">

              <div v-if="bloco.tipo === 'hero' && bloco.variante === 'banner'" class="p-hero-banner" :style="agencia.imagem_capa_url ? { backgroundImage: `url(${agencia.imagem_capa_url})`, backgroundPosition: `${focoX}% ${focoY}%` } : {}">
                <div class="p-hero-banner-scrim"></div>
                <div class="p-hero-banner-content">
                  <span class="p-stars">{{ estrelasTexto(agencia.nota_media) }} <span class="p-rating">{{ agencia.nota_media ?? '—' }} · {{ agencia.cidade }}, {{ agencia.pais }}</span></span>
                  <h1 class="p-title">{{ agencia.nome }}</h1>
                </div>
              </div>
              <div v-else-if="bloco.tipo === 'hero'" class="p-hero-foto">
                <div class="p-avatar">{{ iniciaisDe(agencia.nome) }}</div>
                <div>
                  <span class="p-stars">{{ estrelasTexto(agencia.nota_media) }} <span class="p-rating">{{ agencia.nota_media ?? '—' }}</span></span>
                  <h1 class="p-title">{{ agencia.nome }}</h1>
                </div>
              </div>

              <div v-else-if="bloco.tipo === 'como_funciona'" class="p-block">
                <span class="p-eyebrow">Como funciona</span>
                <blockquote v-if="bloco.variante === 'destaque'" class="p-quote">"{{ agencia.como_funciona || 'Conte como funciona o processo.' }}"</blockquote>
                <p v-else class="p-texto">{{ agencia.como_funciona || 'Conte como funciona o processo.' }}</p>
              </div>

              <div v-else-if="bloco.tipo === 'catalogo'" class="p-block">
                <span class="p-eyebrow">Catálogo</span>
                <div class="p-catalogo-grid" :class="{ 'p-catalogo-lista': bloco.variante === 'lista' }">
                  <div v-for="plano in agencia.planos.slice(0, 2)" :key="plano.id" class="p-card">
                    <span class="p-card-tag">Programa</span>
                    <strong>{{ plano.programa_nome }}</strong>
                  </div>
                  <div v-if="!agencia.planos.length" class="p-card p-card-vazio">Sem programas ainda</div>
                </div>
              </div>

              <div v-else-if="bloco.tipo === 'avaliacoes'" class="p-block">
                <span class="p-eyebrow">Avaliações</span>
                <div class="p-avaliacoes-grid" :class="{ 'p-avaliacoes-compacta': bloco.variante === 'compacta' }">
                  <div v-if="!agencia.total_avaliacoes" class="p-card p-card-vazio">Sem avaliações ainda</div>
                  <div v-for="n in Math.min(agencia.total_avaliacoes, 3)" :key="n" class="p-card"></div>
                </div>
              </div>

              <div v-else-if="bloco.tipo === 'galeria'" class="p-block">
                <span class="p-eyebrow">Galeria de fotos</span>
                <div class="p-galeria-grid">
                  <div v-for="img in galeria" :key="img.id" class="p-galeria-item" :style="{ backgroundImage: `url(${img.url})` }"></div>
                  <div v-if="!galeria.length" class="p-galeria-item p-galeria-vazia"></div>
                </div>
              </div>

              <div v-else-if="bloco.tipo === 'video'" class="p-block">
                <span class="p-eyebrow">Vídeo institucional</span>
                <div v-if="videoEmbedUrl(conteudoBlocos.video.url)" class="p-video-wrap"><iframe :src="videoEmbedUrl(conteudoBlocos.video.url)" frameborder="0"></iframe></div>
                <div v-else class="p-card p-card-vazio">Cole um link de vídeo</div>
              </div>

              <div v-else-if="bloco.tipo === 'equipe'" class="p-block">
                <span class="p-eyebrow">Equipe</span>
                <div class="p-equipe-grid">
                  <div v-for="(m, i) in conteudoBlocos.equipe.membros" :key="i" class="p-equipe-card">
                    <div class="p-avatar-sm">{{ iniciaisDe(m.nome) || '?' }}</div>
                    <strong>{{ m.nome || 'Nome' }}</strong>
                    <span>{{ m.cargo || 'Cargo' }}</span>
                  </div>
                  <div v-if="!conteudoBlocos.equipe.membros.length" class="p-card p-card-vazio">Adicione pessoas da equipe</div>
                </div>
              </div>

              <div v-else-if="bloco.tipo === 'certificacoes'" class="p-block">
                <span class="p-eyebrow">Certificações e parcerias</span>
                <div class="p-certificacoes-grid">
                  <div v-for="(c, i) in conteudoBlocos.certificacoes.itens" :key="i" class="p-cert-card">
                    <strong>{{ c.nome || 'Nome' }}</strong>
                  </div>
                  <div v-if="!conteudoBlocos.certificacoes.itens.length" class="p-card p-card-vazio">Adicione certificações</div>
                </div>
              </div>

              <div v-else-if="bloco.tipo === 'faq'" class="p-block">
                <span class="p-eyebrow">Perguntas frequentes</span>
                <div v-for="(f, i) in conteudoBlocos.faq.perguntas" :key="i" class="p-faq-item">{{ f.pergunta || 'Pergunta' }}</div>
                <div v-if="!conteudoBlocos.faq.perguntas.length" class="p-card p-card-vazio">Adicione perguntas</div>
              </div>

              <div v-else-if="bloco.tipo === 'localizacao'" class="p-block">
                <span class="p-eyebrow">Localização</span>
                <p class="p-texto">{{ agencia.endereco }}</p>
              </div>

              <div v-else-if="bloco.tipo === 'redes_sociais'" class="p-block">
                <span class="p-eyebrow">Redes sociais</span>
                <div class="p-redes-row">
                  <span v-if="conteudoBlocos.redes_sociais.instagram" class="p-rede-chip">Instagram</span>
                  <span v-if="conteudoBlocos.redes_sociais.facebook" class="p-rede-chip">Facebook</span>
                  <span v-if="conteudoBlocos.redes_sociais.tiktok" class="p-rede-chip">TikTok</span>
                  <span v-if="conteudoBlocos.redes_sociais.linkedin" class="p-rede-chip">LinkedIn</span>
                  <span v-if="conteudoBlocos.redes_sociais.youtube" class="p-rede-chip">YouTube</span>
                  <span v-if="!Object.values(conteudoBlocos.redes_sociais).some(Boolean)" class="p-card p-card-vazio">Cole os links das redes</span>
                </div>
              </div>

              <div v-else-if="bloco.tipo === 'contato_whatsapp'" class="p-block">
                <span class="p-eyebrow">Fale conosco</span>
                <div class="p-whatsapp-btn">Conversar no WhatsApp</div>
              </div>

            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.business-view {
  min-height: 100vh;
  background: #FFFFFF;
  font-family: 'Montserrat', sans-serif;
  /* O header do site não flutua mais por cima dessa página (ver
     headerFlutuante em HeaderComponent.vue / router/index.js) — entra no
     fluxo normal acima do topbar dark, então não precisa mais de
     padding-top pra compensar nada. */
}

.estado-tela {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--gb-ink-soft);
  text-align: center;
  padding: 24px;
}

.link-voltar {
  color: var(--gb-magenta);
  font-weight: 600;
}

.topbar {
  height: 64px;
  background: var(--gb-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: #fff;
  flex-shrink: 0;
}

.topbar-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.link-voltar-painel {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}
.link-voltar-painel:hover { color: #fff; }

.divisor {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.titulo-editando {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.link-ver-pagina {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: underline;
}

.link-sair {
  font-family: inherit;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.7);
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
  color: #3D9A4B;
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

/* Só visualmente escondido — continua no fluxo de tab e recebe foco de
   teclado (Enter/Espaço abrem o seletor de arquivo). display:none ou o
   atributo hidden tiram o elemento da árvore de acessibilidade inteira,
   o que deixava o upload de imagem impossível de usar só com teclado. */
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

.btn-publicar {
  background: var(--gb-magenta);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-publicar:disabled { opacity: 0.6; cursor: default; }

.erro-inline {
  max-width: 720px;
  margin: 16px auto 0;
  padding: 12px 16px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  border-radius: 10px;
  font-size: 0.85rem;
}

/* ───────────── Layout de duas colunas: barra lateral + prévia ───────────── */
.editor-layout {
  display: flex;
  height: calc(100vh - 64px - 96px);
}

.sidebar {
  width: 380px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid var(--gb-purple-deep-16);
  overflow-y: auto;
}

.sidebar-head {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--gb-purple-deep-16);
}
.sidebar-head .eyebrow {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gb-magenta);
}
.sidebar-head p {
  font-size: 0.8rem;
  color: var(--gb-ink-soft);
  line-height: 1.5;
  margin-top: 8px;
}

.secao-bloco {
  border-bottom: 1px solid var(--gb-purple-deep-16);
  transition: background 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}
.secao-bloco.arrastando-sobre {
  background: rgba(176, 31, 176, 0.04);
  box-shadow: inset 0 2px 0 var(--gb-magenta);
}
/* A própria seção sendo arrastada desbota, pra ficar claro qual está
   "na mão" e qual é o alvo (a que tem a linha magenta em cima). */
.secao-bloco.sendo-arrastada { opacity: 0.45; }
.secao-bloco[draggable='true'] .drag-handle { cursor: grab; }
.secao-bloco.sendo-arrastada .drag-handle { cursor: grabbing; }

.secao-bloco-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  cursor: pointer;
  background: none;
  border: none;
  text-align: left;
}
.secao-bloco-head:hover { background: rgba(46, 10, 46, 0.02); }

.drag-handle { color: var(--gb-purple-deep-16); flex-shrink: 0; }

.secao-label {
  flex: 1;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--gb-dark);
}

.secao-tag {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--gb-ink-soft);
  background: rgba(46, 10, 46, 0.06);
  padding: 3px 8px;
  border-radius: 20px;
}

/* Foco de teclado visível — a barra lateral inteira é feita de <button>
   sem estilo nativo, então sem isso um usuário de teclado não via onde
   estava. */
.secao-bloco-head:focus-visible,
.secao-collapsed:focus-visible,
.reorder-btn:focus-visible,
.btn-remover-secao:focus-visible,
.btn-remover-item:focus-visible,
.btn-add-item:focus-visible,
.variant-thumb:focus-visible,
.galeria-remover:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

.dropzone:focus-within,
.galeria-slot:focus-within {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

.foco-preview:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 3px;
}

.chevron { color: var(--gb-ink-faint); transition: transform 0.25s cubic-bezier(.4,0,.2,1); flex-shrink: 0; }
.chevron.aberto { transform: rotate(180deg); }

.btn-publicar { transition: background 0.15s ease, transform 0.1s ease; }
.btn-publicar:not(:disabled):hover { background: var(--gb-magenta-strong); }
.btn-publicar:not(:disabled):active { transform: scale(0.96); }

.secao-collapsed .add-icon { transition: transform 0.18s cubic-bezier(.16,1,.3,1); }
.secao-collapsed:hover .add-icon { transform: scale(1.12) rotate(-6deg); }

@media (prefers-reduced-motion: reduce) {
  .chevron, .variant-thumb, .secao-bloco, .btn-publicar,
  .secao-collapsed .add-icon, .toast-enter-active, .toast-leave-active,
  .secao-corpo-wrap, .secao-corpo-wrap .secao-corpo { transition: none; }
  .variant-thumb:hover, .variant-thumb.active, .secao-collapsed:hover .add-icon { transform: none; }
}

.secao-corpo-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(.4, 0, .2, 1);
}
.secao-corpo-wrap.aberta { grid-template-rows: 1fr; }
.secao-corpo-inner { overflow: hidden; }
.secao-corpo-wrap .secao-corpo {
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.secao-corpo-wrap.aberta .secao-corpo {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.06s;
}

.secao-corpo { padding: 0 20px 18px; }

.secao-corpo-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
}

.reorder-btns { display: flex; gap: 4px; }

.reorder-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--gb-purple-deep-16);
  background: #fff;
  color: var(--gb-ink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.reorder-btn:disabled { opacity: 0.3; cursor: default; }
.reorder-btn:not(:disabled):hover { border-color: var(--gb-magenta); color: var(--gb-magenta); }

.btn-remover-secao {
  background: none;
  border: none;
  color: var(--gb-ink-faint);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-remover-secao:hover { color: #dc2626; }

.variant-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.variant-thumb {
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  background: none;
  padding: 0;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.18s cubic-bezier(.16,1,.3,1);
}
.variant-thumb:hover { transform: translateY(-2px); }
.variant-thumb:active { transform: scale(0.97); }
.variant-thumb.active { border-color: var(--gb-magenta); transform: scale(1.02); }
.variant-thumb.active .variant-name { color: var(--gb-magenta-strong); }

.variant-thumb-inner {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px 6px 0 0;
}

.variant-name {
  display: block;
  font-size: 11px;
  text-align: center;
  padding: 5px 2px;
  color: var(--gb-ink-soft);
  font-weight: 600;
  background: #FAF7F0;
}

/* Miniaturas das variantes — pequenas representações visuais, não texto */
.swatch-hero-foto { background: var(--gb-dark); position: relative; }
.swatch-hero-foto::after { content: ''; width: 18px; height: 18px; border-radius: 50%; background: var(--gb-magenta); }
.swatch-hero-banner { background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep)); }
.swatch-como_funciona-texto { background: #fff; border-bottom: 1px solid var(--gb-purple-deep-16); display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; }
.swatch-como_funciona-texto::before, .swatch-como_funciona-texto::after { content: ''; height: 3px; background: var(--gb-purple-deep-16); border-radius: 2px; }
.swatch-como_funciona-destaque { background: #fff; border-bottom: 1px solid var(--gb-purple-deep-16); border-left: 3px solid var(--gb-magenta); }
.swatch-catalogo-grade { background: #fff; border-bottom: 1px solid var(--gb-purple-deep-16); display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 10px; }
.swatch-catalogo-grade::before, .swatch-catalogo-grade::after { content: ''; background: var(--gb-purple-deep-16); border-radius: 3px; }
.swatch-catalogo-lista { background: #fff; border-bottom: 1px solid var(--gb-purple-deep-16); display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; }
.swatch-catalogo-lista::before, .swatch-catalogo-lista::after { content: ''; height: 8px; background: var(--gb-purple-deep-16); border-radius: 3px; }
.swatch-avaliacoes-grade { background: #fff; border-bottom: 1px solid var(--gb-purple-deep-16); display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; padding: 10px; }
.swatch-avaliacoes-grade::before, .swatch-avaliacoes-grade::after { content: ''; background: var(--gb-purple-deep-16); border-radius: 3px; }
.swatch-avaliacoes-compacta { background: #fff; border-bottom: 1px solid var(--gb-purple-deep-16); display: flex; align-items: center; justify-content: center; }
.swatch-avaliacoes-compacta::before { content: '4.7'; font-family: var(--gb-font-display); font-weight: 900; font-size: 1.1rem; color: var(--gb-magenta); }

.img-field, .bloco-conteudo {
  padding-top: 14px;
  border-top: 1px solid var(--gb-purple-deep-16);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.img-field-lbl, .campo-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gb-ink-soft);
  display: block;
}

.foco-preview {
  position: relative;
  width: 100%;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--gb-dark);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
  touch-action: none;
}
.foco-vazio { color: rgba(255,255,255,0.5); font-size: 0.75rem; }
.foco-ponto {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2.5px solid var(--gb-magenta);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.foco-ponto.arrastando { cursor: grabbing; }
.foco-dica { font-size: 11px; color: var(--gb-ink-soft); line-height: 1.4; }

.dropzone {
  border: 1.5px dashed var(--gb-purple-deep-16);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.dropzone:hover { border-color: var(--gb-magenta); }
.dropzone span { font-size: 11px; color: var(--gb-ink-soft); }

.bloco-dica { font-size: 11px; color: var(--gb-ink-soft); line-height: 1.4; }

.campo-input, .campo-textarea {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: 'Montserrat', sans-serif;
  color: var(--gb-dark);
  background: #fff;
}
.campo-input:focus, .campo-textarea:focus { outline: none; border-color: var(--gb-magenta); }
.campo-textarea { resize: vertical; }

.item-lista { display: flex; gap: 6px; align-items: center; }
.item-lista-coluna { flex-direction: column; align-items: stretch; }

.btn-remover-item {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid var(--gb-purple-deep-16);
  background: #fff;
  color: var(--gb-ink-faint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.item-lista-coluna .btn-remover-item { width: auto; align-self: flex-end; padding: 4px 10px; font-size: 0.72rem; }
.btn-remover-item:hover { border-color: #dc2626; color: #dc2626; }

.btn-add-item {
  align-self: flex-start;
  background: none;
  border: 1.5px dashed var(--gb-purple-deep-16);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--gb-ink-soft);
  cursor: pointer;
}
.btn-add-item:hover { border-color: var(--gb-magenta); color: var(--gb-magenta-strong); }

.galeria-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.galeria-slot { aspect-ratio: 1; border-radius: 6px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; position: relative; }
.galeria-slot.vazio { border: 1.5px dashed var(--gb-purple-deep-16); color: var(--gb-purple-deep-16); cursor: pointer; }
.galeria-slot.vazio:hover { border-color: var(--gb-magenta); color: var(--gb-magenta); }
.galeria-remover { position: absolute; top: 2px; right: 2px; width: 26px; height: 26px; border-radius: 6px; background: rgba(23, 17, 26, 0.7); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.group-header {
  padding: 16px 20px 8px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  background: #FAF7F0;
}

.secao-collapsed {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--gb-purple-deep-16);
  cursor: pointer;
  background: none;
  border-left: none; border-right: none; border-top: none;
  text-align: left;
}
.secao-collapsed:hover { background: rgba(46, 10, 46, 0.02); }

.add-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(176, 31, 176, 0.1);
  color: var(--gb-magenta);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ───────────────── Prévia (canvas) ───────────────── */
.canvas {
  flex: 1;
  overflow-y: auto;
  background: #F4F4F5;
  padding: 32px;
}

.phone {
  max-width: 400px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(23, 17, 26, 0.12);
  border: 1px solid var(--gb-purple-deep-16);
}

.p-hero-banner {
  position: relative;
  min-height: 200px;
  background-color: var(--gb-dark);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
}
.p-hero-banner-scrim { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(23,17,26,0.88) 15%, rgba(23,17,26,0.1) 65%); }
.p-hero-banner-content { position: relative; padding: 24px; color: #fff; }
.p-hero-foto { display: flex; align-items: center; gap: 14px; padding: 24px; }
.p-avatar {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-family: var(--gb-font-display); font-weight: 900; font-size: 18px;
}
.p-stars { color: var(--gb-magenta); letter-spacing: 1px; font-size: 0.75rem; }
.p-hero-banner .p-stars { color: var(--gb-magenta); }
.p-rating { color: rgba(23,17,26,0.6); font-size: 0.7rem; margin-left: 4px; }
.p-hero-banner-content .p-rating { color: rgba(255,255,255,0.7); }
.p-title { font-family: var(--gb-font-display); font-weight: 900; text-transform: uppercase; font-size: 1.2rem; margin: 4px 0 0; letter-spacing: -0.01em; color: var(--gb-dark); }
.p-hero-banner-content .p-title { color: #fff; }

.p-block { padding: 24px; border-top: 1px solid var(--gb-purple-deep-16); }
.p-eyebrow {
  font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--gb-mauve);
  display: block; margin-bottom: 10px;
}
.p-texto { font-size: 0.78rem; color: var(--gb-ink-soft); line-height: 1.5; margin: 0; }
.p-quote { font-style: italic; color: var(--gb-magenta-strong); border-left: 2px solid var(--gb-magenta); padding-left: 12px; margin: 0; font-size: 0.85rem; }

.p-card {
  background: #fff; border: 1px solid var(--gb-purple-deep-16); border-radius: 8px;
  padding: 12px; display: flex; flex-direction: column; gap: 4px;
}
.p-card strong { font-size: 0.78rem; }
.p-card-vazio { color: var(--gb-ink-faint); font-size: 0.72rem; justify-content: center; align-items: center; text-align: center; grid-column: 1 / -1; }
.p-card-tag {
  font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 8px; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 2px 7px; border-radius: 20px; background: rgba(57,114,222,0.12);
  color: #2a56ad; width: fit-content;
}

.p-catalogo-grid, .p-avaliacoes-grid, .p-equipe-grid, .p-certificacoes-grid, .p-galeria-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.p-catalogo-lista { grid-template-columns: 1fr; }
.p-avaliacoes-grid { grid-template-columns: 1fr 1fr 1fr; }
.p-avaliacoes-compacta { grid-template-columns: 1fr; }
.p-avaliacoes-grid .p-card { height: 40px; }

.p-galeria-item { aspect-ratio: 1; border-radius: 6px; background-size: cover; background-position: center; background-color: #ece9e3; }
.p-galeria-vazia { border: 1.5px dashed var(--gb-purple-deep-16); }

.p-video-wrap { position: relative; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; }
.p-video-wrap iframe { width: 100%; height: 100%; border: none; }

.p-equipe-card { align-items: center; text-align: center; }
.p-avatar-sm { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; margin-bottom: 4px; }
.p-equipe-card span { font-size: 0.68rem; color: var(--gb-ink-faint); }

.p-cert-card { align-items: center; text-align: center; }

.p-faq-item { font-size: 0.76rem; padding: 8px 0; border-top: 1px solid var(--gb-purple-deep-16); color: var(--gb-dark); font-weight: 600; }

.p-redes-row { display: flex; flex-wrap: wrap; gap: 6px; }
.p-rede-chip { background: rgba(46,10,46,0.05); border-radius: 20px; padding: 5px 10px; font-size: 0.68rem; font-weight: 600; color: var(--gb-ink-soft); }

.p-whatsapp-btn { background: #25D366; color: #fff; border-radius: 8px; padding: 10px; text-align: center; font-size: 0.78rem; font-weight: 700; }

@media (max-width: 960px) {
  .editor-layout { flex-direction: column; height: auto; }
  .sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--gb-purple-deep-16); }
  .canvas { padding: 24px 16px; }
}
</style>
