<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import { useAuth } from '@/composables/useAuth'
import { useContaBusiness } from '@/composables/useContaBusiness'
import { formatarData } from '@/components/business/formatarData'
import PainelResumo from '@/components/business/PainelResumo.vue'
import PaisesAtendidosCard from '@/components/business/PaisesAtendidosCard.vue'
import ExcluirContaCard from '@/components/business/ExcluirContaCard.vue'

const router = useRouter()
const { logout } = useAuth()
const { carregando, erro, carregarConta } = useContaBusiness('Não conseguimos carregar seu painel agora.')

const agencia = ref(null)
const painel = ref(null)
const todosPaises = ref([])
const mensagemPedido = ref('')

function tempoRelativo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 60) return `há ${min || 1} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  return formatarData(iso)
}

function estrelas(nota) {
  return '★'.repeat(nota) + '☆'.repeat(5 - nota)
}

const carregar = () => carregarConta(async (agenciaId) => {
  const [{ data: dadosAgencia }, { data: dadosPainel }, { data: paises }] = await Promise.all([
    axios.get(`/agencia/${agenciaId}/`),
    axios.get(`/agencia/${agenciaId}/painel/`),
    axios.get('/paises/'),
  ])
  agencia.value = dadosAgencia
  painel.value = dadosPainel
  todosPaises.value = Array.isArray(paises) ? paises : paises.results || []
})

// Entrada em cascata — mesmo vocabulário de animação do resto do site
// (ver AgenciaView): gsap.from com clearProps pra não deixar transform/
// opacity grudados no elemento depois, o que quebra o layout em
// re-render. Só roda depois dos dados chegarem, senão anima o vazio.
let ctx
function animarEntrada() {
  if (prefersReducedMotion()) return
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'transform,opacity' } })
    tl.from('.cabecalho', { opacity: 0, y: 16, duration: 0.45 })
      .from('.grid-stats .stat', { opacity: 0, y: 12, scale: 0.97, duration: 0.4, stagger: 0.05 }, '-=0.25')
      .from('.conteudo > *:not(.cabecalho):not(.grid-stats)', { opacity: 0, y: 16, duration: 0.45, stagger: 0.06 }, '-=0.2')
  })
}

onMounted(async () => {
  await carregar()
  if (agencia.value && painel.value) {
    await nextTick()
    animarEntrada()
  }
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="painel-view">
    <div v-if="carregando" class="estado-tela">Carregando seu painel...</div>

    <div v-else-if="erro && !agencia" class="estado-tela">
      <p>{{ erro }}</p>
      <router-link to="/profile" class="link-voltar">Voltar pro meu perfil</router-link>
    </div>

    <template v-else-if="agencia && painel">
      <div class="topbar">
        <div class="topbar-info">
          <span class="logo">Global<span>Bridge</span></span>
          <span class="divisor"></span>
          <span class="titulo-editando">Painel — {{ agencia.nome }}</span>
        </div>
        <div class="topbar-actions">
          <router-link :to="{ name: 'agencia', params: { id: agencia.id } }" target="_blank" class="link-ver-pagina">Ver página pública</router-link>
          <button type="button" class="link-sair" @click="logout">Sair da conta</button>
          <button class="btn-editar" @click="router.push({ name: 'business-editor' })">Editar minha página</button>
        </div>
      </div>

      <div class="conteudo">
        <PainelResumo :agencia="agencia" :painel="painel" />

        <PaisesAtendidosCard v-model:mensagem="mensagemPedido" :agencia-id="agencia.id" :painel="painel" :todos-paises="todosPaises" @atualizar="carregar" />

        <!-- Catálogo de programas -->
        <div class="card">
          <div class="card-head">
            <h2 class="card-titulo">Catálogo de programas</h2>
          </div>
          <div v-if="!painel.planos.length" class="vazio-pequeno">Nenhum programa cadastrado ainda.</div>
          <div v-else role="table" aria-label="Catálogo de programas">
            <div class="tabela-head" role="row">
              <span role="columnheader">Programa</span><span role="columnheader">Duração</span><span role="columnheader">Preço</span>
            </div>
            <div v-for="plano in painel.planos" :key="plano.id" class="tabela-linha" role="row">
              <span class="tabela-nome" role="cell">{{ plano.nome }}</span>
              <span role="cell">{{ plano.duracao }}</span>
              <span role="cell">{{ plano.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span>
            </div>
          </div>
        </div>

        <!-- Especialidades -->
        <div class="card">
          <h2 class="card-titulo" style="margin-bottom: 14px;">Especialidades</h2>
          <div v-if="!painel.tags.length" class="vazio-pequeno">Nenhuma especialidade marcada ainda.</div>
          <div v-else class="chips-tags">
            <span v-for="tag in painel.tags" :key="tag" class="chip-tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Contato + verificação -->
        <div class="grid-duas">
          <div class="card">
            <h2 class="card-titulo" style="margin-bottom: 14px;">Informações de contato</h2>
            <div class="linha-info"><span>E-mail</span><strong>{{ painel.contato.email || '—' }}</strong></div>
            <div class="linha-info"><span>Telefone</span><strong>{{ painel.contato.telefone || '—' }}</strong></div>
            <div class="linha-info"><span>Site</span><strong>{{ painel.contato.site || '—' }}</strong></div>
            <div class="linha-info"><span>Endereço</span><strong>{{ painel.contato.endereco }}</strong></div>
          </div>

          <div class="card">
            <h2 class="card-titulo" style="margin-bottom: 14px;">Dados da verificação</h2>
            <template v-if="painel.verificacao">
              <div class="linha-info"><span>Responsável</span><strong>{{ painel.verificacao.responsavel }}</strong></div>
              <div class="linha-info"><span>Cargo</span><strong>{{ painel.verificacao.cargo || '—' }}</strong></div>
              <div class="linha-info"><span>Pedido enviado em</span><strong>{{ formatarData(painel.verificacao.enviado_em) }}</strong></div>
              <div class="linha-info"><span>Aprovado em</span><strong>{{ formatarData(painel.verificacao.aprovado_em) }}</strong></div>
            </template>
            <div v-else class="vazio-pequeno">Sem registro de verificação (conta cadastrada diretamente).</div>
          </div>
        </div>

        <!-- Avaliações recentes -->
        <div class="card">
          <h2 class="card-titulo" style="margin-bottom: 8px;">Avaliações recentes</h2>
          <div v-if="!painel.avaliacoes_recentes.length" class="vazio-pequeno">Ainda sem avaliações.</div>
          <div v-for="(av, i) in painel.avaliacoes_recentes" :key="i" class="linha-avaliacao">
            <div class="avatar-pequeno">{{ av.nome.slice(0, 2).toUpperCase() }}</div>
            <div class="avaliacao-corpo">
              <strong>{{ av.nome }}</strong>
              <span class="avaliacao-nota">{{ estrelas(av.nota) }}</span>
              <p>{{ av.comentario }}</p>
            </div>
          </div>
        </div>

        <!-- Atividade de favoritos -->
        <div class="card">
          <h2 class="card-titulo" style="margin-bottom: 8px;">Atividade de favoritos</h2>
          <div v-if="!painel.favoritos_recentes.length" class="vazio-pequeno">Ainda sem favoritos.</div>
          <div v-for="(fav, i) in painel.favoritos_recentes" :key="i" class="linha-favorito">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#B01FB0" stroke="#B01FB0" stroke-width="1"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4.5 6 4c2-.3 3.7.7 6 3 2.3-2.3 4-3.3 6-3 3.7.5 5.6 4.1 4 7.7C19.5 16.4 12 21 12 21z"/></svg>
            <span class="favorito-texto">{{ fav.nome }} favoritou sua agência</span>
            <span class="favorito-quando">{{ tempoRelativo(fav.quando) }}</span>
          </div>
        </div>

        <ExcluirContaCard />
      </div>
    </template>
  </div>
</template>

<style scoped src="../components/business/painelCard.css"></style>
<style scoped>
/* Sem padding-top: o fundo escuro do topbar vai até o topo de verdade da
   página, e o header do site (fixed, flutuando por cima de tudo) sobrepõe
   a parte de cima dele — é assim que a pílula branca sempre flutuou sobre
   o resto do conteúdo, só que aqui o "resto do conteúdo" é esse fundo
   escuro em vez de branco. */
.painel-view { min-height: 100vh; background: #FFFFFF; font-family: 'Montserrat', sans-serif; }

.estado-tela {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; color: var(--gb-ink-soft); text-align: center; padding: 24px;
}
.link-voltar { color: var(--gb-magenta); font-weight: 600; }

.topbar {
  min-height: 190px; background: var(--gb-dark); display: flex; flex-wrap: wrap; align-items: flex-end; align-content: flex-end;
  justify-content: space-between; gap: 16px 24px; padding: 96px 24px 20px; color: #fff;
}
.topbar-info { display: flex; align-items: center; gap: 16px; }
.logo { font-family: var(--gb-font-display); font-weight: 900; font-size: 15px; letter-spacing: -0.02em; text-transform: uppercase; }
.logo span { color: var(--gb-accent-light, #FF7DEE); }
.divisor { width: 1px; height: 20px; background: rgba(255, 255, 255, 0.2); }
.titulo-editando { font-size: 0.85rem; color: rgba(255, 255, 255, 0.7); }
.topbar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; }
.link-ver-pagina { font-size: 0.82rem; color: rgba(255, 255, 255, 0.75); text-decoration: underline; }
.link-sair { font-family: inherit; font-size: 0.82rem; color: rgba(255, 255, 255, 0.75); text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0; }
.link-sair:hover { color: #fff; }
.btn-editar {
  background: var(--gb-magenta); color: #fff; border: none; border-radius: 8px; padding: 9px 18px;
  font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
}

.conteudo { max-width: 1100px; margin: 0 auto; padding: 32px 24px 90px; display: flex; flex-direction: column; gap: 20px; }

.grid-duas { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; }
@media (max-width: 768px) { .grid-duas { grid-template-columns: 1fr; } }

.tabela-head { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; padding: 0 0 8px; border-bottom: 1px solid rgba(46,10,46,0.12); font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gb-ink-faint); }
.tabela-linha { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(46,10,46,0.06); align-items: center; font-size: 0.86rem; color: var(--gb-ink-soft); }
.tabela-nome { font-weight: 600; color: var(--gb-dark); }

.chips-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-tag { background: #F4F4F5; color: var(--gb-ink-soft); border-radius: 20px; padding: 7px 14px; font-size: 0.82rem; font-weight: 600; }

.linha-info { display: flex; justify-content: space-between; gap: 10px; font-size: 0.86rem; padding: 5px 0; }
.linha-info span { color: var(--gb-ink-faint); }
.linha-info strong { color: var(--gb-dark); font-weight: 600; text-align: right; }

.linha-avaliacao { display: flex; gap: 14px; padding: 14px 0; border-top: 1px solid rgba(46,10,46,0.1); }
.linha-avaliacao:first-of-type { border-top: none; }
.avatar-pequeno { width: 36px; height: 36px; border-radius: 50%; background: #F4F4F5; color: var(--gb-ink-soft); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
.avaliacao-corpo { flex: 1; }
.avaliacao-corpo strong { font-size: 0.88rem; color: var(--gb-dark); }
.avaliacao-nota { display: block; margin: 2px 0 6px; color: var(--gb-orange); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; }
.avaliacao-corpo p { margin: 0; font-size: 0.86rem; color: var(--gb-ink-soft); line-height: 1.5; }

.linha-favorito { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(46,10,46,0.08); }
.linha-favorito:first-of-type { border-top: none; }
.favorito-texto { flex: 1; font-size: 0.86rem; color: var(--gb-dark); }
.favorito-quando { font-size: 0.78rem; color: var(--gb-ink-faint); }

</style>
