<script setup>
defineProps({
  painel: { type: Object, required: true }
})
const emit = defineEmits(['ir-para'])

function destinoDoItem(texto) {
  const t = texto.toLowerCase()
  if (t.includes('capa') || t.includes('galeria') || t.includes('seção extra') || t.includes('layout')) return { rota: 'business-editor' }
  if (t.includes('programa')) return { aba: 'programas' }
  if (t.includes('especialidade')) return { aba: 'paises' }
  return { aba: 'dados' }
}
</script>

<template>
  <!-- Estatísticas -->
  <div class="grid-stats">
    <div class="card stat">
      <span class="stat-numero" :data-valor="painel.stats.nota ?? ''" data-decimal="1">{{ painel.stats.nota ?? '—' }}</span>
      <span class="stat-label">Nota média · {{ painel.stats.total_avaliacoes }} avaliaç{{ painel.stats.total_avaliacoes === 1 ? 'ão' : 'ões' }}</span>
    </div>
    <div class="card stat">
      <span class="stat-numero" :data-valor="painel.stats.favoritos">{{ painel.stats.favoritos }}</span>
      <span class="stat-label">Favoritaram · {{ painel.stats.favoritos_30_dias }} nos últimos 30 dias</span>
    </div>
    <div class="card stat">
      <span class="stat-numero" :data-valor="painel.stats.programas">{{ painel.stats.programas }}</span>
      <span class="stat-label">Programas cadastrados</span>
    </div>
    <div class="card stat">
      <span class="stat-numero" :data-valor="painel.stats.paises">{{ painel.stats.paises }}</span>
      <span class="stat-label">Países atendidos</span>
    </div>
  </div>

  <!-- Distribuição + completude -->
  <div class="grid-duas">
    <div class="card">
      <h2 class="card-titulo" style="margin-bottom: 14px;">Distribuição de notas</h2>
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
        <span class="completude-percentual" :data-percentual="painel.completude.percentual">{{ painel.completude.percentual }}%</span>
      </div>
      <div class="completude-barra"><div class="completude-preenchido" :style="{ width: painel.completude.percentual + '%' }"></div></div>
      <div v-for="item in painel.completude.itens" :key="item.texto" class="completude-item">
        <i v-if="item.feito" class="fi fi-sr-check-circle completude-ok" aria-hidden="true"></i>
        <i v-else class="fi fi-rr-circle completude-pendente" aria-hidden="true"></i>
        <span v-if="item.feito">{{ item.texto }}</span>
        <button v-else type="button" class="completude-link" @click="emit('ir-para', destinoDoItem(item.texto))">
          {{ item.texto }} →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./painelCard.css"></style>
<style scoped>
.grid-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stat { padding: 18px 20px; }
.stat-numero { display: block; font-family: var(--gb-font-display); font-weight: 900; font-size: 26px; color: var(--gb-dark); }
.stat-label { display: block; margin-top: 4px; font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gb-ink-faint); }

.grid-duas { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 18px; }
@media (max-width: 900px) { .grid-stats { grid-template-columns: 1fr 1fr; } .grid-duas { grid-template-columns: 1fr; } }

.linha-nota { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.linha-nota-label { width: 34px; font-size: 0.8rem; font-weight: 700; color: var(--gb-ink-soft); flex-shrink: 0; }
.linha-nota-barra { flex: 1; height: 10px; background: var(--gb-cream); border-radius: 6px; overflow: hidden; }
.linha-nota-preenchido { height: 100%; background: var(--gb-orange); border-radius: 6px; }
.linha-nota-qtd { width: 26px; text-align: right; font-size: 0.78rem; color: var(--gb-ink-faint); flex-shrink: 0; }

.completude-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.completude-percentual { font-family: var(--gb-font-display); font-weight: 900; font-size: 15px; color: var(--gb-magenta-strong); }
.completude-barra { height: 8px; background: var(--gb-cream); border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
.completude-preenchido { height: 100%; background: var(--gb-magenta); border-radius: 6px; }
.completude-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 0.83rem; color: var(--gb-dark); }
.completude-ok { color: var(--gb-green); font-size: 15px; }
.completude-pendente { color: var(--gb-purple-deep-16); font-size: 15px; }
.completude-link {
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  font: inherit;
  color: var(--gb-ink-soft);
  cursor: pointer;
  transition: color 0.15s ease;
}
.completude-link:hover { color: var(--gb-magenta); text-decoration: underline; }
</style>
