<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { scrollToTarget } from '@/utils/lenis'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import ButtonComponent from '@/components/common/ButtonComponent.vue'

const route = useRoute()

onMounted(() => {
  if (!route.hash) return
  setTimeout(() => scrollToTarget(route.hash), 400)
})

const tiles = [
  {
    numero: '01',
    label: 'Destino',
    text: 'Compare países por custo de vida, cultura, idioma e regras de visto no mapa.',
    image: '/images/motoresCultura.png',
    color: '#7A0F74'
  },
  {
    numero: '02',
    label: 'Programa',
    text: 'Universidade, curso de idioma, Study & Work ou Au Pair, lado a lado.',
    image: '/images/motoresEnsino.png',
    color: '#3972DE'
  },
  {
    numero: '03',
    label: 'Agência',
    text: 'Fale direto com agências verificadas, com avaliação de quem já foi.',
    image: '/images/MotoresIdiomas.png',
    color: '#F0651E'
  }
]

const features = [
  { titulo: 'Mapa comparativo', texto: 'Todos os países lado a lado, com os mesmos indicadores.' },
  { titulo: 'Favoritos', texto: 'Salve os destinos que estão na sua lista e volte pra comparar com calma.' },
  { titulo: 'Avaliações reais', texto: 'Notas e comentários de quem já viajou com cada agência.' },
  { titulo: 'Preferências', texto: 'Idioma, tipo de programa e orçamento salvos no seu perfil.' }
]

const paraAgencias = [
  { titulo: 'Verificação', texto: 'Cadastre seus programas e passe por uma checagem antes de aparecer na plataforma.' },
  { titulo: 'Leads qualificados', texto: 'Receba estudantes que já filtraram destino, idioma e orçamento antes de chegar até você.' },
  { titulo: 'Reputação', texto: 'Construa histórico com avaliações reais de quem já viajou pela sua agência.' }
]
</script>

<template>
  <div class="como-funciona">
    <section class="gb-section hero">
      <SectionEyebrow label="Como funciona" />
      <h1 class="gb-heading hero-heading">Três decisões,<br />um caminho claro</h1>
      <p class="hero-desc">Onde ir, o que cursar e com quem falar — cada passo do intercâmbio pela GlobalBridge cabe numa dessas três frentes.</p>
      <p class="hero-proof">Explore nossa seleção com <strong>mais de 40 países</strong> ao redor do mundo e compare qual combina com o seu perfil.</p>
      <router-link to="/mapview" class="cta-link">
        <ButtonComponent text="Explorar o mapa" class="btn-dark" />
      </router-link>
    </section>

    <section class="gb-section">
      <div class="tiles">
        <div v-for="tile in tiles" :key="tile.numero" class="tile" :style="{ '--tile-color': tile.color }">
          <img class="tile-img" :src="tile.image" :alt="tile.label" />
          <div class="tile-tint"></div>
          <div class="tile-scrim"></div>
          <div class="tile-content">
            <p class="tile-numero">{{ tile.numero }}</p>
            <h3 class="tile-label">{{ tile.label }}</h3>
            <p class="tile-text">{{ tile.text }}</p>
          </div>
        </div>
      </div>

      <div class="detalhes">
        <div>
          <h4>O que pesa na escolha</h4>
          <div class="pills"><span>custo de vida</span><span>idioma</span><span>visto</span></div>
        </div>
        <div>
          <h4>Tipos de programa</h4>
          <div class="legenda">
            <div class="legenda-item"><span class="legenda-linha" style="background:var(--gb-magenta-strong)"></span>Universidade · 12 meses</div>
            <div class="legenda-item"><span class="legenda-linha" style="background:var(--gb-magenta)"></span>Idioma · 6 meses</div>
            <div class="legenda-item"><span class="legenda-linha" style="background:var(--gb-blue)"></span>Study &amp; Work · 9 meses</div>
          </div>
        </div>
        <div>
          <h4>Confiança de quem já foi</h4>
          <div class="avaliacao">
            <span class="estrelas">★★★★☆</span>
            <span class="nota-texto">média de 4,2 em 1.088 agências</span>
          </div>
        </div>
      </div>

      <div class="fork">
        <div class="fork-panel light">
          <p class="fork-tag">Na plataforma</p>
          <h3>O que você encontra por aqui</h3>
          <div class="feature-list">
            <div v-for="f in features" :key="f.titulo" class="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              <div><h4>{{ f.titulo }}</h4><p>{{ f.texto }}</p></div>
            </div>
          </div>
          <router-link to="/mapview" class="cta-link">
            <ButtonComponent text="Começar agora" class="btn-dark" />
          </router-link>
        </div>

        <div id="agencias" class="fork-panel dark">
          <p class="fork-tag">Pra agências e instituições parceiras</p>
          <h3 class="on-dark">Receba estudantes verificados</h3>
          <div class="biz-list">
            <div v-for="b in paraAgencias" :key="b.titulo" class="biz-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              <div><h4>{{ b.titulo }}</h4><p>{{ b.texto }}</p></div>
            </div>
          </div>
          <a href="mailto:contato@globalbridge.com?subject=Login%20business" class="cta-link">
            <ButtonComponent text="Login business" class="btn-outline-light" />
          </a>
        </div>
      </div>

      <div class="prova">
        <p>Dados de 2026 · atualizados com base nas últimas avaliações e cadastros de agências parceiras.</p>
      </div>
    </section>

    <section class="final-cta">
      <div class="gb-section final-inner">
        <h2 class="gb-heading on-dark">Pronto pra dar o próximo passo?</h2>
        <router-link to="/mapview" class="cta-link">
          <ButtonComponent text="Começar agora" style="background: var(--gb-magenta);" />
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.como-funciona {
  width: 100%;
  background: white;
}

.hero {
  padding: var(--gb-space-y) 0 40px;
  padding-top: 120px;
  
}

.hero-heading {
  font-size: clamp(2.2rem, 1.3rem + 4vw, 3.6rem);
  margin: 20px 0 18px;
  max-width: 780px;
}

.hero-desc {
  font-size: 1.02rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 560px;
  margin: 0 0 20px;
}

.hero-proof {
  font-size: 0.92rem;
  color: var(--gb-ink-faint);
  margin: 0 0 28px;
  max-width: 560px;
}

.hero-proof strong {
  color: var(--gb-dark);
}

.cta-link {
  text-decoration: none;
  display: inline-block;
}

/* tiles - mesma receita do MotorComponent */
.tiles {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 12px 0 40px;
}

@media (min-width: 640px) {
  .tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .tiles {
    grid-template-columns: repeat(3, 1fr);
  }
}

.tile {
  position: relative;
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  border: 1px solid var(--gb-purple-deep-16);
  aspect-ratio: 4/5;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.tile:hover {
  box-shadow: 0 16px 32px rgba(23, 17, 26, 0.16);
  transform: translateY(-3px);
}

.tile:hover .tile-img {
  transform: scale(1.06);
}

.tile-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.tile-tint {
  position: absolute;
  inset: 0;
  background: var(--tile-color);
  mix-blend-mode: multiply;
  opacity: 0.55;
}

.tile-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(23, 17, 26, 0) 40%, rgba(23, 17, 26, 0.78) 100%);
}

.tile-content {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 20px;
}

.tile-numero {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 4px;
}

.tile-label {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 22px;
  color: #fff;
  margin: 0 0 8px;
}

.tile-text {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.88);
  margin: 0;
}

/* detalhe compacto abaixo das tiles */
.detalhes {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  padding-top: 32px;
  padding-bottom: 56px;
  border-top: 1px solid var(--gb-purple-deep-18);
}

@media (min-width: 900px) {
  .detalhes {
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
  }
}

.detalhes h4 {
  margin: 0 0 10px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pills span {
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-pill);
  padding: 6px 14px;
  font-size: 0.78rem;
}

.legenda {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legenda-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--gb-ink-soft);
}

.legenda-linha {
  width: 20px;
  height: 4px;
  border-radius: 4px;
  flex-shrink: 0;
}

.avaliacao {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.estrelas {
  color: var(--gb-magenta);
  font-size: 1.05rem;
  letter-spacing: 2px;
}

.nota-texto {
  font-size: 0.8rem;
  color: var(--gb-ink-soft);
}

/* fork */
.fork {
  display: grid;
  grid-template-columns: 1fr;
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  border: 1px solid var(--gb-purple-deep-16);
  margin-bottom: 20px;
}

@media (min-width: 900px) {
  .fork {
    grid-template-columns: 1fr 1fr;
  }
}

.fork-panel {
  padding: 44px 40px;
  scroll-margin-top: 96px;
}

.fork-panel.light {
  background: #fff;
}

.fork-panel.dark {
  background: var(--gb-purple-deep);
}

.fork-tag {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gb-magenta);
  margin: 0 0 10px;
}

.fork-panel.dark .fork-tag {
  color: var(--gb-pink);
}

.fork-panel h3 {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 1.5rem;
  margin: 0 0 20px;
  color: var(--gb-dark);
}

.fork-panel h3.on-dark {
  color: #fff;
}

.feature-list,
.biz-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 26px;
}

.feature-item,
.biz-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.feature-item svg {
  width: 18px;
  height: 18px;
  stroke: var(--gb-magenta);
  flex-shrink: 0;
  margin-top: 2px;
}

.biz-item svg {
  width: 18px;
  height: 18px;
  stroke: var(--gb-pink);
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-item h4,
.biz-item h4 {
  margin: 0 0 3px;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: var(--gb-dark);
}

.biz-item h4 {
  color: #fff;
}

.feature-item p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--gb-ink-soft);
}

.biz-item p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.8);
}

.prova {
  padding-bottom: 60px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.prova p {
  margin: 0;
  color: var(--gb-ink-soft);
  font-size: 0.95rem;
}

.final-cta {
  background: var(--gb-dark);
  padding: 70px 0;
}

.final-inner {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

.final-inner .gb-heading {
  font-size: clamp(1.8rem, 1.2rem + 2.6vw, 2.8rem);
  max-width: 640px;
}

.gb-heading.on-dark {
  color: white;
}
</style>
