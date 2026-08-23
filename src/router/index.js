import { createRouter, createWebHistory } from 'vue-router';
import { sweeping, prefersReducedMotion } from '@/composables/usePageTransition';
import HomeView from '../views/HomeView.vue';
import TestView from '@/views/TestView.vue';
import MapView from '@/views/MapView.vue';
import LoginView from '@/views/LoginView.vue';
import ProfileView from '@/views/ProfileView.vue';
import ComoFuncionaView from '@/views/ComoFuncionaView.vue';
import ContatoView from '@/views/ContatoView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/mapview',
    name: 'mapview',
    component: MapView,
    meta: { headerWidth: 'compact', keepAlive: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/como-funciona',
    name: 'como-funciona',
    component: ComoFuncionaView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/contato',
    name: 'contato',
    component: ContatoView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/test',
    name: 'test',
    component: TestView,
    meta: { headerWidth: 'full' }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Corte diagonal entre páginas: uma faixa escura cobre a tela por um
// instante enquanto a rota troca por baixo, e some do outro lado.
let sweepOffTimeout = null

function skipWipe(to, from) {
  const isInitialLoad = from.name === undefined
  const isSamePageHash = to.path === from.path
  return isInitialLoad || isSamePageHash || prefersReducedMotion()
}

router.beforeEach((to, from) => {
  if (skipWipe(to, from)) return true

  if (sweepOffTimeout) {
    clearTimeout(sweepOffTimeout)
    sweepOffTimeout = null
  }
  sweeping.value = true

  return new Promise((resolve) => {
    setTimeout(resolve, 240)
  })
})

router.afterEach((to, from) => {
  if (skipWipe(to, from)) return

  sweepOffTimeout = setTimeout(() => {
    sweeping.value = false
    sweepOffTimeout = null
  }, 230)
})

export default router;