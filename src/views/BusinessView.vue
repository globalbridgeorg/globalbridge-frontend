<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import gsap from 'gsap'
import axios from '@/services/axios'
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
const secaoAberta = ref('hero')
const alterado = ref(false)
let timerSalvo = null

function marcarAlterado() {
  salvo.value = false
  alterado.value = true
}

// Dispara em qualquer edição de texto (campos com v-model direto em
// conteudoBlocos, que não passam pelas funções mutadoras) — a primeira
// execução é sempre o carregamento inicial dos dados, não uma edição de
// verdade, por isso é ignorada.
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
  const { data } = await axios.get(`/agencia/${agenciaId}/`)
  agencia.value = data
  layout.value = data.layout?.length ? data.layout.map((b) => ({ ...b })) : [...LAYOUT_PADRAO]
  conteudoBlocos.value = normalizarConteudo(data.conteudo_blocos || {})
  galeria.value = data.galeria || []
  focoX.value = data.imagem_capa_foco_x ?? 50
  focoY.value = data.imagem_capa_foco_y ?? 50
})

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
            <GaleriaEditor v-else-if="bloco.tipo === 'galeria'" v-model="galeria" :agencia-id="agencia.id" @erro="erro = $event" />
            <SecaoConteudoEditor
              v-else-if="bloco.tipo !== 'hero'"
              v-model="conteudoBlocos"
              :tipo="bloco.tipo"
              :endereco="agencia.endereco"
              @alterado="marcarAlterado"
            />
          </template>
        </EditorSidebar>

        <PreviaPagina :agencia="agencia" :layout="layout" :galeria="galeria" :conteudo="conteudoBlocos" :foco-x="focoX" :foco-y="focoY" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.business-view {
  min-height: 100vh;
  background: #FFFFFF;
  font-family: 'Montserrat', sans-serif;
  /* Sem padding-top: o fundo escuro do topbar vai até o topo de verdade
     da página, e o header do site (fixed, flutuando por cima de tudo)
     sobrepõe a parte de cima dele — mesma pílula branca que já flutua
     sobre o resto do conteúdo em qualquer outra página. */
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

@media (max-width: 1024px) {
  .editor-layout { flex-direction: column; height: auto; }
}
</style>
