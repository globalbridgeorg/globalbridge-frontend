<script setup>
// Campos das seções opcionais de texto (vídeo, equipe, FAQ...). Edita
// conteudoBlocos direto via v-model — o watch profundo do BusinessView é
// que marca a página como alterada.
defineProps({
  tipo: { type: String, required: true },
  endereco: { type: String, default: '' }
})
const conteudo = defineModel({ type: Object, required: true })
const emit = defineEmits(['alterado'])

function adicionarItem(tipoBloco, campo, vazio) {
  conteudo.value[tipoBloco][campo].push({ ...vazio })
  emit('alterado')
}

function removerItem(tipoBloco, campo, index) {
  conteudo.value[tipoBloco][campo].splice(index, 1)
  emit('alterado')
}
</script>

<template>
  <!-- Vídeo institucional -->
  <div v-if="tipo === 'video'" class="bloco-conteudo">
    <label class="campo-label" for="campo-video-url">Link do vídeo (YouTube, Vimeo...)</label>
    <input id="campo-video-url" type="text" v-model="conteudo.video.url" placeholder="https://youtube.com/watch?v=..." class="campo-input">
  </div>

  <!-- Equipe -->
  <div v-else-if="tipo === 'equipe'" class="bloco-conteudo">
    <div v-for="(membro, i) in conteudo.equipe.membros" :key="i" class="item-lista">
      <input type="text" v-model="membro.nome" placeholder="Nome" class="campo-input" :aria-label="`Nome da pessoa ${i + 1} da equipe`">
      <input type="text" v-model="membro.cargo" placeholder="Cargo" class="campo-input" :aria-label="`Cargo da pessoa ${i + 1} da equipe`">
      <button class="btn-remover-item" @click="removerItem('equipe', 'membros', i)" :aria-label="`Remover ${membro.nome || 'esta pessoa'} da equipe`">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
    <button class="btn-add-item" @click="adicionarItem('equipe', 'membros', { nome: '', cargo: '' })">+ Adicionar pessoa</button>
  </div>

  <!-- Certificações e parcerias -->
  <div v-else-if="tipo === 'certificacoes'" class="bloco-conteudo">
    <div v-for="(item, i) in conteudo.certificacoes.itens" :key="i" class="item-lista">
      <input type="text" v-model="item.nome" placeholder="Nome (ex: British Council)" class="campo-input" :aria-label="`Nome da certificação ${i + 1}`">
      <input type="text" v-model="item.descricao" placeholder="Descrição curta" class="campo-input" :aria-label="`Descrição da certificação ${i + 1}`">
      <button class="btn-remover-item" @click="removerItem('certificacoes', 'itens', i)" :aria-label="`Remover ${item.nome || 'esta certificação'}`">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
      </button>
    </div>
    <button class="btn-add-item" @click="adicionarItem('certificacoes', 'itens', { nome: '', descricao: '' })">+ Adicionar certificação</button>
  </div>

  <!-- FAQ -->
  <div v-else-if="tipo === 'faq'" class="bloco-conteudo">
    <div v-for="(item, i) in conteudo.faq.perguntas" :key="i" class="item-lista item-lista-coluna">
      <input type="text" v-model="item.pergunta" placeholder="Pergunta" class="campo-input" :aria-label="`Pergunta ${i + 1}`">
      <textarea v-model="item.resposta" placeholder="Resposta" class="campo-textarea" rows="2" :aria-label="`Resposta da pergunta ${i + 1}`"></textarea>
      <button class="btn-remover-item" @click="removerItem('faq', 'perguntas', i)">Remover</button>
    </div>
    <button class="btn-add-item" @click="adicionarItem('faq', 'perguntas', { pergunta: '', resposta: '' })">+ Adicionar pergunta</button>
  </div>

  <!-- Localização e mapa -->
  <div v-else-if="tipo === 'localizacao'" class="bloco-conteudo">
    <label class="campo-label" for="campo-link-mapa">Link do Google Maps (opcional)</label>
    <input id="campo-link-mapa" type="text" v-model="conteudo.localizacao.link_mapa" placeholder="https://maps.google.com/..." class="campo-input">
    <p class="bloco-dica">O endereço ({{ endereco }}) já aparece automaticamente — esse link vira um botão "Ver no mapa".</p>
  </div>

  <!-- Redes sociais -->
  <div v-else-if="tipo === 'redes_sociais'" class="bloco-conteudo">
    <input type="text" v-model="conteudo.redes_sociais.instagram" placeholder="Instagram (link)" class="campo-input" aria-label="Link do Instagram">
    <input type="text" v-model="conteudo.redes_sociais.facebook" placeholder="Facebook (link)" class="campo-input" aria-label="Link do Facebook">
    <input type="text" v-model="conteudo.redes_sociais.tiktok" placeholder="TikTok (link)" class="campo-input" aria-label="Link do TikTok">
    <input type="text" v-model="conteudo.redes_sociais.linkedin" placeholder="LinkedIn (link)" class="campo-input" aria-label="Link do LinkedIn">
    <input type="text" v-model="conteudo.redes_sociais.youtube" placeholder="YouTube (link)" class="campo-input" aria-label="Link do YouTube">
  </div>

  <!-- Fale conosco (WhatsApp) -->
  <div v-else-if="tipo === 'contato_whatsapp'" class="bloco-conteudo">
    <input type="text" v-model="conteudo.contato_whatsapp.numero" placeholder="Número (com DDI, ex: 5511999999999)" class="campo-input" aria-label="Número do WhatsApp com DDI">
    <input type="text" v-model="conteudo.contato_whatsapp.mensagem" placeholder="Mensagem inicial (opcional)" class="campo-input" aria-label="Mensagem inicial do WhatsApp">
  </div>
</template>

<style scoped src="./editorCampos.css"></style>
<style scoped>
.btn-remover-item:focus-visible,
.btn-add-item:focus-visible {
  outline: 2px solid var(--gb-magenta);
  outline-offset: 2px;
}

.campo-input, .campo-textarea {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: 'Montserrat', sans-serif;
  color: var(--gb-dark);
  background: #fff;
}
.campo-input:focus, .campo-textarea:focus { outline: 2px solid var(--gb-magenta); outline-offset: 1px; border-color: var(--gb-magenta); }
.campo-textarea { resize: vertical; }

.item-lista { display: flex; gap: 6px; align-items: center; }
.item-lista-coluna { flex-direction: column; align-items: stretch; }

.btn-remover-item {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid var(--gb-purple-deep-16);
  background: #fff;
  color: var(--gb-ink-faint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.item-lista-coluna .btn-remover-item { width: auto; align-self: flex-end; padding: 4px 10px; font-size: 0.72rem; }
.btn-remover-item:hover { border-color: #dc2626; color: #dc2626; }

.btn-add-item {
  align-self: flex-start;
  background: none;
  border: 1.5px dashed var(--gb-purple-deep-16);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--gb-ink-soft);
  cursor: pointer;
}
.btn-add-item:hover { border-color: var(--gb-magenta); color: var(--gb-magenta-strong); }
</style>
