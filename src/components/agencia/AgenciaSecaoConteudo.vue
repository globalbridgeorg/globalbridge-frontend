<script setup>
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import FaqComponent from '@/components/home/FaqComponent.vue'
import { iniciaisDe } from '@/utils/iniciais'
import { sanitizarUrl } from '@/utils/url'

const props = defineProps({
  agencia: { type: Object, required: true },
  bloco: { type: Object, required: true }
})

// Conteúdo das seções "simples" do editor de blocos (ver BusinessView) —
// sempre um objeto, mesmo pra agências que nunca abriram o editor.
const conteudo = computed(() => props.agencia.conteudo_blocos || {})

const faqsFormatados = computed(() =>
  (conteudo.value.faq?.perguntas || [])
    .filter((item) => item?.pergunta || item?.resposta)
    .map((item, i) => ({
      id: i + 1,
      question: item.pergunta,
      answer: item.resposta,
    }))
)

// Lightbox da galeria para ver cada foto inteira (sem o recorte quadrado 1:1)
const indiceLightbox = ref(null)
const fotosEquipeErro = reactive({})
const galeriaLista = computed(() => props.agencia.galeria || [])
const fotoLightbox = computed(() =>
  indiceLightbox.value !== null ? galeriaLista.value[indiceLightbox.value] ?? null : null
)

function abrirLightbox(idx) {
  indiceLightbox.value = idx
}

function fecharLightbox() {
  indiceLightbox.value = null
}

function navegarLightbox(delta) {
  const total = galeriaLista.value.length
  if (!total || indiceLightbox.value === null) return
  indiceLightbox.value = (indiceLightbox.value + delta + total) % total
}

function aoTeclarLightbox(e) {
  if (indiceLightbox.value === null) return
  if (e.key === 'Escape') fecharLightbox()
  else if (e.key === 'ArrowRight') navegarLightbox(1)
  else if (e.key === 'ArrowLeft') navegarLightbox(-1)
}

watch(indiceLightbox, (aberto) => {
  if (aberto !== null) {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', aoTeclarLightbox)
  } else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', aoTeclarLightbox)
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', aoTeclarLightbox)
})

function linkWhatsapp(numero, mensagem) {
  const somenteDigitos = (numero || '').replace(/\D/g, '')
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${somenteDigitos}${texto}`
}

function videoEmbedUrl(url) {
  if (!url) return null
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/)
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
      <button
        v-for="(img, idx) in agencia.galeria"
        :key="img.id"
        type="button"
        class="galeria-thumb"
        :aria-label="`Abrir foto ${idx + 1} de ${agencia.galeria.length} em tamanho inteiro`"
        @click="abrirLightbox(idx)"
      >
        <img :src="img.url" :alt="`Foto ${idx + 1} de ${agencia.nome}`" loading="lazy">
      </button>
    </div>

    <Teleport to="body">
      <Transition name="lightbox-fade">
        <div
          v-if="fotoLightbox"
          class="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          :aria-label="`Foto ${indiceLightbox + 1} de ${galeriaLista.length} — ${agencia.nome}`"
          data-lenis-prevent
          @click.self="fecharLightbox"
        >
          <button type="button" class="lightbox-btn lightbox-close" aria-label="Fechar foto" @click="fecharLightbox">
            <i class="fi fi-rr-cross-small" aria-hidden="true"></i>
          </button>

          <button
            v-if="galeriaLista.length > 1"
            type="button"
            class="lightbox-btn lightbox-prev"
            aria-label="Foto anterior"
            @click="navegarLightbox(-1)"
          >
            <i class="fi fi-rr-angle-left" aria-hidden="true"></i>
          </button>

          <div class="lightbox-stage" @click.self="fecharLightbox">
            <img :src="fotoLightbox.url" :alt="`Foto ${indiceLightbox + 1} de ${agencia.nome}`" class="lightbox-img" />
            <span v-if="galeriaLista.length > 1" class="lightbox-counter">{{ indiceLightbox + 1 }} / {{ galeriaLista.length }}</span>
          </div>

          <button
            v-if="galeriaLista.length > 1"
            type="button"
            class="lightbox-btn lightbox-next"
            aria-label="Próxima foto"
            @click="navegarLightbox(1)"
          >
            <i class="fi fi-rr-angle-right" aria-hidden="true"></i>
          </button>
        </div>
      </Transition>
    </Teleport>
  </section>

  <section v-else-if="bloco.tipo === 'video' && conteudo.video?.url" class="video-secao reveal-section">
    <SectionEyebrow label="Vídeo institucional" />
    <h2 class="gb-heading">Conheça a<br />{{ agencia.nome }}</h2>
    <div v-if="videoEmbedUrl(conteudo.video.url)" class="video-embed-wrap">
      <iframe :src="videoEmbedUrl(conteudo.video.url)" title="Vídeo institucional" frameborder="0" allowfullscreen loading="lazy"></iframe>
    </div>
    <a v-else-if="sanitizarUrl(conteudo.video.url)" :href="sanitizarUrl(conteudo.video.url)" target="_blank" rel="noopener noreferrer" class="btn-outline-lg">Assistir vídeo</a>
  </section>

  <section v-else-if="bloco.tipo === 'equipe' && conteudo.equipe?.membros?.length" class="equipe-secao reveal-section">
    <SectionEyebrow label="Equipe" />
    <h2 class="gb-heading">Quem cuida do<br />seu intercâmbio</h2>
    <div class="equipe-grid reveal-grid">
      <div v-for="(membro, i) in conteudo.equipe.membros" :key="i" class="equipe-card">
        <div class="equipe-avatar">
          <img
            v-if="sanitizarUrl(membro.foto) && !fotosEquipeErro[i]"
            :src="sanitizarUrl(membro.foto)"
            :alt="membro.nome"
            loading="lazy"
            @error="fotosEquipeErro[i] = true"
          />
          <span v-else aria-hidden="true">{{ iniciaisDe(membro.nome) }}</span>
        </div>
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
        <i class="fi fi-rr-badge-check cert-icon" aria-hidden="true"></i>
        <strong>{{ item.nome }}</strong>
        <span v-if="item.descricao">{{ item.descricao }}</span>
      </div>
    </div>
  </section>

  <FaqComponent
    v-else-if="bloco.tipo === 'faq' && faqsFormatados.length"
    class="faq-secao reveal-section"
    title="Dúvidas comuns"
    :faqs="faqsFormatados"
  />

  <section v-else-if="bloco.tipo === 'localizacao'" class="localizacao-secao reveal-section">
    <SectionEyebrow label="Localização" />
    <h2 class="gb-heading">Onde fica<br />a agência</h2>
    <p class="localizacao-endereco">{{ agencia.endereco }}</p>
    <a v-if="sanitizarUrl(conteudo.localizacao?.link_mapa)" :href="sanitizarUrl(conteudo.localizacao.link_mapa)" target="_blank" rel="noopener noreferrer" class="btn-outline-lg">Ver no mapa</a>
  </section>

  <section v-else-if="bloco.tipo === 'redes_sociais' && Object.values(conteudo.redes_sociais || {}).some((u) => sanitizarUrl(u))" class="redes-secao reveal-section">
    <SectionEyebrow label="Redes sociais" />
    <h2 class="gb-heading">Acompanhe<br />de perto</h2>
    <div class="redes-links">
      <a v-if="sanitizarUrl(conteudo.redes_sociais.instagram)" :href="sanitizarUrl(conteudo.redes_sociais.instagram)" target="_blank" rel="noopener noreferrer"><i class="fi fi-brands-instagram" aria-hidden="true"></i> Instagram</a>
      <a v-if="sanitizarUrl(conteudo.redes_sociais.facebook)" :href="sanitizarUrl(conteudo.redes_sociais.facebook)" target="_blank" rel="noopener noreferrer"><i class="fi fi-brands-facebook" aria-hidden="true"></i> Facebook</a>
      <a v-if="sanitizarUrl(conteudo.redes_sociais.tiktok)" :href="sanitizarUrl(conteudo.redes_sociais.tiktok)" target="_blank" rel="noopener noreferrer"><i class="fi fi-brands-tik-tok" aria-hidden="true"></i> TikTok</a>
      <a v-if="sanitizarUrl(conteudo.redes_sociais.linkedin)" :href="sanitizarUrl(conteudo.redes_sociais.linkedin)" target="_blank" rel="noopener noreferrer"><i class="fi fi-brands-linkedin" aria-hidden="true"></i> LinkedIn</a>
      <a v-if="sanitizarUrl(conteudo.redes_sociais.youtube)" :href="sanitizarUrl(conteudo.redes_sociais.youtube)" target="_blank" rel="noopener noreferrer"><i class="fi fi-brands-youtube" aria-hidden="true"></i> YouTube</a>
    </div>
  </section>

  <section v-else-if="bloco.tipo === 'contato_whatsapp' && conteudo.contato_whatsapp?.numero" class="whatsapp-secao reveal-section">
    <SectionEyebrow label="Fale conosco" />
    <h2 class="gb-heading">Tire suas dúvidas<br />na hora</h2>
    <a :href="linkWhatsapp(conteudo.contato_whatsapp.numero, conteudo.contato_whatsapp.mensagem)" target="_blank" rel="noopener" class="btn-whatsapp">
      <i class="fi fi-brands-whatsapp" aria-hidden="true"></i>
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
.galeria-thumb {
  display: block;
  padding: 0;
  border: none;
  background: #ece9e3;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1;
  cursor: zoom-in;
  position: relative;
}
.galeria-thumb:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}
.galeria-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease, filter 0.25s ease;
}
.galeria-thumb:hover img {
  transform: scale(1.03);
  filter: brightness(0.94);
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(18, 12, 22, 0.92);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 68px;
}

.lightbox-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 100%;
  max-height: 100%;
}

.lightbox-img {
  max-width: min(90vw, 1280px);
  max-height: 82vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
  display: block;
}

.lightbox-counter {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.12);
  padding: 5px 12px;
  border-radius: 999px;
}

.lightbox-btn {
  position: fixed;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(23, 17, 26, 0.72);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.lightbox-btn:hover {
  background: var(--gb-magenta);
  border-color: var(--gb-magenta);
}

.lightbox-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.lightbox-close {
  top: 20px;
  right: 20px;
}

.lightbox-prev {
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
}

.lightbox-next {
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.2s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .lightbox-overlay {
    padding: 64px 16px 24px;
  }
  .lightbox-prev {
    left: 10px;
  }
  .lightbox-next {
    right: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .galeria-thumb img,
  .lightbox-fade-enter-active,
  .lightbox-fade-leave-active {
    transition: none;
  }
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
  width: 68px;
  height: 68px;
  border-radius: 50%;
  overflow: hidden;
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
.equipe-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
.cert-icon {
  font-size: 20px;
}
.certificacao-card strong { color: var(--gb-dark); font-size: 0.92rem; }
.certificacao-card span { color: var(--gb-ink-faint); font-size: 0.82rem; }

.faq-section.faq-secao {
  padding: 48px 0 0;
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 20px;
  padding: 10px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gb-dark);
  text-decoration: none;
}
.redes-links a:hover { border-color: var(--gb-magenta); color: var(--gb-magenta); }

.btn-whatsapp .fi {
  font-size: 18px;
}

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

@media (max-width: 1024px) {
  .equipe-grid, .certificacoes-grid { grid-template-columns: repeat(2, 1fr); }
  .galeria-grid-publica { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .equipe-grid, .certificacoes-grid { grid-template-columns: 1fr; }
  .galeria-grid-publica { grid-template-columns: repeat(2, 1fr); }
}
</style>
