import { createRouter, createWebHistory } from 'vue-router';
import { resetScroll } from '@/utils/lenis';
import HomeView from '../views/HomeView.vue';
import TestView from '@/views/TestView.vue';
import MapView from '@/views/MapView.vue';
import LoginView from '@/views/LoginView.vue';
import ProfileView from '@/views/ProfileView.vue';
import ComoFuncionaView from '@/views/ComoFuncionaView.vue';
import ContatoView from '@/views/ContatoView.vue';
import DestinosView from '@/views/DestinosView.vue';
import RegiaoView from '@/views/RegiaoView.vue';
import PaisView from '@/views/PaisView.vue';
import AgenciaView from '@/views/AgenciaView.vue';
import PerfilPublicoView from '@/views/PerfilPublicoView.vue';

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
  {
    path: '/destinos',
    name: 'destinos',
    component: DestinosView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/regiao/:regiao',
    name: 'regiao',
    component: RegiaoView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/destinos/:id',
    name: 'pais',
    component: PaisView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/agencias/:id',
    name: 'agencia',
    component: AgenciaView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/usuarios/:username',
    name: 'perfil-publico',
    component: PerfilPublicoView,
    meta: { headerWidth: 'full' }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Trocar de página sempre volta pro topo; um link com âncora (#id) ou uma
// troca de filtro na mesma rota (ex.: query de região em /destinos) mantém
// a posição, já que aí o scroll é tratado por quem disparou a navegação.
router.afterEach((to, from) => {
  if (to.path !== from.path && !to.hash) {
    resetScroll()
  }
})

export default router;