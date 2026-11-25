<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { getMinhasAvaliacoes, removerAvaliacao } from '@/services/api'
import { prefersReducedMotion } from '@/composables/usePageTransition'
import PhotoComponent from '@/components/profile/PhotoComponent.vue'
import NotificationBanner from '@/components/profile/NotificationBanner.vue'
import ProfileSideNav from '@/components/profile/ProfileSideNav.vue'
import PerfilPanel from '@/components/profile/PerfilPanel.vue'
import SegurancaPanel from '@/components/profile/SegurancaPanel.vue'
import FavoritosPanel from '@/components/profile/FavoritosPanel.vue'
import { useAuth } from '@/composables/useAuth'
import { useContaAtual } from '@/composables/useContaAtual'
import { useFavoritos } from '@/composables/useFavoritos'
import { useTrocaAnimada } from '@/composables/useTrocaAnimada'

const router = useRouter()
const { logout } = useAuth()
const { estado: conta, carregarConta } = useContaAtual()
const { favoritos, carregarFavoritos } = useFavoritos()

const pageRef = ref(null)
let ctx
let ctxAba

const loading = ref(true)
const error = ref('')
const profile = ref({ id: null, name: '', email: '', username: '', avatar_url: '' })

const section = ref('perfil')
const sidebarItems = [
  { key: 'perfil', label: 'Perfil', icon: 'fi-rr-user' },
  { key: 'seguranca', label: 'Segurança', icon: 'fi-rr-shield-check' },
  { key: 'favoritos', label: 'Favoritos', icon: 'fi-rr-heart' },
  { key: 'avaliacoes', label: 'Avaliações', icon: 'fi-rr-star' },
]

const reviews = ref([])
const reviewsLoading = ref(true)
const removendoAvaliacaoId = ref(null)

const sidebarMeta = computed(() => ({
  perfil: 'Dados pessoais',
  seguranca: 'Senha e exclusão',
  favoritos: favoritos.length + ' item' + (favoritos.length === 1 ? '' : 's') + ' salvo' + (favoritos.length === 1 ? '' : 's'),
  avaliacoes: reviews.value.length + ' publicada' + (reviews.value.length === 1 ? '' : 's'),
}))

const panelShell = ref(null)
const selectSection = useTrocaAnimada(panelShell, section)

const favoritesLoading = ref(true)
const showWelcome = ref(false)

function aoAtualizarAvatar(url) {
  profile.value.avatar_url = url
  conta.avatar_url = url
}

function aoSalvarNome(nome) {
  profile.value.name = nome
  conta.name = nome
}

async function excluirAvaliacao(id) {
  removendoAvaliacaoId.value = id
  try {
    await removerAvaliacao(id)
    reviews.value = reviews.value.filter((r) => r.id !== id)
  } catch (e) {
    console.error('Erro ao excluir avaliação:', e)
  } finally {
    removendoAvaliacaoId.value = null
  }
}

function animarPainel() {
  if (prefersReducedMotion() || !panelShell.value) return
  ctxAba?.revert()
  ctxAba = gsap.context(() => {
    const panel = panelShell.value.querySelector('.panel')
    if (panel) {
      gsap.from(panel, { opacity: 0, y: 16, duration: 0.42, ease: 'power3.out', clearProps: 'transform,opacity' })
    }
    const itens = panelShell.value.querySelectorAll('.field, .review-item, .fav-table tbody tr, .danger-zone')
    if (itens.length) {
      gsap.from(itens, {
        opacity: 0,
        y: 10,
        duration: 0.34,
        stagger: 0.04,
        delay: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      })
    }
  }, panelShell.value)
}

function animarEntrada() {
  if (prefersReducedMotion() || !pageRef.value) return
  ctx?.revert()
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'transform,opacity' } })
    tl.from('.top-banner span', { opacity: 0, x: -22, duration: 0.48 })
      .from('.profile-header', { opacity: 0, y: 16, duration: 0.45 }, '-=0.3')
      .from('.side-nav', { opacity: 0, x: -16, duration: 0.4 }, '-=0.26')
      .from('.side-nav .side-item', { opacity: 0, x: -8, duration: 0.3, stagger: 0.04 }, '-=0.25')
  }, pageRef.value)
  animarPainel()
}

watch(section, async () => {
  await nextTick()
  animarPainel()
})

onMounted(async () => {
  try {
    const atual = await carregarConta(true)
    if (!atual.logado) {
      router.replace({ name: 'login' })
      return
    }
    profile.value = {
      id: atual.id,
      name: atual.name || '',
      email: atual.email || '',
      username: atual.username || '',
      avatar_url: atual.avatar_url || '',
    }

    const [, avs] = await Promise.all([
      carregarFavoritos(true).catch((e) => console.error('Erro ao buscar favoritos:', e)),
      getMinhasAvaliacoes().catch((e) => { console.error('Erro ao buscar avaliações:', e); return [] }),
    ])
    reviews.value = avs
  } catch (err) {
    error.value = 'Não foi possível carregar seu perfil. Tente novamente mais tarde.'
    console.error('Profile fetch error:', err)
  } finally {
    loading.value = false
    favoritesLoading.value = false
    reviewsLoading.value = false
  }

  try {
    if (!sessionStorage.getItem('seenProfileWelcome')) {
      showWelcome.value = true
      sessionStorage.setItem('seenProfileWelcome', '1')
    }
  } catch {
    // sessionStorage indisponível
  }

  await nextTick()
  animarEntrada()
})

onBeforeUnmount(() => {
  ctx?.revert()
  ctxAba?.revert()
})
</script>

<template>
  <div ref="pageRef" class="profile-page">
    <div class="top-banner"><span>Minha conta</span></div>

    <div class="content gb-section">
      <div v-if="loading" class="loading-state">Carregando perfil...</div>

      <template v-else>
        <div v-if="error" class="profile-error">{{ error }}</div>

        <div class="profile-header">
          <PhotoComponent
            :user-id="profile.id || ''"
            :initial-preview="profile.avatar_url"
            @avatar-updated="aoAtualizarAvatar"
          />
          <div class="who">
            <h1>{{ profile.name || 'Usuário' }}</h1>
            <p>{{ profile.email }}</p>
            <div class="who-acoes" v-if="conta.is_admin || conta.tipo === 'agencia'">
              <router-link v-if="conta.tipo === 'agencia'" to="/business" class="pill-atalho">Painel da agência →</router-link>
              <router-link v-if="conta.is_admin" to="/admin" class="pill-atalho pill-atalho--admin">Painel administrativo →</router-link>
            </div>
          </div>
        </div>

        <NotificationBanner
          v-if="showWelcome"
          message="Bem-vindo ao seu painel de perfil."
          @close="showWelcome = false"
        />

        <div class="layout">
          <ProfileSideNav :items="sidebarItems" :meta="sidebarMeta" :section="section" @select="selectSection" @logout="logout" />

          <div>
            <div class="panel-shell" ref="panelShell">
              <KeepAlive>
                <PerfilPanel v-if="section === 'perfil'" :profile="profile" @nome-salvo="aoSalvarNome" />
                <SegurancaPanel v-else-if="section === 'seguranca'" />
                <FavoritosPanel v-else-if="section === 'favoritos'" :loading="favoritesLoading" />
                <div v-else-if="section === 'avaliacoes'" class="panel">
                  <h2>Avaliações</h2>
                  <p class="panel-sub">Experiências que você compartilhou sobre agências de intercâmbio</p>
                  <p v-if="reviewsLoading" class="panel-empty">Carregando suas avaliações...</p>
                  <template v-else>
                    <div v-for="rev in reviews" :key="rev.id" class="review-item">
                      <div class="review-top">
                        <div>
                          <router-link :to="{ name: 'agencia', params: { id: rev.agencia_id } }" class="review-country">
                            {{ rev.agencia_nome }}
                          </router-link>
                          <span v-if="rev.local" class="review-local"> · {{ rev.local }}</span>
                        </div>
                        <div class="review-top-right">
                          <span class="review-date">{{ new Date(rev.created_at).toLocaleDateString('pt-BR') }}</span>
                          <button
                            type="button"
                            class="review-remove"
                            :disabled="removendoAvaliacaoId === rev.id"
                            @click="excluirAvaliacao(rev.id)"
                          >
                            {{ removendoAvaliacaoId === rev.id ? 'Removendo...' : 'Remover' }}
                          </button>
                        </div>
                      </div>
                      <div class="review-stars" role="img" :aria-label="`${rev.nota} de 5 estrelas`">
                        <i v-for="n in 5" :key="n" class="fi" :class="n > rev.nota ? 'fi-rr-star empty' : 'fi-sr-star'" aria-hidden="true"></i>
                      </div>
                      <p class="review-text">{{ rev.comentario }}</p>
                    </div>
                    <p v-if="!reviews.length" class="panel-empty">Você ainda não avaliou nenhuma agência.</p>
                  </template>
                  <router-link to="/destinos" class="cta-write">Explorar agências para avaliar</router-link>
                </div>
              </KeepAlive>
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
.who p {
  margin: 0;
  font-size: 13px;
  color: var(--gb-ink-soft);
}

.who-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.pill-atalho {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: var(--gb-radius-pill);
  background: var(--gb-dark);
  color: #fff;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.15s ease;
}

.pill-atalho:hover {
  background: var(--gb-magenta);
}

.pill-atalho--admin {
  background: var(--gb-purple-deep);
}

.layout {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 24px;
  margin-top: 12px;
  align-items: start;
  padding-bottom: 40px;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.panel-shell {
  transition: height 0.28s ease;
}

.panel-shell.resizing {
  overflow: hidden;
}

/* Base dos painéis (cards, campos, botão salvar, toggles) — usada pelos painéis filhos em components/profile. */
:deep(.panel) {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 26px 28px;
}

:deep(.panel h2),
:deep(.panel h3) {
  font-family: var(--gb-font-display);
  font-weight: 900;
  text-transform: uppercase;
  font-size: 17px;
  color: var(--gb-dark);
  margin: 0 0 4px;
}

:deep(.panel .panel-sub) {
  font-size: 12.5px;
  color: var(--gb-ink-soft);
  margin: 0 0 20px;
}

:deep(.panel-empty) {
  font-size: 13px;
  color: var(--gb-ink-faint);
}

:deep(.field-row) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 640px) {
  :deep(.field-row) {
    grid-template-columns: 1fr;
  }
}

:deep(.field label) {
  display: block;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  margin-bottom: 6px;
}

:deep(.field input),
:deep(.field textarea) {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 9px;
  font-size: 13.5px;
  font-family: var(--gb-font-display);
  color: var(--gb-dark);
  background: #fff;
}

:deep(.field input:disabled) {
  background: #f5f3ef;
  color: var(--gb-ink-faint);
}

:deep(.field input:focus),
:deep(.field textarea:focus) {
  outline: 2px solid var(--gb-magenta); outline-offset: 1px;
  border-color: var(--gb-magenta);
}

:deep(.btn-save) {
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

:deep(.btn-save:hover) {
  background: var(--gb-magenta);
}

:deep(.btn-save:disabled) {
  opacity: 0.6;
  cursor: default;
}

:deep(.saved-flash) {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11.5px;
  color: var(--gb-green);
  margin-left: 12px;
}

:deep(.toggle-row) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 420px;
  padding: 10px 0;
  border-top: 1px solid var(--gb-purple-deep-16);
}

:deep(.toggle-row:first-of-type) {
  border-top: none;
}

:deep(.toggle-label) {
  font-size: 13px;
  color: var(--gb-dark);
}

:deep(.toggle-sub) {
  font-size: 11px;
  color: var(--gb-ink-faint);
}

:deep(.toggle-sw) {
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

:deep(.toggle-sw::after) {
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

:deep(.toggle-sw.on) {
  background: var(--gb-green);
}

:deep(.toggle-sw.on::after) {
  transform: translateX(16px);
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
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.review-country {
  font-size: 13px;
  font-weight: 700;
  color: var(--gb-dark);
  text-decoration: none;
}

.review-country:hover {
  color: var(--gb-magenta);
}

.review-local {
  font-size: 12px;
  color: var(--gb-ink-faint);
}

.review-top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-remove {
  background: none;
  border: none;
  color: #b3261e;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.review-remove:disabled {
  opacity: 0.5;
  cursor: default;
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

.review-stars .fi {
  font-size: 13px;
  color: var(--gb-orange);
}

.review-stars .fi.empty {
  color: var(--gb-purple-deep-16);
}

.review-text {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--gb-ink-soft);
  margin: 0;
}

.cta-write {
  display: inline-block;
  text-decoration: none;
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

@media (max-width: 768px) {
  .top-banner {
    height: 92px;
  }
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
