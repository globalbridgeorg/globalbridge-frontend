<script setup>
import { ref } from 'vue'
import { sanitizarUrl } from '@/utils/url'

defineProps({
  agencia: { type: Object, required: true },
  layout: { type: Array, required: true },
  galeria: { type: Array, required: true },
  conteudo: { type: Object, required: true },
  focoX: { type: Number, required: true },
  focoY: { type: Number, required: true },
  descricao: { type: String, default: '' },
  comoFunciona: { type: String, default: '' },
})

const modo = ref('mobile')

function videoEmbedUrl(url) {
  if (!url) return null
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/)
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

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
</script>

<template>
  <div class="canvas" data-lenis-prevent>
    <div class="preview-toolbar">
      <span class="preview-label">Prévia ao vivo</span>
      <div class="modo-toggle" role="group" aria-label="Tamanho da prévia">
        <button type="button" :class="{ active: modo === 'mobile' }" @click="modo = 'mobile'">Celular</button>
        <button type="button" :class="{ active: modo === 'desktop' }" @click="modo = 'desktop'">Desktop</button>
      </div>
    </div>

    <div class="phone" :class="{ desktop: modo === 'desktop' }" aria-hidden="true">
      <template v-for="bloco in layout" :key="'preview-' + bloco.tipo">

        <div
          v-if="bloco.tipo === 'hero' && bloco.variante === 'banner'"
          class="p-hero-banner"
          :style="agencia.imagem_capa_url ? { backgroundImage: `url(${agencia.imagem_capa_url})`, backgroundPosition: `${focoX}% ${focoY}%` } : {}"
        >
          <div class="p-hero-banner-scrim"></div>
          <div class="p-hero-banner-content">
            <span class="p-stars">{{ estrelasTexto(agencia.nota_media) }} <span class="p-rating">{{ agencia.nota_media ?? '—' }} · {{ agencia.cidade }}, {{ agencia.pais }}</span></span>
            <h1 class="p-title">{{ agencia.nome }}</h1>
            <p v-if="descricao" class="p-hero-desc on-dark">{{ descricao }}</p>
          </div>
        </div>
        <div v-else-if="bloco.tipo === 'hero'" class="p-hero-foto">
          <div
            class="p-avatar"
            :style="agencia.imagem_capa_url ? {
              backgroundImage: `url(${agencia.imagem_capa_url})`,
              backgroundSize: 'cover',
              backgroundPosition: `${focoX}% ${focoY}%`,
            } : {}"
          >{{ agencia.imagem_capa_url ? '' : iniciaisDe(agencia.nome) }}</div>
          <div>
            <span class="p-stars">{{ estrelasTexto(agencia.nota_media) }} <span class="p-rating">{{ agencia.nota_media ?? '—' }}</span></span>
            <h1 class="p-title">{{ agencia.nome }}</h1>
            <p v-if="descricao" class="p-hero-desc">{{ descricao }}</p>
          </div>
        </div>

        <div v-else-if="bloco.tipo === 'como_funciona'" class="p-block">
          <span class="p-eyebrow">Como funciona</span>
          <blockquote v-if="bloco.variante === 'destaque'" class="p-quote">"{{ comoFunciona || 'Conte como funciona o processo.' }}"</blockquote>
          <p v-else class="p-texto">{{ comoFunciona || 'Conte como funciona o processo.' }}</p>
        </div>

        <div v-else-if="bloco.tipo === 'catalogo'" class="p-block">
          <span class="p-eyebrow">Catálogo</span>
          <div class="p-catalogo-grid" :class="{ 'p-catalogo-lista': bloco.variante === 'lista' }">
            <div v-for="plano in (agencia.planos || []).slice(0, 4)" :key="plano.id" class="p-card">
              <span class="p-card-tag">{{ plano.duracao_min }}–{{ plano.duracao_max }}m</span>
              <strong>{{ plano.programa_nome }}</strong>
              <span class="p-card-preco">{{ formatarPreco(plano.preco) }}</span>
            </div>
            <div v-if="!agencia.planos?.length" class="p-card p-card-vazio">Sem programas ainda</div>
          </div>
        </div>

        <div v-else-if="bloco.tipo === 'avaliacoes'" class="p-block">
          <span class="p-eyebrow">Avaliações ({{ agencia.total_avaliacoes || 0 }})</span>
          <div class="p-avaliacoes-grid" :class="{ 'p-avaliacoes-compacta': bloco.variante === 'compacta' }">
            <div v-if="!agencia.avaliacoes?.length" class="p-card p-card-vazio">Sem avaliações ainda</div>
            <div v-for="av in (agencia.avaliacoes || []).slice(0, 3)" :key="av.id" class="p-card p-av-card">
              <span class="p-av-stars">{{ estrelasTexto(av.nota) }}</span>
              <strong>{{ av.autor }}</strong>
              <p class="p-av-texto">{{ av.comentario }}</p>
            </div>
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
          <div v-if="videoEmbedUrl(conteudo.video.url)" class="p-video-wrap"><iframe :src="videoEmbedUrl(conteudo.video.url)" title="Prévia do vídeo institucional" frameborder="0"></iframe></div>
          <div v-else class="p-card p-card-vazio">Cole um link de vídeo</div>
        </div>

        <div v-else-if="bloco.tipo === 'equipe'" class="p-block">
          <span class="p-eyebrow">Equipe</span>
          <div class="p-equipe-grid">
            <div v-for="(m, i) in conteudo.equipe.membros" :key="i" class="p-card p-equipe-card">
              <div
                class="p-avatar-sm"
                :style="sanitizarUrl(m.foto) ? { backgroundImage: `url(${sanitizarUrl(m.foto)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
              >{{ sanitizarUrl(m.foto) ? '' : (iniciaisDe(m.nome) || '?') }}</div>
              <strong>{{ m.nome || 'Nome' }}</strong>
              <span>{{ m.cargo || 'Cargo' }}</span>
            </div>
            <div v-if="!conteudo.equipe.membros.length" class="p-card p-card-vazio">Adicione pessoas da equipe</div>
          </div>
        </div>

        <div v-else-if="bloco.tipo === 'certificacoes'" class="p-block">
          <span class="p-eyebrow">Certificações e parcerias</span>
          <div class="p-certificacoes-grid">
            <div v-for="(c, i) in conteudo.certificacoes.itens" :key="i" class="p-card p-cert-card">
              <strong>{{ c.nome || 'Nome' }}</strong>
            </div>
            <div v-if="!conteudo.certificacoes.itens.length" class="p-card p-card-vazio">Adicione certificações</div>
          </div>
        </div>

        <div v-else-if="bloco.tipo === 'faq'" class="p-block">
          <span class="p-eyebrow">Perguntas frequentes</span>
          <div v-for="(f, i) in conteudo.faq.perguntas" :key="i" class="p-faq-item">{{ f.pergunta || 'Pergunta' }}</div>
          <div v-if="!conteudo.faq.perguntas.length" class="p-card p-card-vazio">Adicione perguntas</div>
        </div>

        <div v-else-if="bloco.tipo === 'localizacao'" class="p-block">
          <span class="p-eyebrow">Localização</span>
          <p class="p-texto">{{ agencia.endereco || 'Endereço não informado' }}</p>
        </div>

        <div v-else-if="bloco.tipo === 'redes_sociais'" class="p-block">
          <span class="p-eyebrow">Redes sociais</span>
          <div class="p-redes-row">
            <span v-if="conteudo.redes_sociais.instagram" class="p-rede-chip">Instagram</span>
            <span v-if="conteudo.redes_sociais.facebook" class="p-rede-chip">Facebook</span>
            <span v-if="conteudo.redes_sociais.tiktok" class="p-rede-chip">TikTok</span>
            <span v-if="conteudo.redes_sociais.linkedin" class="p-rede-chip">LinkedIn</span>
            <span v-if="conteudo.redes_sociais.youtube" class="p-rede-chip">YouTube</span>
            <span v-if="!Object.values(conteudo.redes_sociais).some(Boolean)" class="p-card p-card-vazio">Cole os links das redes</span>
          </div>
        </div>

        <div v-else-if="bloco.tipo === 'contato_whatsapp'" class="p-block">
          <span class="p-eyebrow">Fale conosco</span>
          <div class="p-whatsapp-btn">Conversar no WhatsApp</div>
        </div>

      </template>
    </div>
  </div>
</template>

<style scoped>
.canvas {
  flex: 1;
  overflow-y: auto;
  background: var(--gb-cream);
  padding: 20px 32px 40px;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 760px;
  margin: 0 auto 18px;
}

.preview-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gb-mauve);
}

.modo-toggle {
  display: inline-flex;
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-pill);
  padding: 3px;
  gap: 2px;
}

.modo-toggle button {
  border: none;
  background: transparent;
  padding: 5px 12px;
  border-radius: var(--gb-radius-pill);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--gb-ink-soft);
  cursor: pointer;
}

.modo-toggle button.active {
  background: var(--gb-dark);
  color: #fff;
}

.phone {
  max-width: 400px;
  margin: 0 auto;
  background: #fff;
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(23, 17, 26, 0.12);
  border: 1px solid var(--gb-purple-deep-16);
  transition: max-width 0.25s ease;
}

.phone.desktop {
  max-width: 760px;
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
.p-hero-banner-scrim { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(23,17,26,0.88) 15%, rgba(23,17,26,0.12) 65%); }
.p-hero-banner-content { position: relative; padding: 24px; color: #fff; }
.p-hero-foto { display: flex; align-items: flex-start; gap: 14px; padding: 24px; }
.p-avatar {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-family: var(--gb-font-display); font-weight: 900; font-size: 18px;
}
.p-stars { color: var(--gb-magenta); letter-spacing: 1px; font-size: 0.75rem; }
.p-rating { color: rgba(23,17,26,0.6); font-size: 0.7rem; margin-left: 4px; }
.p-hero-banner-content .p-rating { color: rgba(255,255,255,0.75); }
.p-title { font-family: var(--gb-font-display); font-weight: 900; text-transform: uppercase; font-size: 1.2rem; margin: 4px 0 0; letter-spacing: -0.01em; color: var(--gb-dark); }
.p-hero-banner-content .p-title { color: #fff; }
.p-hero-desc { margin: 8px 0 0; font-size: 0.76rem; line-height: 1.5; color: var(--gb-ink-soft); }
.p-hero-desc.on-dark { color: rgba(255, 255, 255, 0.85); }

.p-block { padding: 22px 24px; border-top: 1px solid var(--gb-purple-deep-16); }
.p-eyebrow {
  font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--gb-mauve);
  display: block; margin-bottom: 10px;
}
.p-texto { font-size: 0.78rem; color: var(--gb-ink-soft); line-height: 1.55; margin: 0; }
.p-quote { font-style: italic; color: var(--gb-magenta-strong); border-left: 2px solid var(--gb-magenta); padding-left: 12px; margin: 0; font-size: 0.85rem; line-height: 1.5; }

.p-card {
  background: #fff; border: 1px solid var(--gb-purple-deep-16); border-radius: 8px;
  padding: 12px; display: flex; flex-direction: column; gap: 4px;
}
.p-card strong { font-size: 0.78rem; color: var(--gb-dark); }
.p-card-preco { font-size: 0.74rem; font-weight: 700; color: var(--gb-magenta-strong); }
.p-card-vazio { color: var(--gb-ink-faint); font-size: 0.72rem; justify-content: center; align-items: center; text-align: center; grid-column: 1 / -1; min-height: 44px; }
.p-card-tag {
  font-family: var(--gb-font-eyebrow); font-weight: 700; font-size: 8px; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 2px 7px; border-radius: 20px; background: rgba(57,114,222,0.12);
  color: #2a56ad; width: fit-content;
}

.p-catalogo-grid, .p-equipe-grid, .p-certificacoes-grid, .p-galeria-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.p-catalogo-lista { grid-template-columns: 1fr; }
.p-avaliacoes-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
.phone.desktop .p-avaliacoes-grid:not(.p-avaliacoes-compacta) { grid-template-columns: repeat(3, 1fr); }
.p-avaliacoes-compacta { grid-template-columns: 1fr; }

.p-av-stars { color: var(--gb-magenta); font-size: 0.7rem; letter-spacing: 1px; }
.p-av-texto {
  margin: 2px 0 0;
  font-size: 0.7rem;
  color: var(--gb-ink-soft);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

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

@media (max-width: 1024px) {
  .canvas { padding: 20px 16px; }
}
</style>
