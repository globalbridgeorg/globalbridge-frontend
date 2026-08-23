<script setup>
import { ref, nextTick } from 'vue'

const publico = ref('estudante')
const formShell = ref(null)

async function pick(v) {
  if (v === publico.value) return
  const shell = formShell.value

  if (shell) {
    shell.style.height = shell.getBoundingClientRect().height + 'px'
    shell.classList.add('resizing')
  }

  publico.value = v
  await nextTick()

  if (shell) {
    // mede a altura real liberando a altura travada por um instante
    // (ver ProfileView.vue: com a altura antiga fixada, scrollHeight só
    // "estoura" quando o conteúdo novo é maior, nunca quando é menor)
    const lockedHeight = shell.style.height
    shell.style.height = 'auto'
    const endHeight = shell.scrollHeight
    shell.style.height = lockedHeight

    void shell.offsetHeight
    shell.style.height = endHeight + 'px'

    let done = false
    const cleanup = () => {
      if (done) return
      done = true
      shell.style.height = ''
      shell.classList.remove('resizing')
      shell.removeEventListener('transitionend', onEnd)
    }
    const onEnd = (event) => {
      if (event.target === shell && event.propertyName === 'height') cleanup()
    }
    shell.addEventListener('transitionend', onEnd)
    setTimeout(cleanup, 320)
  }
}
</script>

<template>
  <div class="contato">
    <section class="gb-section hero">
      <div class="eyebrow"><span class="eyebrow-label">Contato</span></div>
      <h1 class="gb-heading hero-heading">Quem quer que você seja,<br />a gente escuta</h1>
      <p class="hero-desc">Seja você um <strong>estudante</strong> decidindo o próximo destino ou uma <strong>agência de intercâmbio</strong> querendo se cadastrar, tem um jeito certo de falar com a gente logo abaixo.</p>
    </section>

    <section class="gb-section historia">
      <div class="historia-media"><img src="/images/motoresOportunidades.png" alt="" /></div>
      <div>
        <div class="eyebrow"><span class="eyebrow-label">Como começamos</span></div>
        <h2 class="gb-heading historia-heading">Uma decisão que não devia depender de sorte</h2>
        <p>O GlobalBridge nasceu de uma frustração bem concreta: decidir um intercâmbio dependia de planilha solta, grupo de WhatsApp, e agência que às vezes nem respondia. Cada informação vinha de um lugar diferente, e comparar dois países de verdade era quase impossível.</p>
        <p>Um grupo de ex-intercambistas e desenvolvedores decidiu construir o que gostaria de ter tido na época: <strong>um lugar único</strong> pra comparar destinos com os mesmos critérios, ver avaliação real de quem já passou por cada agência, e falar direto com quem organiza o programa — sem intermediário escondendo informação.</p>
        <p>Hoje a plataforma conecta estudantes a mais de 40 países e a agências parceiras verificadas, mas o objetivo continua o mesmo do primeiro dia: tirar a decisão do intercâmbio da mão do achismo — dos dois lados da mesa.</p>
      </div>
    </section>

    <section class="gb-section">
      <div class="fork">
        <div class="fork-panel light">
          <p class="fork-tag">Se você é estudante</p>
          <h3>Fale com a gente sobre</h3>
          <div class="reason-list">
            <div class="reason-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              <p>Dúvidas sobre um destino, programa ou como comparar países no mapa.</p>
            </div>
            <div class="reason-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              <p>Problemas com uma agência parceira ou algo que não bateu com o combinado.</p>
            </div>
            <div class="reason-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              <p>Sugestões de melhoria pra plataforma — a gente lê tudo.</p>
            </div>
          </div>
        </div>

        <div class="fork-panel dark">
          <p class="fork-tag">Se você é agência ou instituição</p>
          <h3 class="on-dark">Fale com a gente sobre</h3>
          <div class="reason-list">
            <div class="reason-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              <p>Cadastro de programas e verificação pra aparecer na plataforma.</p>
            </div>
            <div class="reason-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              <p>Parcerias institucionais e acesso ao login business.</p>
            </div>
            <div class="reason-item">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
              <p>Suporte técnico ou dúvida sobre uma avaliação recebida.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="gb-section form-wrap">
      <div class="form-head">
        <div class="eyebrow"><span class="eyebrow-label">Formulário</span></div>
        <div class="heading-row">
          <h2 class="gb-heading">Manda sua mensagem</h2>
          <p class="heading-desc">Escolha quem você é pra gente direcionar certo — o resto do time responde por aqui.</p>
        </div>
      </div>

      <div class="segmented">
        <div class="segmented-thumb" :class="{ right: publico === 'agencia' }"></div>
        <button class="seg-btn" :class="{ active: publico === 'estudante' }" @click="pick('estudante')">Sou estudante</button>
        <button class="seg-btn" :class="{ active: publico === 'agencia' }" @click="pick('agencia')">Sou agência</button>
      </div>

      <div class="form-shell" ref="formShell">
        <div class="form-grid">
          <div class="field"><label>Nome</label><input type="text" placeholder="Seu nome" /></div>
          <div class="field"><label>E-mail</label><input type="email" placeholder="seu@email.com" /></div>
          <div v-if="publico === 'agencia'" class="field full"><label>Nome da agência</label><input type="text" placeholder="Nome da sua agência ou instituição" /></div>
          <div class="field full">
            <label>Assunto</label>
            <select>
              <option>Dúvida sobre destino ou programa</option>
              <option>Problema com uma agência</option>
              <option>Cadastro de programas</option>
              <option>Parceria institucional</option>
              <option>Suporte técnico</option>
              <option>Sugestão pra plataforma</option>
            </select>
          </div>
          <div class="field full"><label>Mensagem</label><textarea rows="4" placeholder="Conte com detalhes o que você precisa"></textarea></div>
          <div class="form-actions">
            <button class="btn btn-dark" type="button">Enviar mensagem</button>
            <p class="form-note">Respondemos pelo e-mail que você deixar aqui.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="gb-section canais">
      <div class="canal">
        <div class="canal-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg></div>
        <div>
          <h4>E-mail</h4>
          <a href="mailto:contato@globalbridge.com">contato@globalbridge.com</a>
        </div>
      </div>
      <div class="canal">
        <div class="canal-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.2" /><circle cx="16.2" cy="7.8" r="0.6" fill="currentColor" /></svg></div>
        <div>
          <h4>Instagram</h4>
          <p>@globalbridge <span class="soon">(em breve)</span></p>
        </div>
      </div>
      <div class="canal">
        <div class="canal-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 11v5M8 8.2v.1M12 16v-3.2c0-1.2 1-2 2-2s2 .8 2 2V16" /></svg></div>
        <div>
          <h4>LinkedIn</h4>
          <p>GlobalBridge <span class="soon">(em breve)</span></p>
        </div>
      </div>
    </section>

    <section class="gb-section faq">
      <div class="eyebrow"><span class="eyebrow-label">Perguntas frequentes</span></div>
      <div class="heading-row"><h2 class="gb-heading">Antes de escrever</h2></div>
      <div class="faq-item">
        <h4>Preciso ter conta pra falar com vocês?</h4>
        <p>Não. O formulário e o e-mail funcionam pra qualquer pessoa, com ou sem cadastro na plataforma.</p>
      </div>
      <div class="faq-item">
        <h4>Sou uma agência, como faço pra me cadastrar?</h4>
        <p>Use o formulário acima com "Sou agência" selecionado e assunto "Cadastro de programas" — nosso time entra em contato com os próximos passos da verificação.</p>
      </div>
      <div class="faq-item">
        <h4>Tive um problema com uma agência parceira, o que eu faço?</h4>
        <p>Conte pra gente com o máximo de detalhe no formulário (assunto "Problema com uma agência") — isso também entra na avaliação da agência na plataforma.</p>
      </div>
      <div class="faq-item">
        <h4>Encontrei um erro ou tenho uma ideia pra plataforma</h4>
        <p>Manda pelo formulário com o assunto "Sugestão pra plataforma" — feedback de quem usa é o que mais ajuda a gente a melhorar.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.contato {
  width: 100%;
  padding-top: 120px;
}

.eyebrow {
  display: flex;
  align-items: baseline;
  width: 100%;
  padding-top: 16px;
  border-top: 1px solid var(--gb-purple-deep-18);
}

.eyebrow-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gb-mauve);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 15px;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.btn-dark {
  background: var(--gb-dark);
  color: #fff;
}

.btn-dark:hover {
  background: var(--gb-magenta);
}

/* hero */
.hero {
  padding-bottom: 30px;
}

.hero-heading {
  font-size: clamp(2.1rem, 1.2rem + 3.8vw, 3.4rem);
  margin: 20px 0 16px;
  max-width: 760px;
}

.hero-desc {
  font-size: 1.02rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 620px;
  margin: 0;
}

.hero-desc strong {
  color: var(--gb-dark);
}

/* história */
.historia {
  display: grid;
  grid-template-columns: 1fr;
  gap: 36px;
  padding: 44px 0 56px;
  border-top: 1px solid var(--gb-purple-deep-18);
  margin-top: 24px;
}

@media (min-width: 900px) {
  .historia {
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 56px;
  }
}

.historia-media {
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  aspect-ratio: 4/3;
  border: 1px solid var(--gb-purple-deep-16);
}

.historia-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.historia-heading {
  font-size: clamp(1.5rem, 1.1rem + 1.8vw, 2.1rem);
  margin: 16px 0 18px;
}

.historia p {
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--gb-ink-soft);
  margin: 0 0 16px;
}

.historia p:last-child {
  margin-bottom: 0;
}

.historia strong {
  color: var(--gb-dark);
}

/* fork */
.fork {
  display: grid;
  grid-template-columns: 1fr;
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  border: 1px solid var(--gb-purple-deep-16);
  margin: 0 0 56px;
}

@media (min-width: 900px) {
  .fork {
    grid-template-columns: 1fr 1fr;
  }
}

.fork-panel {
  padding: 40px 40px;
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
  font-size: 1.4rem;
  margin: 0 0 18px;
  color: var(--gb-dark);
}

.fork-panel h3.on-dark {
  color: #fff;
}

.reason-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0 0 24px;
}

.reason-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.reason-item svg {
  width: 17px;
  height: 17px;
  stroke: var(--gb-magenta);
  flex-shrink: 0;
  margin-top: 2px;
}

.fork-panel.dark .reason-item svg {
  stroke: var(--gb-pink);
}

.reason-item p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--gb-ink-soft);
}

.fork-panel.dark .reason-item p {
  color: rgba(255, 255, 255, 0.8);
}

/* form */
.form-wrap {
  padding: 0 0 56px;
}

.form-head {
  margin-bottom: 24px;
}

.segmented {
  position: relative;
  display: inline-flex;
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-pill);
  padding: 4px;
  margin-bottom: 28px;
}

.segmented-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: var(--gb-dark);
  border-radius: var(--gb-radius-pill);
  transition: transform 0.25s ease;
}

.segmented-thumb.right {
  transform: translateX(100%);
}

.seg-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  white-space: nowrap;
  border: none;
  background: transparent;
  padding: 9px 20px;
  border-radius: var(--gb-radius-pill);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gb-ink-soft);
  cursor: pointer;
  transition: color 0.25s ease;
}

.seg-btn.active {
  color: #fff;
}

.form-shell {
  transition: height 0.28s ease;
}

.form-shell.resizing {
  overflow: hidden;
}

.form-grid {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 36px 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
}

.field input,
.field select,
.field textarea {
  padding: 11px 13px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 9px;
  font-size: 14px;
  font-family: var(--gb-font-display);
  color: var(--gb-dark);
  background: #fff;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--gb-magenta);
  box-shadow: 0 0 0 3px rgba(176, 31, 176, 0.12);
}

.field textarea {
  resize: vertical;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 6px;
}

.form-note {
  font-size: 0.8rem;
  color: var(--gb-ink-faint);
  margin: 0;
}

/* canais diretos */
.canais {
  padding: 0 0 56px;
  border-top: 1px solid var(--gb-purple-deep-18);
  padding-top: 40px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 900px) {
  .canais {
    grid-template-columns: repeat(3, 1fr);
  }
}

.canal {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.canal-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--gb-cream);
  border: 1px solid var(--gb-purple-deep-16);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.canal-icon svg {
  width: 19px;
  height: 19px;
  stroke: var(--gb-magenta-strong);
}

.canal h4 {
  margin: 0 0 4px;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.9rem;
  color: var(--gb-dark);
}

.canal p,
.canal a {
  margin: 0;
  font-size: 0.88rem;
  color: var(--gb-ink-soft);
  text-decoration: none;
}

.canal a:hover {
  color: var(--gb-magenta);
}

.soon {
  opacity: 0.6;
}

/* faq */
.faq {
  padding: 0 0 60px;
}

.faq-item {
  border-top: 1px solid var(--gb-purple-deep-18);
  padding: 20px 0;
}

.faq-item h4 {
  margin: 0 0 8px;
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 0.92rem;
  color: var(--gb-dark);
}

.faq-item p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  max-width: 720px;
}

.heading-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0 28px;
}

.heading-desc {
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--gb-ink-soft);
  max-width: 460px;
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .segmented-thumb,
  .seg-btn,
  .form-shell {
    transition: none;
  }
}
</style>
