import { createRouter, createWebHistory } from 'vue-router';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import BusinessView from '@/views/BusinessView.vue';
import SolicitarBusinessView from '@/views/SolicitarBusinessView.vue';
import AnaliseBusinessView from '@/views/AnaliseBusinessView.vue';
import EsqueciSenhaView from '@/views/EsqueciSenhaView.vue';
import RedefinirSenhaView from '@/views/RedefinirSenhaView.vue';
import PainelBusinessView from '@/views/PainelBusinessView.vue';

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
    path: '/esqueci-senha',
    name: 'esqueci-senha',
    component: EsqueciSenhaView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/redefinir-senha',
    name: 'redefinir-senha',
    component: RedefinirSenhaView,
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
  {
    path: '/business',
    name: 'business',
    component: PainelBusinessView,
    // headerFloat: false — essas duas telas já têm sua própria barra escura
    // no topo (logo, "Sair da conta" etc.); o header flutuante do site por
    // cima dela ficava tampando/sobrepondo essa barra. Sem flutuar, ele
    // some do fixed e a barra escura da página passa a ocupar o topo de
    // verdade (ver HeaderComponent.vue).
    meta: { headerWidth: 'full', headerFloat: false }
  },
  {
    path: '/business/editar',
    name: 'business-editor',
    component: BusinessView,
    meta: { headerWidth: 'full', headerFloat: false }
  },
  {
    path: '/business/solicitar',
    name: 'business-solicitar',
    component: SolicitarBusinessView,
    meta: { headerWidth: 'full' }
  },
  {
    path: '/business/analise',
    name: 'business-analise',
    component: AnaliseBusinessView,
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

  // Cada página registra suas próprias animações de entrada (gsap.from
  // com scrollTrigger) no onMounted. Numa SPA, se o ScrollTrigger calcular
  // a posição de um trigger enquanto a página anterior ainda existe no DOM
  // (ou enquanto a transição de troca de página ainda está distorcendo o
  // layout com scale/blur), a posição fica errada — e como o cálculo não
  // se refaz sozinho, o elemento pode ficar preso invisível/deslocado até
  // um F5. Esse refresh, um pouco depois da troca de rota (dá tempo da
  // nova página montar e da transição de entrada assentar), recalcula
  // tudo do zero.
  setTimeout(() => ScrollTrigger.refresh(), 350)
})

export default router;