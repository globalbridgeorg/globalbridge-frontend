<script setup>
import { computed } from 'vue'
import { formatarData } from './formatarData'

// Topo do painel: cabeçalho da agência, números principais, distribuição
// de notas e completude. Múltiplas raízes de propósito — cada bloco é
// filho direto de .conteudo (a animação de entrada do painel depende disso).
const props = defineProps({
  agencia: { type: Object, required: true },
  painel: { type: Object, required: true }
})

const iniciais = computed(() => {
  if (!props.agencia?.nome) return '?'
  const partes = props.agencia.nome.trim().split(/\s+/)
  return (partes[0]?.[0] || '') + (partes[1]?.[0] || '')
})
</script>

<template>
  <!-- Cabeçalho -->
  <div class="card cabecalho">
    <div class="avatar">{{ iniciais }}</div>
    <div class="cabecalho-info">
      <div class="cabecalho-linha">
        <h1>{{ agencia.nome }}</h1>
        <span class="badge-verificada">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          Verificada
        </span>
        <span v-if="painel.ranking" class="badge-ranking">{{ painel.ranking.posicao }}º de {{ painel.ranking.total }} em {{ painel.ranking.pais }}</span>
      </div>
      <p class="cabecalho-sub">
        Sede em {{ agencia.cidade }}, {{ agencia.pais }}
        <template v-if="painel.verificacao"> · verificada em {{ formatarData(painel.verificacao.aprovado_em) }}</template>
      </p>
    </div>
  </div>

  <!-- Estatísticas -->
  <div class="grid-stats">
    <div class="card stat">
      <span class="stat-numero">{{ painel.stats.nota ?? '—' }}</span>
      <span class="stat-label">Nota média · {{ painel.stats.total_avaliacoes }} avaliações</span>
    </div>
    <div class="card stat">
      <span class="stat-numero">{{ painel.stats.favoritos }}</span>
      <span class="stat-label">Favoritaram · {{ painel.stats.favoritos_30_dias }} nos últimos 30 dias</span>
    </div>
    <div class="card stat">
      <span class="stat-numero">{{ painel.stats.programas }}</span>
      <span class="stat-label">Programas cadastrados</span>
    </div>
    <div class="card stat">
      <span class="stat-numero">{{ painel.stats.paises }}</span>
      <span class="stat-label">Países atendidos</span>
    </div>
  </div>

  <!-- Distribuição + completude -->
  <div class="grid-duas">
    <div class="card">
      <h2 class="card-titulo">Distribuição de notas</h2>
      <div v-if="painel.stats.total_avaliacoes === 0" class="vazio-pequeno">Ainda sem avaliações.</div>
      <div v-else v-for="linha in painel.distribuicao_notas" :key="linha.estrelas" class="linha-nota">
        <span class="linha-nota-label">{{ linha.estrelas }}★</span>
        <div class="linha-nota-barra"><div class="linha-nota-preenchido" :style="{ width: linha.largura + '%' }"></div></div>
        <span class="linha-nota-qtd">{{ linha.quantidade }}</span>
      </div>
    </div>

    <div class="card">
      <div class="completude-head">
        <h2 class="card-titulo">Completude da página</h2>
        <span class="completude-percentual">{{ painel.completude.percentual }}%</span>
      </div>
      <div class="completude-barra"><div class="completude-preenchido" :style="{ width: painel.completude.percentual + '%' }"></div></div>
      <div v-for="item in painel.completude.itens" :key="item.texto" class="completude-item">
        <svg v-if="item.feito" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3D9A4B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4D4D8" stroke-width="3"><circle cx="12" cy="12" r="9"/></svg>
        <span :class="{ pendente: !item.feito }">{{ item.texto }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="./painelCard.css"></style>
<style scoped>
.cabecalho { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--gb-dark); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--gb-font-display); font-weight: 800; font-size: 22px; flex-shrink: 0; }
.cabecalho-info { flex: 1; min-width: 220px; }
.cabecalho-linha { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cabecalho-linha h1 { margin: 0; font-family: var(--gb-font-display); font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; color: var(--gb-dark); font-size: 22px; }
.badge-verificada { display: inline-flex; align-items: center; gap: 5px; background: rgba(61,154,75,0.12); color: #3D9A4B; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
.badge-ranking { display: inline-flex; align-items: center; background: rgba(176,31,176,0.08); color: var(--gb-magenta-strong); font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
.cabecalho-sub { margin: 6px 0 0; color: var(--gb-ink-soft); font-size: 0.9rem; }

.grid-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stat { padding: 18px 20px; }
.stat-numero { display: block; font-family: var(--gb-font-display); font-weight: 800; font-size: 26px; color: var(--gb-dark); }
.stat-label { display: block; margin-top: 4px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gb-ink-faint); }

.grid-duas { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; }
@media (max-width: 820px) { .grid-duas, .grid-stats { grid-template-columns: 1fr 1fr; } }

.linha-nota { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.linha-nota-label { width: 34px; font-size: 0.8rem; font-weight: 700; color: var(--gb-ink-soft); flex-shrink: 0; }
.linha-nota-barra { flex: 1; height: 10px; background: #F4F4F5; border-radius: 6px; overflow: hidden; }
.linha-nota-preenchido { height: 100%; background: var(--gb-orange); border-radius: 6px; }
.linha-nota-qtd { width: 26px; text-align: right; font-size: 0.78rem; color: var(--gb-ink-faint); flex-shrink: 0; }

.completude-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.completude-percentual { font-family: var(--gb-font-display); font-weight: 800; font-size: 15px; color: var(--gb-magenta-strong); }
.completude-barra { height: 8px; background: #F4F4F5; border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
.completude-preenchido { height: 100%; background: var(--gb-magenta); border-radius: 6px; }
.completude-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 0.83rem; color: var(--gb-dark); }
.completude-item .pendente { color: var(--gb-ink-faint); }
</style>
