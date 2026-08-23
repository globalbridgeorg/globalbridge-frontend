<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/services/axios'
import PhotoComponent from '@/components/profile/PhotoComponent.vue'
import NotificationBanner from '@/components/profile/NotificationBanner.vue'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const profile = ref({
  id: null,
  name: '',
  email: '',
  avatar_url: ''
})

const section = ref('perfil')
const sidebarItems = [
  { key: 'perfil', label: 'Perfil', image: '/images/profile_perfil.png', color: 'rgba(122,15,116,0.45)' },
  { key: 'seguranca', label: 'Segurança', image: '/images/profile_secure.png', color: 'rgba(57,114,222,0.45)' },
  { key: 'favoritos', label: 'Favoritos', image: '/images/profile_favorite.png', color: 'rgba(240,101,30,0.4)' },
  { key: 'avaliacoes', label: 'Avaliações', image: '/images/profile_saved.png', color: 'rgba(61,154,75,0.4)' },
  { key: 'preferencias', label: 'Preferências', image: '/images/profile_settings.png', color: 'rgba(90,71,87,0.5)' }
]

const sidebarMeta = computed(() => ({
  perfil: 'Dados pessoais',
  seguranca: 'Senha e sessões',
  favoritos: favorites.length + ' destino' + (favorites.length === 1 ? '' : 's') + ' salvo' + (favorites.length === 1 ? '' : 's'),
  avaliacoes: reviews.length + ' publicada' + (reviews.length === 1 ? '' : 's'),
  preferencias: (idioma.value || 'Sem idioma') + ' · ' + (programa.value || 'sem programa')
}))

const panelShell = ref(null)

async function selectSection(key) {
  if (key === section.value) return
  const shell = panelShell.value

  if (shell) {
    shell.style.height = shell.getBoundingClientRect().height + 'px'
    shell.classList.add('resizing')
  }

  section.value = key
  await nextTick()

  if (shell) {
    // mede a altura real do conteúdo novo liberando a altura travada por um instante
    // (com a altura antiga ainda fixada, scrollHeight só "estoura" quando o conteúdo novo
    // é maior — quando é menor ele só devolve a altura antiga, e o encolher não anima).
    // Desliga a transição enquanto mede: sem isso, esse vai-e-vem no valor de height
    // "consome" a transição de verdade e o encolher só dá um salto direto pro tamanho
    // final, sem animar.
    const lockedHeight = shell.style.height
    shell.style.transition = 'none'
    shell.style.height = 'auto'
    const endHeight = shell.scrollHeight
    shell.style.height = lockedHeight
    void shell.offsetHeight

    // religa a transição e força o reflow pra registrar a altura de partida antes de animar
    shell.style.transition = ''
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
    // rede de segurança caso a transição não dispare (ex.: altura igual, prefers-reduced-motion)
    setTimeout(cleanup, 320)
  }
}

// ---- Perfil (nome é salvo de verdade; telefone/cidade/bio ainda não têm campo no backend) ----
const editForm = reactive({ name: '', telefone: '', cidade: '', sobre: '' })
const savingProfile = ref(false)
const profileSaved = ref(false)

async function saveProfile() {
  savingProfile.value = true
  profileSaved.value = false
  try {
    await axios.patch(`/usuarios/${profile.value.id}/`, { name: editForm.name })
    profile.value.name = editForm.name
    profileSaved.value = true
  } catch (err) {
    console.error('Erro ao salvar nome do perfil:', err)
  } finally {
    savingProfile.value = false
  }
}

// ---- Segurança (sem endpoint de senha/sessões ainda — fica só na tela) ----
const pwSaved = ref(false)
const twoFa = ref(false)
function savePassword() { pwSaved.value = true }
function toggleTwoFa() { twoFa.value = !twoFa.value }

// ---- Favoritos (sem endpoint de favoritos ainda — só nesta sessão) ----
const favorites = reactive([
  { id: 'ie', name: 'Irlanda', code: 'IE', color: '#3972DE', uni: '12 parceiras', saved: '3 semanas atrás' },
  { id: 'ca', name: 'Canadá', code: 'CA', color: '#7A0F74', uni: '20 parceiras', saved: '1 mês atrás' },
  { id: 'au', name: 'Austrália', code: 'AU', color: '#33803E', uni: '8 parceiras', saved: '2 meses atrás' }
])
function removeFavorite(id) {
  const idx = favorites.findIndex((f) => f.id === id)
  if (idx !== -1) favorites.splice(idx, 1)
}

// ---- Avaliações (o backend só tem avaliação de agência hoje — isto aqui é só demonstrativo) ----
const reviews = reactive([
  { country: 'Irlanda · Dublin', date: 'publicada há 3 meses', rating: 4, text: 'Cidade acolhedora e universidade muito organizada com estudantes internacionais.' }
])

// ---- Preferências (sem endpoint ainda — só nesta sessão) ----
const idioma = ref('Inglês')
const programa = ref('Intercâmbio acadêmico')
const notifEmail = ref(true)
const notifWhats = ref(false)
const idiomaOptions = ['Inglês', 'Espanhol', 'Francês', 'Alemão']
const programaOptions = ['Intercâmbio acadêmico', 'Trabalho e estudo', 'Curso de idiomas']

// ---- Status da conta / atividade (ilustrativo — sem verificação/atividade real no backend ainda) ----
const docSent = ref(false)
function sendDocument() { docSent.value = true }
const activity = [
  { label: 'Perfil atualizado', when: 'há 2 dias', color: 'var(--gb-magenta-strong)' },
  { label: 'Login em novo dispositivo · iPhone 13', when: 'há 2 dias', color: 'var(--gb-blue)' },
  { label: 'Novo favorito: Irlanda', when: 'há 3 semanas', color: 'var(--gb-orange)' },
  { label: 'Preferências de intercâmbio atualizadas', when: 'há 1 mês', color: 'var(--gb-green)' }
]

const showWelcome = ref(false)
function closeWelcome() { showWelcome.value = false }

const getAuthToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

const fetchProfile = async () => {
  const token = getAuthToken()
  if (!token) {
    router.push({ name: 'login' })
    return
  }

  const profileEndpoints = ['/usuarios/me/', '/api/usuarios/me/', '/me/', '/profile/']
  let response = null

  try {
    for (const endpoint of profileEndpoints) {
      try {
        response = await axios.get(endpoint)
        break
      } catch (err) {
        if (err.response?.status !== 404) {
          throw err
        }
      }
    }

    if (!response) {
      throw new Error('Profile endpoint not found')
    }

    const data = response.data || {}
    profile.value.id = data.id ?? null
    profile.value.name = data.name || data.full_name || ''
    profile.value.email = data.email || ''
    profile.value.avatar_url = data.avatar_url || data.avatar || data.photo_url || ''
    editForm.name = profile.value.name
  } catch (err) {
    if (err.response?.status === 401) {
      router.push({ name: 'login' })
      return
    }
    error.value = 'Não foi possível carregar seu perfil. Tente novamente mais tarde.'
    console.error('Profile fetch error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
  try {
    if (!sessionStorage.getItem('seenProfileWelcome')) {
      showWelcome.value = true
      sessionStorage.setItem('seenProfileWelcome', '1')
    }
  } catch (e) {
    // sessionStorage pode falhar em alguns ambientes; falhar silenciosamente
  }
})
</script>

<template>
  <div class="profile-page">
    <div class="top-banner"><span>Minha conta</span></div>

    <div class="content gb-section">
      <div v-if="loading" class="loading-state">Carregando perfil...</div>

      <template v-else>
        <div v-if="error" class="profile-error">{{ error }}</div>

        <div class="profile-header">
          <PhotoComponent
            :initial-preview="profile.avatar_url"
            @avatar-updated="(url) => (profile.avatar_url = url)"
          />
          <div class="who">
            <h2>{{ profile.name || 'Usuário' }}</h2>
            <p>{{ profile.email || 'email@exemplo.com' }}</p>
          </div>
        </div>

        <NotificationBanner
          v-if="showWelcome"
          message="Bem-vindo ao seu painel de perfil."
          @close="closeWelcome"
        />

        <div class="layout">
          <div class="side-nav">
            <button
              v-for="item in sidebarItems"
              :key="item.key"
              class="side-item"
              :class="{ active: section === item.key }"
              @click="selectSection(item.key)"
            >
              <div class="side-thumb">
                <img :src="item.image" alt="" />
               
              </div>
              <div class="side-text">
                <span class="side-label">{{ item.label }}</span>
                <span class="side-meta">{{ sidebarMeta[item.key] }}</span>
              </div>
            </button>
          </div>

          <div>
            <div class="panel-shell" ref="panelShell">
            <div v-if="section === 'perfil'" class="panel" key="perfil">
              <h3>Dados pessoais</h3>
              <p class="panel-sub">Informações da sua conta e do seu perfil público</p>
              <div class="field-row">
                <div class="field"><label>Nome completo</label><input v-model="editForm.name" type="text" /></div>
                <div class="field"><label>E-mail</label><input :value="profile.email" type="email" disabled /></div>
                <div class="field"><label>Telefone</label><input v-model="editForm.telefone" type="text" placeholder="(11) 90000-0000" /></div>
                <div class="field"><label>Cidade / Estado</label><input v-model="editForm.cidade" type="text" placeholder="Sua cidade" /></div>
              </div>
              <div class="field" style="margin-bottom:16px;">
                <label>Sobre você</label>
                <textarea v-model="editForm.sobre" rows="3" placeholder="Conte um pouco sobre seus planos de intercâmbio..."></textarea>
              </div>
              <button class="btn-save" :disabled="savingProfile" @click="saveProfile">{{ savingProfile ? 'Salvando...' : 'Salvar alterações' }}</button>
              <span v-if="profileSaved" class="saved-flash">Perfil atualizado ✓</span>
            </div>

            <div v-else-if="section === 'seguranca'" class="panel" key="seguranca">
              <h3>Segurança</h3>
              <p class="panel-sub">Senha, autenticação e dispositivos conectados</p>
              <div class="field" style="margin-bottom:14px; max-width:360px;"><label>Senha atual</label><input type="password" placeholder="••••••••" /></div>
              <div class="field-row">
                <div class="field"><label>Nova senha</label><input type="password" placeholder="Crie uma nova senha" /></div>
                <div class="field"><label>Confirmar nova senha</label><input type="password" placeholder="Digite novamente" /></div>
              </div>
              <button class="btn-save" @click="savePassword">Atualizar senha</button>
              <span v-if="pwSaved" class="saved-flash">Senha atualizada ✓</span>

              <div class="toggle-row" style="margin-top:20px;">
                <div><div class="toggle-label">Verificação em duas etapas</div><div class="toggle-sub">Adiciona uma etapa de confirmação por e-mail no login</div></div>
                <button class="toggle-sw" :class="{ on: twoFa }" @click="toggleTwoFa"></button>
              </div>

              <div class="session-row" style="margin-top:8px;">
                <div><div class="session-device">Este dispositivo</div><div class="session-meta">Sessão atual</div></div>
                <span class="session-tag">Atual</span>
              </div>
              <div class="session-row">
                <div><div class="session-device">iPhone 13 · Safari</div><div class="session-meta">há 2 dias</div></div>
                <button class="link-danger">Encerrar</button>
              </div>
            </div>

            <div v-else-if="section === 'favoritos'" class="panel" key="favoritos">
              <h3>Favoritos</h3>
              <p class="panel-sub">Destinos que você salvou para comparar depois</p>
              <table class="fav-table">
                <tr><th>País</th><th>Universidades parceiras</th><th>Salvo em</th><th></th></tr>
                <tr v-for="fav in favorites" :key="fav.id">
                  <td><div class="fav-country"><span class="fav-dot" :style="{ background: fav.color }">{{ fav.code }}</span>{{ fav.name }}</div></td>
                  <td>{{ fav.uni }}</td>
                  <td>{{ fav.saved }}</td>
                  <td><button class="fav-remove" @click="removeFavorite(fav.id)"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke-width="1.8" stroke-linecap="round"/></svg></button></td>
                </tr>
              </table>
              <p v-if="!favorites.length" class="panel-empty">Você ainda não salvou nenhum destino.</p>
            </div>

            <div v-else-if="section === 'avaliacoes'" class="panel" key="avaliacoes">
              <h3>Avaliações</h3>
              <p class="panel-sub">Experiências que você compartilhou com outros estudantes</p>
              <div v-for="(rev, i) in reviews" :key="i" class="review-item">
                <div class="review-top"><span class="review-country">{{ rev.country }}</span><span class="review-date">{{ rev.date }}</span></div>
                <div class="review-stars">
                  <svg v-for="n in 5" :key="n" viewBox="0 0 24 24" :class="{ empty: n > rev.rating }"><path d="M12 17.3l-5.3 3 1.4-6-4.6-4 6-.5L12 4l2.5 5.8 6 .5-4.6 4 1.4 6z"/></svg>
                </div>
                <p class="review-text">{{ rev.text }}</p>
              </div>
              <p v-if="!reviews.length" class="panel-empty">Você ainda não escreveu nenhuma avaliação.</p>
              <button class="cta-write">Escrever nova avaliação</button>
            </div>

            <div v-else-if="section === 'preferencias'" class="panel" key="preferencias">
              <h3>Preferências</h3>
              <p class="panel-sub">Personalize as recomendações de intercâmbio</p>
              <div class="pref-group">
                <span class="pref-group-label">Idioma de interesse</span>
                <div class="chip-row">
                  <button v-for="opt in idiomaOptions" :key="opt" class="chip" :class="{ picked: idioma === opt }" @click="idioma = opt">{{ opt }}</button>
                </div>
              </div>
              <div class="pref-group">
                <span class="pref-group-label">Tipo de programa</span>
                <div class="chip-row">
                  <button v-for="opt in programaOptions" :key="opt" class="chip" :class="{ picked: programa === opt }" @click="programa = opt">{{ opt }}</button>
                </div>
              </div>
              <div class="toggle-row">
                <div class="toggle-label">Notificações por e-mail</div>
                <button class="toggle-sw" :class="{ on: notifEmail }" @click="notifEmail = !notifEmail"></button>
              </div>
              <div class="toggle-row">
                <div class="toggle-label">Notificações por WhatsApp</div>
                <button class="toggle-sw" :class="{ on: notifWhats }" @click="notifWhats = !notifWhats"></button>
              </div>
            </div>
            </div>
          </div>
        </div>

        <SectionEyebrow label="Status e histórico" />
        <div class="heading-row">
          <h2 class="gb-heading" style="font-size: clamp(1.3rem, 1rem + 1.6vw, 2rem);">Sua conta em detalhes</h2>
          <p class="heading-desc">Verificações, acessos conectados e o que aconteceu por aqui recentemente.</p>
        </div>

        <div class="account-grid">
          <div class="panel account-panel">
            <h3>Verificações e acesso</h3>
            <p class="panel-sub">O que confirma que a conta é sua</p>

            <div class="verify-row">
              <div class="verify-icon ok"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
              <div class="verify-text"><span class="verify-label">E-mail verificado</span><span class="verify-meta">{{ profile.email }}</span></div>
            </div>
            <div class="verify-row">
              <div class="verify-icon" :class="docSent ? 'ok' : 'pending'">
                <svg v-if="docSent" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.5h.01" stroke-width="2.2" stroke-linecap="round"/></svg>
              </div>
              <div class="verify-text">
                <span class="verify-label">Documento de identidade</span>
                <span class="verify-meta">{{ docSent ? 'Enviado, em análise' : 'Pendente de envio' }}</span>
              </div>
              <button v-if="!docSent" class="link-verify" @click="sendDocument">Enviar agora</button>
            </div>
          </div>

          <div class="panel account-panel">
            <h3>Atividade recente</h3>
            <p class="panel-sub">Últimas ações na sua conta</p>
            <div class="timeline">
              <div v-for="(ev, i) in activity" :key="i" class="timeline-item">
                <div class="timeline-dot" :style="{ background: ev.color }"></div>
                <div class="timeline-text"><span class="timeline-label">{{ ev.label }}</span><span class="timeline-when">{{ ev.when }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: white;
}

.top-banner {
  width: 100%;
  height: 190px;
  background: linear-gradient(120deg, var(--gb-purple-deep) 0%, var(--gb-dark) 100%);
  display: flex;
  align-items: flex-end;
  padding: 0 5%;
}

.top-banner span {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  padding-bottom: 16px;
}

.content {
  padding: 32px 24px 90px;
}

.loading-state,
.profile-error {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 10px;
  background: #fff4f4;
  color: #7f1d1d;
  font-weight: 600;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}

.who h2 {
  margin: 0 0 3px;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 19px;
  text-transform: uppercase;
  color: var(--gb-dark);
}

.who p {
  margin: 0;
  font-size: 13px;
  color: var(--gb-ink-soft);
}

.layout {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 24px;
  margin-top: 12px;
  align-items: start;
  padding-bottom: 40px;
}

@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 10px;
}

.side-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.15s ease;
}

.side-item:hover {
  background: rgba(46, 10, 46, 0.04);
}

.side-item.active {
  background: var(--gb-dark);
}

.side-thumb {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.side-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 6px;
  display: block;
  filter: brightness(0);
  transition: filter 0.15s ease;
}

.side-item.active .side-thumb img {
  filter: brightness(0) invert(1);
}

.side-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.side-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.side-item.active .side-label {
  color: #fff;
}

.side-meta {
  font-size: 11px;
  color: var(--gb-ink-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-item.active .side-meta {
  color: rgba(255, 255, 255, 0.6);
}

.panel-shell {
  transition: height 0.28s ease;
}

.panel-shell.resizing {
  overflow: hidden;
}

.panel {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 26px 28px;
}

.panel h3 {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 17px;
  color: var(--gb-dark);
  margin: 0 0 4px;
}

.panel .panel-sub {
  font-size: 12.5px;
  color: var(--gb-ink-soft);
  margin: 0 0 20px;
}

.panel-empty {
  font-size: 13px;
  color: var(--gb-ink-faint);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 560px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

.field label {
  display: block;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  margin-bottom: 6px;
}

.field input,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 9px;
  font-size: 13.5px;
  font-family: var(--gb-font-display);
  color: var(--gb-dark);
  background: #fff;
}

.field input:disabled {
  background: #f5f3ef;
  color: var(--gb-ink-faint);
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--gb-magenta);
  box-shadow: 0 0 0 3px rgba(176, 31, 176, 0.12);
}

.btn-save {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-save:hover {
  background: var(--gb-magenta);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: default;
}

.saved-flash {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  color: var(--gb-green);
  margin-left: 12px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 420px;
  padding: 10px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.toggle-row:first-of-type {
  border-top: none;
}

.toggle-label {
  font-size: 13px;
  color: var(--gb-dark);
}

.toggle-sub {
  font-size: 11px;
  color: var(--gb-ink-faint);
}

.toggle-sw {
  width: 38px;
  height: 22px;
  border-radius: 20px;
  background: var(--gb-purple-deep-16);
  position: relative;
  cursor: pointer;
  border: none;
  padding: 0;
  flex-shrink: 0;
}

.toggle-sw::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}

.toggle-sw.on {
  background: var(--gb-green);
}

.toggle-sw.on::after {
  transform: translateX(16px);
}

.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.session-row:first-of-type {
  border-top: none;
}

.session-device {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.session-meta {
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.session-tag {
  font-size: 10px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gb-green);
  background: rgba(61, 154, 75, 0.12);
  padding: 3px 9px;
  border-radius: var(--gb-radius-pill);
}

.link-danger {
  background: none;
  border: none;
  color: #b3261e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.fav-table {
  width: 100%;
  border-collapse: collapse;
}

.fav-table th {
  text-align: left;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  padding: 0 0 10px;
  border-bottom: 1px solid var(--gb-purple-deep-16);
}

.fav-table td {
  padding: 12px 0;
  border-bottom: 1px solid var(--gb-purple-deep-16);
  font-size: 13px;
  color: var(--gb-dark);
  vertical-align: middle;
}

.fav-table tr:last-child td {
  border-bottom: none;
}

.fav-country {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.fav-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  color: #fff;
  flex-shrink: 0;
}

.fav-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.fav-remove svg {
  width: 16px;
  height: 16px;
  stroke: var(--gb-ink-faint);
}

.review-item {
  padding: 14px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.review-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.review-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.review-country {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.review-date {
  font-size: 11px;
  color: var(--gb-ink-faint);
}

.review-stars {
  display: flex;
  gap: 2px;
  margin-bottom: 6px;
}

.review-stars svg {
  width: 14px;
  height: 14px;
  fill: var(--gb-orange);
  stroke: var(--gb-orange);
}

.review-stars svg.empty {
  fill: none;
  stroke: var(--gb-purple-deep-16);
}

.review-text {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--gb-ink-soft);
  margin: 0;
}

.cta-write {
  margin-top: 16px;
  background: transparent;
  border: 1px solid var(--gb-purple-deep-16);
  color: var(--gb-dark);
  padding: 9px 18px;
  border-radius: 9px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.cta-write:hover {
  background: rgba(46, 10, 46, 0.05);
}

.pref-group {
  margin-bottom: 18px;
}

.pref-group:last-child {
  margin-bottom: 0;
}

.pref-group-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  margin-bottom: 8px;
  display: block;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  border: 1px solid var(--gb-purple-deep-16);
  background: #fff;
  color: var(--gb-dark);
  font-size: 12.5px;
  font-family: var(--gb-font-display);
  padding: 7px 14px;
  border-radius: var(--gb-radius-pill);
  cursor: pointer;
}

.chip.picked {
  background: var(--gb-dark);
  color: #fff;
  border-color: var(--gb-dark);
}

.heading-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

@media (min-width: 768px) {
  .heading-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.heading-desc {
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--gb-ink-soft);
  max-width: 340px;
  margin: 0;
}

.account-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 800px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}

.account-panel {
  padding: 24px 26px;
}

.verify-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.verify-row:first-of-type {
  border-top: none;
}

.verify-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verify-icon svg {
  width: 14px;
  height: 14px;
  stroke: #fff;
}

.verify-icon.ok {
  background: var(--gb-green);
}

.verify-icon.pending {
  background: var(--gb-orange);
}

.verify-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.verify-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
}

.verify-meta {
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.link-verify {
  background: none;
  border: none;
  color: var(--gb-magenta);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  flex-shrink: 0;
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.timeline-item:first-of-type {
  border-top: none;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.timeline-text {
  display: flex;
  flex-direction: column;
}

.timeline-label {
  font-size: 13px;
  color: var(--gb-dark);
}

.timeline-when {
  font-size: 11px;
  color: var(--gb-ink-faint);
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel-shell {
    transition: none;
  }
}
</style>
