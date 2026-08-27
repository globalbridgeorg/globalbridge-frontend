import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/css/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Um pedaço de JS carregado sob demanda (import() dinâmico, ex.: o mapa 3D)
// pode falhar se o navegador ainda tem a página antiga aberta na hora de um
// deploy novo — o arquivo com aquele hash específico já não existe mais no
// servidor. O Vite emite esse evento nesse caso; recarregar a página uma vez
// resolve sozinho, sem precisar que a pessoa descubra que precisa atualizar.
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

app.mount('#app')
