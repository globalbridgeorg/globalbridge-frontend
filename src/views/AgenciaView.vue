<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from '@/services/axios'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import ProgramaCard from '@/components/catalog/ProgramaCard.vue'
import { useFavoritos } from '@/composables/useFavoritos'

gsap.registerPlugin(ScrollTrigger)

const { estaLogado, carregarFavoritos, isFavorito, toggleFavorito } = useFavoritos()

const REGIAO_LABELS = {
  asia: 'Ásia',
  europa: 'Europa',
  america_norte: 'América do Norte',
  america_sul: 'América do Sul',
  oceania: 'Oceania',
  africa: 'África'
}

// Layout padrão de sempre, pra agência que ainda não mexeu no editor da
// conta business (agencia.layout vazio). O hero fica sempre primeiro —
// só a variante dele é escolhível, a ordem das outras três seções é que
// pode mudar.
const LAYOUT_PADRAO = [
  { tipo: 'hero', variante: 'foto' },
  { tipo: 'como_funciona', variante: 'texto' },
  { tipo: 'catalogo', variante: 'grade' },
  { tipo: 'avaliacoes', variante: 'grade' }
]

const route = useRoute()
const agencia = ref(null)
const carregando = ref(true)
const erro = ref(false)

const regiaoLabel = computed(() => REGIAO_LABELS[agencia.value?.regiao] ?? agencia.value?.regiao)
const layoutFinal = computed(() => agencia.value?.layout?.length ? agencia.value.layout : LAYOUT_PADRAO)
const variantePor = (tipo) => layoutFinal.value.find((b) => b.tipo === tipo)?.variante

const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

const favoritado = computed(() => agencia.value ? isFavorito('agencia', agencia.value.id) : false)
function pulsarFavorito(el) {
  if (!el) return
  el.classList.remove('pulso')
  void el.offsetWidth
  el.classList.add('pulso')
}
function handleFavoritar(event) {
  if (!agencia.value) return
  toggleFavorito('agencia', agencia.value.id)
  pulsarFavorito(event.currentTarget.querySelector('.fav-icon'))
}

function iniciaisDe(nome) {
  if (!nome) return ''
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

// Conteúdo das seções "simples" do editor de blocos (ver BusinessView) —
// sempre um objeto, mesmo pra agências que nunca abriram o editor.
const conteudo = computed(() => agencia.value?.conteudo_blocos || {})

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

const novaNota = ref(0)
const novoComentario = ref('')
const enviandoAvaliacao = ref(false)
const erroAvaliacao = ref('')

async function enviarAvaliacao() {
  erroAvaliacao.value = ''
  if (!novaNota.value) {
    erroAvaliacao.value = 'Escolha uma nota de 1 a 5 estrelas.'
    return
  }
  if (!novoComentario.value.trim()) {
    erroAvaliacao.value = 'Escreva um comentário antes de enviar.'
    return
  }
  enviandoAvaliacao.value = true
  try {
    await axios.post('/avaliacao/', {
      nota: novaNota.value,
      comentario: novoComentario.value.trim(),
      id_agencia: agencia.value.id
    })
    novaNota.value = 0
    novoComentario.value = ''
    await carregarAgencia()
  } catch (e) {
    console.error('Erro ao enviar avaliação:', e)
    erroAvaliacao.value = 'Não conseguimos enviar sua avaliação agora. Tente novamente.'
  } finally {
    enviandoAvaliacao.value = false
  }
}

const iniciais = computed(() => {
  if (!agencia.value?.nome) return ''
  return agencia.value.nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
})

const estrelas = computed(() => {
  const nota = Math.round(agencia.value?.nota_media ?? 0)
  return Array.from({ length: 5 }, (_, i) => i < nota)
})

async function carregarAgencia() {
  carregando.value = true
  erro.value = false
  try {
    const { data } = await axios.get(`/agencia/${route.params.id}/`)
    agencia.value = data
  } catch (e) {
    console.error('Erro ao buscar agência:', e)
    erro.value = true
  } finally {
    carregando.value = false
  }
}

let ctx
function animarEntrada() {
  if (prefersReducedMotion()) return
  ctx = gsap.context(() => {
    gsap.from('.reveal-section', {
      opacity: 0,
      y: 24,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '.agencia-view', start: 'top 70%' }
    })
    gsap.utils.toArray('.reveal-grid').forEach((grid) => {
      gsap.from(grid.children, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: grid, start: 'top 85%' }
      })
    })
  })
}

onMounted(async () => {
  // Espera pelo menos o tempo da transição de troca de página terminar
  // antes de medir posições pro ScrollTrigger — ele mira no próprio
  // elemento raiz da página, que a transição ainda está escalando/
  // desfocando nesse meio-tempo; medir antes disso acabar deixa a
  // animação de entrada com posições erradas.
  await Promise.all([carregarAgencia(), carregarFavoritos(), new Promise((r) => setTimeout(r, 260))])
  if (!erro.value) {
    animarEntrada()
  }
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="agencia-view gb-section">
    <div v-if="carregando" class="estado-skeleton" aria-hidden="true">
      <div class="skeleton-hero"></div>
      <div class="skeleton-row"></div>
      <div class="skeleton-row"></div>
    </div>

    <div v-else-if="erro" class="estado-erro">
      <p>Não conseguimos carregar essa agência agora.</p>
      <div class="estado-erro-acoes">
        <button class="btn-tentar-novamente" @click="carregarAgencia">Tentar novamente</button>
        <router-link to="/destinos">Voltar para todos os destinos</router-link>
      </div>
    </div>

    <template v-else-if="agencia">
      <nav class="breadcrumb" aria-label="Caminho de navegação">
        <router-link to="/destinos">Destinos</router-link>
        <template v-if="agencia.regiao">
          <span>/</span>
          <router-link :to="{ name: 'regiao', params: { regiao: agencia.regiao } }">{{ regiaoLabel }}</router-link>
        </template>
        <template v-if="agencia.pais_id">
          <span>/</span>
          <router-link :to="{ name: 'pais', params: { id: agencia.pais_id } }">{{ agencia.pais }}</router-link>
        </template>
        <span>/</span>
        <span class="current">{{ agencia.nome }}</span>
      </nav>

      <template v-for="bloco in layoutFinal" :key="bloco.tipo">

      <section
        v-if="bloco.tipo === 'hero' && bloco.variante === 'banner'"
        class="hero hero-banner reveal-section"
        :style="agencia.imagem_capa_url ? {
          backgroundImage: `url(${agencia.imagem_capa_url})`,
          backgroundPosition: `${agencia.imagem_capa_foco_x ?? 50}% ${agencia.imagem_capa_foco_y ?? 50}%`,
        } : {}"
      >
        <div class="hero-banner-scrim"></div>
        <div class="hero-banner-content">
          <h1 class="agencia-title on-banner">{{ agencia.nome }}</h1>
          <div class="meta-row">
            <span v-if="agencia.nota_media !== null" class="stars-lg" role="img" :aria-label="`${Math.round(agencia.nota_media)} de 5 estrelas`">
              <span v-for="(preenchida, i) in estrelas" :key="i" class="filled" :class="{ empty: !preenchida }" aria-hidden="true">{{ preenchida ? '★' : '☆' }}</span>
              <span class="rating-num on-banner">{{ agencia.nota_media.toFixed(1) }} · {{ agencia.total_avaliacoes }} avaliaç{{ agencia.total_avaliacoes === 1 ? 'ão' : 'ões' }}</span>
            </span>
            <span v-if="agencia.cidade" class="location-row on-banner">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="#fff" stroke-width="1.3"/><circle cx="8" cy="6" r="1.6" stroke="#fff" stroke-width="1.3"/></svg>
              {{ agencia.cidade }}<template v-if="agencia.pais">, {{ agencia.pais }}</template>
            </span>
          </div>
          <div class="hero-actions">
            <a v-if="agencia.contato" :href="`mailto:${agencia.contato}`" class="btn-primary-lg">Falar com a agência</a>
            <a v-if="agencia.site" :href="agencia.site" target="_blank" rel="noopener" class="btn-outline-lg btn-outline-on-banner">Visitar site</a>
            <button v-if="estaLogado" class="fav-btn fav-btn-on-banner" :class="{ active: favoritado }" :aria-pressed="favoritado" :aria-label="favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos'" @click="handleFavoritar">
              <svg width="18" height="18" viewBox="0 0 24 24" :fill="favoritado ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="fav-icon"><path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 4.5 6 4c2.1-.3 3.9.9 6 3 2.1-2.1 3.9-3.3 6-3 3.7.5 5.5 4.2 4 7.9-2.5 4.5-10 9.1-10 9.1z" /></svg>
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="bloco.tipo === 'hero'" class="hero reveal-section">
        <div class="avatar" aria-hidden="true">{{ iniciais }}</div>
        <div class="hero-info">
          <h1 class="agencia-title">{{ agencia.nome }}</h1>
          <div class="meta-row">
            <span v-if="agencia.nota_media !== null" class="stars-lg" role="img" :aria-label="`${Math.round(agencia.nota_media)} de 5 estrelas`">
              <span v-for="(preenchida, i) in estrelas" :key="i" class="filled" :class="{ empty: !preenchida }" aria-hidden="true">{{ preenchida ? '★' : '☆' }}</span>
              <span class="rating-num">{{ agencia.nota_media.toFixed(1) }} · {{ agencia.total_avaliacoes }} avaliaç{{ agencia.total_avaliacoes === 1 ? 'ão' : 'ões' }}</span>
            </span>
            <span v-if="agencia.cidade" class="location-row">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" stroke="#757067" stroke-width="1.3"/><circle cx="8" cy="6" r="1.6" stroke="#757067" stroke-width="1.3"/></svg>
              {{ agencia.cidade }}<template v-if="agencia.pais">, {{ agencia.pais }}</template>
            </span>
          </div>
          <p class="tagline">{{ agencia.descricao }}</p>
          <p v-if="agencia.outros_paises?.length" class="tambem-atende">Também atende: {{ agencia.outros_paises.join(', ') }}</p>
        </div>
        <div class="hero-actions">
          <a v-if="agencia.contato" :href="`mailto:${agencia.contato}`" class="btn-primary-lg">Falar com a agência</a>
          <a v-if="agencia.site" :href="agencia.site" target="_blank" rel="noopener" class="btn-outline-lg">Visitar site</a>
          <button
            v-if="estaLogado"
            class="fav-btn"
            :class="{ active: favoritado }"
            :aria-pressed="favoritado"
            :aria-label="favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos'"
            @click="handleFavoritar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" :fill="favoritado ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="fav-icon">
              <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.3 4.5 6 4c2.1-.3 3.9.9 6 3 2.1-2.1 3.9-3.3 6-3 3.7.5 5.5 4.2 4 7.9-2.5 4.5-10 9.1-10 9.1z" />
            </svg>
          </button>
        </div>
      </section>

      <section v-else-if="bloco.tipo === 'como_funciona'" class="como-funciona reveal-section" :class="{ 'como-funciona-destaque': bloco.variante === 'destaque' }">
        <SectionEyebrow label="Como funciona" />
        <h2 class="gb-heading">O processo com<br />{{ agencia.nome }}</h2>
        <template v-if="agencia.como_funciona">
          <blockquote v-if="bloco.variante === 'destaque'" class="como-funciona-quote">“{{ agencia.como_funciona }}”</blockquote>
          <p v-else class="como-funciona-texto">{{ agencia.como_funciona }}</p>
        </template>
        <p v-else class="estado-vazio">
          {{ agencia.nome }} ainda não descreveu aqui como funciona o processo de inscrição e atendimento.
        </p>
      </section>

      <section v-else-if="bloco.tipo === 'catalogo'" class="catalogo reveal-section">
        <SectionEyebrow label="Catálogo" />
        <h2 class="gb-heading">Programas<br />oferecidos</h2>
        <div v-if="agencia.planos.length" class="catalogo-grid reveal-grid" :class="{ 'catalogo-lista': bloco.variante === 'lista' }">
          <ProgramaCard
            v-for="plano in agencia.planos"
            :key="plano.id"
            :nome="plano.programa_nome"
            :descricao="plano.descricao"
            tag="Programa"
            :duracao="`${plano.duracao_min} a ${plano.duracao_max} meses`"
            :footer-meta="`R$ ${Number(plano.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`"
          />
        </div>
        <p v-else class="estado-vazio">Ainda não há programas cadastrados pra essa agência.</p>
      </section>

      <section v-else-if="bloco.tipo === 'avaliacoes'" class="avaliacoes reveal-section">
        <SectionEyebrow :label="`${agencia.total_avaliacoes} avaliaç${agencia.total_avaliacoes === 1 ? 'ão' : 'ões'}`" />
        <h2 class="gb-heading">O que dizem<br />sobre a agência</h2>

        <form v-if="estaLogado" class="form-avaliacao" @submit.prevent="enviarAvaliacao">
          <span class="form-label">Deixe sua avaliação</span>
          <div class="form-stars" role="group" aria-label="Nota de 1 a 5 estrelas">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="form-star"
              :class="{ filled: n <= novaNota }"
              :aria-pressed="n <= novaNota"
              :aria-label="`${n} de 5 estrelas`"
              @click="novaNota = n"
            >{{ n <= novaNota ? '★' : '☆' }}</button>
          </div>
          <textarea
            v-model="novoComentario"
            class="form-textarea"
            rows="3"
            placeholder="Conte como foi sua experiência com essa agência..."
          ></textarea>
          <p v-if="erroAvaliacao" class="form-erro">{{ erroAvaliacao }}</p>
          <button type="submit" class="btn-primary-lg form-submit" :disabled="enviandoAvaliacao">
            {{ enviandoAvaliacao ? 'Enviando...' : 'Enviar avaliação' }}
          </button>
        </form>
        <p v-else class="form-login-hint">
          <router-link to="/login">Entre na sua conta</router-link> pra deixar uma avaliação sobre essa agência.
        </p>

        <div v-if="agencia.avaliacoes.length" class="review-cards reveal-grid" :class="{ 'review-cards-compacta': bloco.variante === 'compacta' }">
          <article v-for="avaliacao in agencia.avaliacoes" :key="avaliacao.id" class="review-card">
            <span class="review-stars" role="img" :aria-label="`${avaliacao.nota} de 5 estrelas`">
              <template v-for="n in 5" :key="n"><span aria-hidden="true">{{ n <= avaliacao.nota ? '★' : '☆' }}</span></template>
            </span>
            <p class="review-text">{{ avaliacao.comentario }}</p>
            <router-link :to="{ name: 'perfil-publico', params: { username: avaliacao.autor_username } }" class="review-autor">
              <span class="review-avatar">
                <img v-if="avaliacao.autor_foto" :src="avaliacao.autor_foto" :alt="avaliacao.autor" />
                <span v-else aria-hidden="true">{{ iniciaisDe(avaliacao.autor) }}</span>
              </span>
              <strong>{{ avaliacao.autor }}</strong>
            </router-link>
          </article>
        </div>
        <p v-else class="estado-vazio">Essa agência ainda não recebeu avaliações.</p>
      </section>

      <section v-else-if="bloco.tipo === 'galeria' && agencia.galeria?.length" class="galeria-secao reveal-section">
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
    </template>
  </div>
</template>

<style scoped>
.agencia-view {
  padding: 120px 5% 72px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  margin-bottom: 20px;
}

.breadcrumb a {
  color: var(--gb-ink-faint);
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--gb-magenta);
}

.breadcrumb .current {
  color: var(--gb-dark);
}

.hero {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: wrap;
}

/* Variante "banner cheio" do hero (editor da conta business) */
.hero-banner {
  position: relative;
  min-height: 340px;
  border-radius: 20px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: var(--gb-dark);
  display: flex;
  align-items: flex-end;
}

.hero-banner-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(23, 17, 26, 0.9) 10%, rgba(23, 17, 26, 0.2) 60%);
}

.hero-banner-content {
  position: relative;
  z-index: 1;
  padding: 36px 40px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.agencia-title.on-banner {
  color: #fff;
}

.rating-num.on-banner {
  color: #fff;
}

.location-row.on-banner {
  color: rgba(251, 246, 231, 0.75);
}

.hero-banner .hero-actions {
  flex-direction: row;
  margin-top: 16px;
}

.btn-outline-on-banner {
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
}

.fav-btn-on-banner {
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.fav-btn-on-banner.active {
  color: var(--gb-accent-light, #FF7DEE);
  border-color: var(--gb-accent-light, #FF7DEE);
}

.tambem-atende {
  font-size: 12.5px;
  color: var(--gb-ink-faint);
  margin-top: 10px;
}

/* Variante "destaque" de como funciona */
.como-funciona-quote {
  font-family: var(--gb-font-display);
  font-size: 1.3rem;
  font-style: italic;
  line-height: 1.5;
  color: var(--gb-magenta-strong);
  border-left: 3px solid var(--gb-magenta);
  padding-left: 20px;
  margin: 0;
  max-width: 640px;
}

/* Variante "lista" do catálogo */
.catalogo-lista {
  grid-template-columns: 1fr !important;
}

/* Variante "compacta" das avaliações */
.review-cards-compacta {
  grid-template-columns: 1fr !important;
  max-width: 640px;
}

.avatar {
  width: 104px;
  height: 104px;
  border-radius: 24px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 40px;
  color: #fff;
}

.hero-info {
  flex: 1;
  min-width: 260px;
}

.agencia-title {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(1.7rem, 1.1rem + 2vw, 2.6rem);
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--gb-dark);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin: 10px 0 14px;
}

.stars-lg {
  font-size: 17px;
  color: var(--gb-purple-deep-16);
}

.stars-lg .filled {
  color: var(--gb-magenta);
}

.stars-lg .filled.empty {
  color: var(--gb-purple-deep-16);
}

.rating-num {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 13px;
  color: var(--gb-dark);
  margin-left: 6px;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gb-ink-faint);
}

.tagline {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 560px;
  margin: 0;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.fav-btn {
  align-self: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--gb-purple-deep-16);
  background: #fff;
  color: var(--gb-ink-faint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.fav-btn:hover {
  background: rgba(46, 10, 46, 0.04);
}

.fav-btn.active {
  color: var(--gb-magenta);
  border-color: var(--gb-magenta);
  background: rgba(176, 31, 176, 0.08);
}

.fav-icon {
  display: block;
}

.fav-icon.pulso {
  animation: fav-pop 260ms ease-out;
}

@keyframes fav-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .fav-icon.pulso {
    animation: none;
  }
}

.btn-primary-lg, .btn-outline-lg {
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
}

.btn-primary-lg {
  background: var(--gb-dark);
  color: #fff;
}

.btn-primary-lg:hover {
  background: var(--gb-magenta);
}

.btn-outline-lg {
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
}

.btn-outline-lg:hover {
  background: rgba(46, 10, 46, 0.04);
}

.como-funciona, .catalogo, .avaliacoes,
.galeria-secao, .video-secao, .equipe-secao, .certificacoes-secao,
.faq-secao, .localizacao-secao, .redes-secao, .whatsapp-secao {
  padding: 48px 0 0;
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

.como-funciona-texto {
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--gb-ink-soft);
  max-width: 640px;
  margin: 0;
  white-space: pre-line;
}

.gb-heading {
  margin: 8px 0 24px;
}

.catalogo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.form-avaliacao {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 560px;
  margin-bottom: 32px;
}

.form-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gb-dark);
}

.form-stars {
  display: flex;
  gap: 6px;
}

.form-star {
  background: none;
  border: none;
  font-size: 26px;
  line-height: 1;
  color: var(--gb-purple-deep-16);
  cursor: pointer;
  padding: 0;
}

.form-star.filled {
  color: var(--gb-magenta);
}

.form-textarea {
  width: 100%;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  font-family: var(--gb-font-display);
  color: var(--gb-dark);
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--gb-magenta);
}

.form-erro {
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.form-submit {
  align-self: flex-start;
}

.form-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-login-hint {
  background: rgba(46, 10, 46, 0.04);
  border-radius: var(--gb-radius-card);
  padding: 18px 22px;
  font-size: 0.92rem;
  color: var(--gb-ink-soft);
  max-width: 560px;
  margin-bottom: 32px;
}

.form-login-hint a {
  color: var(--gb-magenta);
  font-weight: 600;
}

.review-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.review-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--gb-shadow-card);
}

.review-stars {
  color: var(--gb-magenta);
  font-size: 1rem;
  letter-spacing: 2px;
}

.review-text {
  font-size: 0.92rem;
  line-height: 1.6;
  color: #3A3640;
  margin: 0;
}

.review-autor {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--gb-purple-deep-16);
  text-decoration: none;
}

.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.review-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-autor strong {
  font-size: 0.85rem;
  color: var(--gb-dark);
  transition: color 0.15s ease;
}

.review-autor:hover strong {
  color: var(--gb-magenta);
}

.estado-vazio {
  color: var(--gb-ink-soft);
  font-size: 0.95rem;
}

.estado-erro {
  padding: 80px 0;
  text-align: center;
  color: var(--gb-ink-soft);
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.estado-erro-acoes {
  display: flex;
  align-items: center;
  gap: 18px;
}

.btn-tentar-novamente {
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 11px 22px;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
}

.btn-tentar-novamente:hover {
  background: rgba(46, 10, 46, 0.04);
}

.estado-erro a {
  color: var(--gb-magenta);
  font-weight: 600;
}

.estado-skeleton {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px 0;
}

.skeleton-hero, .skeleton-row {
  border-radius: var(--gb-radius-card);
  background: linear-gradient(90deg, rgba(46,10,46,0.06) 25%, rgba(46,10,46,0.1) 37%, rgba(46,10,46,0.06) 63%);
  background-size: 400% 100%;
  animation: gb-skeleton-shimmer 1.6s ease-in-out infinite;
}

.skeleton-hero { height: 200px; }
.skeleton-row { height: 88px; }

@keyframes gb-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-hero, .skeleton-row { animation: none; }
}

@media (max-width: 1100px) {
  .catalogo-grid, .review-cards, .equipe-grid, .certificacoes-grid { grid-template-columns: repeat(2, 1fr); }
  .galeria-grid-publica { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 720px) {
  .hero { flex-direction: column; align-items: flex-start; }
  .hero-actions { flex-direction: row; width: 100%; }
  .hero-actions a { flex: 1; }
  .catalogo-grid, .review-cards, .equipe-grid, .certificacoes-grid { grid-template-columns: 1fr; }
  .galeria-grid-publica { grid-template-columns: repeat(2, 1fr); }
}

/* Header deixou de ser fixed no celular (ver App.vue) — não precisa mais
   do respiro de 120px pra não ficar embaixo dele. */
@media (max-width: 768px) {
  .agencia-view {
    padding: 16px 16px 72px;
  }
}
</style>
