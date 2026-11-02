<script setup>
import { ref, computed } from 'vue'
import { VARIANTES, LABELS, TAGS, SECOES_ADICIONAIS } from './secoes'

const layout = defineModel('layout', { type: Array, required: true })
const secaoAberta = defineModel('secaoAberta', { type: String, default: null })
const emit = defineEmits(['alterado', 'remover'])

const arrastandoIndex = ref(null)
const sobreIndex = ref(null)

const secoesDisponiveis = computed(() => {
  const adicionadas = new Set(layout.value.map((b) => b.tipo))
  return SECOES_ADICIONAIS.filter((s) => !adicionadas.has(s.tipo))
})

function alternarAberta(tipo) {
  secaoAberta.value = secaoAberta.value === tipo ? null : tipo
}

function setVariante(bloco, valor) {
  bloco.variante = valor
  emit('alterado')
}

function mover(tipo, direcao) {
  const i = layout.value.findIndex((b) => b.tipo === tipo)
  const alvo = i + direcao
  if (alvo < 1 || alvo >= layout.value.length) return
  const copia = [...layout.value]
  ;[copia[i], copia[alvo]] = [copia[alvo], copia[i]]
  layout.value = copia
  emit('alterado')
}

function adicionarSecao(tipo) {
  layout.value = [...layout.value, { tipo, variante: 'padrao' }]
  secaoAberta.value = tipo
  emit('alterado')
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
  emit('alterado')
}
</script>

<template>
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
      <div class="secao-corpo-wrap" :class="{ aberta: secaoAberta === bloco.tipo }" :inert="secaoAberta !== bloco.tipo">
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
              <button v-if="!VARIANTES[bloco.tipo]" class="btn-remover-secao" @click.stop="emit('remover', bloco.tipo)">Remover seção</button>
            </div>

            <div v-if="VARIANTES[bloco.tipo]" class="variant-row">
              <button
                v-for="v in VARIANTES[bloco.tipo]"
                :key="v.valor"
                class="variant-thumb"
                :class="{ active: bloco.variante === v.valor }"
                @click="setVariante(bloco, v.valor)"
              >
                <span class="variant-thumb-inner" :class="`swatch-${bloco.tipo}-${v.valor}`"></span>
                <span class="variant-name">{{ v.label }}</span>
              </button>
            </div>

            <!-- Campos de conteúdo de cada seção (capa, galeria, textos...) -->
            <slot :bloco="bloco" />
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
</template>

<style scoped>
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
.variant-thumb:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

.chevron { color: var(--gb-ink-faint); transition: transform 0.25s cubic-bezier(.4,0,.2,1); flex-shrink: 0; }
.chevron.aberto { transform: rotate(180deg); }

.secao-collapsed .add-icon { transition: transform 0.18s cubic-bezier(.16,1,.3,1); }
.secao-collapsed:hover .add-icon { transform: scale(1.12) rotate(-6deg); }

@media (prefers-reduced-motion: reduce) {
  .chevron, .variant-thumb, .secao-bloco,
  .secao-collapsed .add-icon,
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

@media (max-width: 1024px) {
  .sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--gb-purple-deep-16); }
}
</style>
