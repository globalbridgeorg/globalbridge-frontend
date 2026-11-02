<script setup>
import { computed } from 'vue'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { iniciaisDe } from '@/utils/iniciais'

const props = defineProps({
  agencia: { type: Object, required: true },
  bloco: { type: Object, required: true }
})

// Conteúdo das seções "simples" do editor de blocos (ver BusinessView) —
// sempre um objeto, mesmo pra agências que nunca abriram o editor.
const conteudo = computed(() => props.agencia.conteudo_blocos || {})

function linkWhatsapp(numero, mensagem) {
  const somenteDigitos = (numero || '').replace(/\D/g, '')
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${somenteDigitos}${texto}`
}

function videoEmbedUrl(url) {
  if (!url) return null
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/)
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}
</script>

<template>
  <section v-if="bloco.tipo === 'galeria' && agencia.galeria?.length" class="galeria-secao reveal-section">
    <SectionEyebrow label="Galeria" />
    <h2 class="gb-heading">Conheça um<br />pouco mais</h2>
    <div class="galeria-grid-publica reveal-grid">
      <img v-for="img in agencia.galeria" :key="img.id" :src="img.url" alt="" loading="lazy">
    </div>
  </section>

  <section v-else-if="bloco.tipo === 'video' && conteudo.video?.url" class="video-secao reveal-section">
    <SectionEyebrow label="Vídeo institucional" />
    <h2 class="gb-heading">Conheça a<br />{{ agencia.nome }}</h2>
    <div v-if="videoEmbedUrl(conteudo.video.url)" class="video-embed-wrap">
      <iframe :src="videoEmbedUrl(conteudo.video.url)" title="Vídeo institucional" frameborder="0" allowfullscreen loading="lazy"></iframe>
    </div>
    <a v-else :href="conteudo.video.url" target="_blank" rel="noopener" class="btn-outline-lg">Assistir vídeo</a>
  </section>

  <section v-else-if="bloco.tipo === 'equipe' && conteudo.equipe?.membros?.length" class="equipe-secao reveal-section">
    <SectionEyebrow label="Equipe" />
    <h2 class="gb-heading">Quem cuida do<br />seu intercâmbio</h2>
    <div class="equipe-grid reveal-grid">
      <div v-for="(membro, i) in conteudo.equipe.membros" :key="i" class="equipe-card">
        <div class="equipe-avatar" aria-hidden="true">{{ iniciaisDe(membro.nome) }}</div>
        <strong>{{ membro.nome }}</strong>
        <span>{{ membro.cargo }}</span>
      </div>
    </div>
  </section>

  <section v-else-if="bloco.tipo === 'certificacoes' && conteudo.certificacoes?.itens?.length" class="certificacoes-secao reveal-section">
    <SectionEyebrow label="Certificações e parcerias" />
    <h2 class="gb-heading">Reconhecimento<br />no setor</h2>
    <div class="certificacoes-grid reveal-grid">
      <div v-for="(item, i) in conteudo.certificacoes.itens" :key="i" class="certificacao-card">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l2.9 6.3 6.9.9-5 4.9 1.2 6.9L12 17.8l-6 3.2 1.2-6.9-5-4.9 6.9-.9z"/></svg>
        <strong>{{ item.nome }}</strong>
        <span v-if="item.descricao">{{ item.descricao }}</span>
      </div>
    </div>
  </section>

  <section v-else-if="bloco.tipo === 'faq' && conteudo.faq?.perguntas?.length" class="faq-secao reveal-section">
    <SectionEyebrow label="Perguntas frequentes" />
    <h2 class="gb-heading">Dúvidas<br />comuns</h2>
    <details v-for="(item, i) in conteudo.faq.perguntas" :key="i" class="faq-item">
      <summary>{{ item.pergunta }}</summary>
      <p>{{ item.resposta }}</p>
    </details>
  </section>

  <section v-else-if="bloco.tipo === 'localizacao'" class="localizacao-secao reveal-section">
    <SectionEyebrow label="Localização" />
    <h2 class="gb-heading">Onde fica<br />a agência</h2>
    <p class="localizacao-endereco">{{ agencia.endereco }}</p>
    <a v-if="conteudo.localizacao?.link_mapa" :href="conteudo.localizacao.link_mapa" target="_blank" rel="noopener" class="btn-outline-lg">Ver no mapa</a>
  </section>

  <section v-else-if="bloco.tipo === 'redes_sociais' && Object.values(conteudo.redes_sociais || {}).some(Boolean)" class="redes-secao reveal-section">
    <SectionEyebrow label="Redes sociais" />
    <h2 class="gb-heading">Acompanhe<br />de perto</h2>
    <div class="redes-links">
      <a v-if="conteudo.redes_sociais.instagram" :href="conteudo.redes_sociais.instagram" target="_blank" rel="noopener">Instagram</a>
      <a v-if="conteudo.redes_sociais.facebook" :href="conteudo.redes_sociais.facebook" target="_blank" rel="noopener">Facebook</a>
      <a v-if="conteudo.redes_sociais.tiktok" :href="conteudo.redes_sociais.tiktok" target="_blank" rel="noopener">TikTok</a>
      <a v-if="conteudo.redes_sociais.linkedin" :href="conteudo.redes_sociais.linkedin" target="_blank" rel="noopener">LinkedIn</a>
      <a v-if="conteudo.redes_sociais.youtube" :href="conteudo.redes_sociais.youtube" target="_blank" rel="noopener">YouTube</a>
    </div>
  </section>

  <section v-else-if="bloco.tipo === 'contato_whatsapp' && conteudo.contato_whatsapp?.numero" class="whatsapp-secao reveal-section">
    <SectionEyebrow label="Fale conosco" />
    <h2 class="gb-heading">Tire suas dúvidas<br />na hora</h2>
    <a :href="linkWhatsapp(conteudo.contato_whatsapp.numero, conteudo.contato_whatsapp.mensagem)" target="_blank" rel="noopener" class="btn-whatsapp">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.36a9.86 9.86 0 004.62 1.14h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm0 17.9a8.06 8.06 0 01-4.1-1.12l-.29-.17-3.05.78.81-2.97-.19-.3a7.94 7.94 0 01-1.22-4.21c0-4.4 3.58-7.98 7.99-7.98a7.94 7.94 0 015.65 2.34 7.9 7.9 0 012.34 5.64c0 4.41-3.58 7.99-7.94 7.99zm4.38-5.98c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.79-.19-.47-.39-.4-.54-.41-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.43-.58 1.63-1.15.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28z"/></svg>
      Conversar no WhatsApp
    </a>
  </section>
</template>

<style scoped>
.galeria-secao, .video-secao, .equipe-secao, .certificacoes-secao,
.faq-secao, .localizacao-secao, .redes-secao, .whatsapp-secao {
  padding: 48px 0 0;
}

.gb-heading {
  margin: 8px 0 24px;
}

.btn-outline-lg {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 14px 26px;
  border-radius: 12px;
  text-align: center;
  white-space: nowrap;
  text-decoration: none;
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
}

.btn-outline-lg:hover {
  background: rgba(46, 10, 46, 0.04);
}

.galeria-grid-publica {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.galeria-grid-publica img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
}

.video-embed-wrap {
  position: relative;
  max-width: 720px;
  aspect-ratio: 16 / 9;
  border-radius: var(--gb-radius-card);
  overflow: hidden;
}
.video-embed-wrap iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.equipe-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.equipe-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.equipe-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 800;
  font-size: 18px;
  margin-bottom: 6px;
}
.equipe-card strong { font-size: 0.92rem; color: var(--gb-dark); }
.equipe-card span { font-size: 0.8rem; color: var(--gb-ink-faint); }

.certificacoes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.certificacao-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--gb-magenta);
}
.certificacao-card strong { color: var(--gb-dark); font-size: 0.92rem; }
.certificacao-card span { color: var(--gb-ink-faint); font-size: 0.82rem; }

.faq-item {
  border-top: 1px solid var(--gb-purple-deep-16);
  padding: 16px 0;
  max-width: 720px;
}
.faq-item:last-child { border-bottom: 1px solid var(--gb-purple-deep-16); }
.faq-item summary {
  cursor: pointer;
  font-weight: 700;
  font-size: 0.94rem;
  color: var(--gb-dark);
}
.faq-item p {
  margin: 10px 0 0;
  font-size: 0.9rem;
  color: var(--gb-ink-soft);
  line-height: 1.6;
}

.localizacao-endereco {
  font-size: 0.98rem;
  color: var(--gb-ink-soft);
  margin: 0 0 16px;
}

.redes-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.redes-links a {
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 20px;
  padding: 10px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gb-dark);
}
.redes-links a:hover { border-color: var(--gb-magenta); color: var(--gb-magenta); }

.btn-whatsapp {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #25D366;
  color: #fff;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 14px 26px;
  border-radius: 12px;
  text-decoration: none;
}
.btn-whatsapp:hover { background: #1ebe57; }

@media (max-width: 1100px) {
  .equipe-grid, .certificacoes-grid { grid-template-columns: repeat(2, 1fr); }
  .galeria-grid-publica { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 720px) {
  .equipe-grid, .certificacoes-grid { grid-template-columns: 1fr; }
  .galeria-grid-publica { grid-template-columns: repeat(2, 1fr); }
}
</style>
