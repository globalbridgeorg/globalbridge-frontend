import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import TestView from '@/views/TestView.vue';
import MapView from '@/views/MapView.vue';
import LoginView from '@/views/LoginView.vue';
import ProfileView from '@/views/ProfileView.vue';
import ComoFuncionaView from '@/views/ComoFuncionaView.vue';
import ContatoView from '@/views/ContatoView.vue';
import DestinosView from '@/views/DestinosView.vue';
import PaisView from '@/views/PaisView.vue';
import AgenciaView from '@/views/AgenciaView.vue';

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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
export default router;