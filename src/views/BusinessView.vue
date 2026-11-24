<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import gsap from 'gsap'
import { getAgenciaDetalhe, atualizarAgencia } from '@/services/api'
import { sanitizarUrl } from '@/utils/url'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { useContaBusiness } from '@/composables/useContaBusiness'
import { LAYOUT_PADRAO, LABELS, normalizarConteudo, secaoTemConteudo } from '@/components/business/secoes'
import EditorTopbar from '@/components/business/EditorTopbar.vue'
import EditorSidebar from '@/components/business/EditorSidebar.vue'
import CapaFocoEditor from '@/components/business/CapaFocoEditor.vue'
import GaleriaEditor from '@/components/business/GaleriaEditor.vue'
import SecaoConteudoEditor from '@/components/business/SecaoConteudoEditor.vue'
import PreviaPagina from '@/components/business/PreviaPagina.vue'

const { carregando, erro, carregarConta } = useContaBusiness('Não conseguimos carregar sua página agora.')

const agencia = ref(null)
const salvando = ref(false)
const salvo = ref(false)
const layout = ref([...LAYOUT_PADRAO])
const conteudoBlocos = ref(normalizarConteudo({}))
const galeria = ref([])
const focoX = ref(50)
const focoY = ref(50)
const descricao = ref('')
const comoFunciona = ref('')
const secaoAberta = ref('hero')
const alterado = ref(false)
let timerSalvo = null

function marcarAlterado() {
  salvo.value = false
  alterado.value = true
}

let primeiraExecucaoWatch = true
watch(conteudoBlocos, () => {
  if (primeiraExecucaoWatch) { primeiraExecucaoWatch = false; return }
  alterado.value = true
}, { deep: true })

function removerSecao(tipo) {
  if (secaoTemConteudo(tipo, conteudoBlocos.value, galeria.value)) {
    const confirmado = window.confirm(
      `Remover "${LABELS[tipo]}"? Ela some da página assim que você publicar — o que você já preencheu fica guardado e volta se adicionar a seção de novo antes disso.`
    )
    if (!confirmado) return
  }
  layout.value = layout.value.filter((b) => b.tipo !== tipo)
  if (secaoAberta.value === tipo) secaoAberta.value = null
  marcarAlterado()
}

const carregar = () => carregarConta(async (agenciaId) => {
  const data = await getAgenciaDetalhe(agenciaId)
  agencia.value = data
  layout.value = data.layout?.length ? data.layout.map((b) => ({ ...b })) : [...LAYOUT_PADRAO]
  conteudoBlocos.value = normalizarConteudo(data.conteudo_blocos || {})
  galeria.value = data.galeria || []
  focoX.value = data.imagem_capa_foco_x ?? 50
  focoY.value = data.imagem_capa_foco_y ?? 50
  descricao.value = data.descricao || ''
  comoFunciona.value = data.como_funciona || ''
})

function normalizarUrlsBlocos(blocos) {
  const pares = [
    [blocos.video, 'url'],
    [blocos.localizacao, 'link_mapa'],
    ...Object.keys(blocos.redes_sociais || {}).map((k) => [blocos.redes_sociais, k]),
  ]
  for (const [obj, chave] of pares) {
    const valor = obj?.[chave]?.trim()
    if (!valor) continue
    const limpa = sanitizarUrl(valor)
    if (!limpa) return false
    obj[chave] = limpa
  }
  return true
}

async function publicar() {
  if (!agencia.value) return
  erro.value = ''
  if (!normalizarUrlsBlocos(conteudoBlocos.value)) {
    erro.value = 'Verifique os links informados (redes sociais, vídeo ou mapa). Use endereços válidos começando com https://'
    return
  }
  salvando.value = true
  salvo.value = false
  try {
    const atualizada = await atualizarAgencia(agencia.value.id, {
      layout: layout.value,
      conteudo_blocos: conteudoBlocos.value,
      imagem_capa_foco_x: focoX.value,
      imagem_capa_foco_y: focoY.value,
      descricao: descricao.value.trim(),
      como_funciona: comoFunciona.value.trim(),
    })
    agencia.value = atualizada
    salvo.value = true
    alterado.value = false
    clearTimeout(timerSalvo)
    timerSalvo = setTimeout(() => { salvo.value = false }, 2600)
  } catch (e) {
    console.error('Erro ao publicar layout:', e)
    erro.value = 'Não conseguimos salvar agora — tente de novo em instantes.'
  } finally {
    salvando.value = false
  }
}

// Entrada da página — barra lateral e prévia entram juntas, com as
// seções da lateral em cascata. Mesmo vocabulário do resto do site
// (clearProps pra não deixar transform grudado depois).
let ctx
function animarEntrada() {
  if (prefersReducedMotion()) return
  ctx?.revert()
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } })
    tl.from('.topbar-info', { opacity: 0, x: -18, duration: 0.42 })
      .from('.topbar-actions > *', { opacity: 0, y: 10, duration: 0.34, stagger: 0.05 }, '-=0.28')
      .from('.sidebar', { opacity: 0, x: -18, duration: 0.45 }, '-=0.25')
      .from('.sidebar .secao-bloco, .sidebar .secao-collapsed', { opacity: 0, y: 10, duration: 0.34, stagger: 0.035 }, '-=0.32')
      .from('.preview-toolbar', { opacity: 0, y: -10, duration: 0.35 }, '-=0.35')
      .from('.phone', { opacity: 0, y: 22, duration: 0.5 }, '-=0.3')
      .from('.phone .p-block', { opacity: 0, y: 12, duration: 0.35, stagger: 0.05 }, '-=0.25')
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
      <EditorTopbar :agencia="agencia" :alterado="alterado" :salvo="salvo" :salvando="salvando" @publicar="publicar" />

      <p v-if="erro" class="erro-inline" role="alert">{{ erro }}</p>

      <div class="editor-layout">
        <EditorSidebar
          v-model:layout="layout"
          v-model:secao-aberta="secaoAberta"
          @alterado="marcarAlterado"
          @remover="removerSecao"
        >
          <template #default="{ bloco }">
            <CapaFocoEditor
              v-if="bloco.tipo === 'hero' && bloco.variante === 'banner'"
              v-model:foco-x="focoX"
              v-model:foco-y="focoY"
              :agencia="agencia"
              @alterado="marcarAlterado"
              @capa-atualizada="agencia = $event"
              @erro="erro = $event"
            />
            <GaleriaEditor v-if="bloco.tipo === 'galeria'" v-model="galeria" :agencia-id="agencia.id" @erro="erro = $event" />
            <SecaoConteudoEditor
              v-else
              v-model="conteudoBlocos"
              v-model:descricao="descricao"
              v-model:como-funciona="comoFunciona"
              :tipo="bloco.tipo"
              :endereco="agencia.endereco"
              @alterado="marcarAlterado"
            />
          </template>
        </EditorSidebar>

        <PreviaPagina
          :agencia="agencia"
          :layout="layout"
          :galeria="galeria"
          :conteudo="conteudoBlocos"
          :foco-x="focoX"
          :foco-y="focoY"
          :descricao="descricao"
          :como-funciona="comoFunciona"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.business-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  font-family: 'Montserrat', sans-serif;
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

.erro-inline {
  max-width: 720px;
  margin: 12px auto 0;
  padding: 12px 16px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  border-radius: 10px;
  font-size: 0.85rem;
}

/* ───────────── Layout de duas colunas: barra lateral + prévia ───────────── */
.editor-layout {
  flex: 1;
  min-height: 0;
  display: flex;
}

@media (max-width: 1024px) {
  .business-view { height: auto; min-height: 100vh; }
  .editor-layout { flex-direction: column; }
}
</style>
