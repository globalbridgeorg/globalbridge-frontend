<script setup>
import { ref } from 'vue'
import axios from '@/services/axios'
import SectionEyebrow from '@/components/common/SectionEyebrow.vue'
import { useFavoritos } from '@/composables/useFavoritos'
import { iniciaisDe } from '@/utils/iniciais'

const props = defineProps({
  agencia: { type: Object, required: true },
  variante: { type: String, default: 'grade' }
})
const emit = defineEmits(['avaliada'])

const { estaLogado } = useFavoritos()

const novaNota = ref(0)
const novoComentario = ref('')
const enviandoAvaliacao = ref(false)
const erroAvaliacao = ref('')

async function enviarAvaliacao() {
  erroAvaliacao.value = ''
  if (!novaNota.value) {
    erroAvaliacao.value = 'Escolha uma nota de 1 a 5 estrelas.'
    return
  }
  if (!novoComentario.value.trim()) {
    erroAvaliacao.value = 'Escreva um comentário antes de enviar.'
    return
  }
  enviandoAvaliacao.value = true
  try {
    await axios.post('/avaliacao/', {
      nota: novaNota.value,
      comentario: novoComentario.value.trim(),
      id_agencia: props.agencia.id
    })
    novaNota.value = 0
    novoComentario.value = ''
    emit('avaliada')
  } catch (e) {
    console.error('Erro ao enviar avaliação:', e)
    erroAvaliacao.value = 'Não conseguimos enviar sua avaliação agora. Tente novamente.'
  } finally {
    enviandoAvaliacao.value = false
  }
}
</script>

<template>
  <section class="avaliacoes reveal-section">
    <SectionEyebrow :label="`${agencia.total_avaliacoes} avaliaç${agencia.total_avaliacoes === 1 ? 'ão' : 'ões'}`" />
    <h2 class="gb-heading">O que dizem<br />sobre a agência</h2>

    <form v-if="estaLogado" class="form-avaliacao" @submit.prevent="enviarAvaliacao">
      <span class="form-label">Deixe sua avaliação</span>
      <div class="form-stars" role="group" aria-label="Nota de 1 a 5 estrelas">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="form-star"
          :class="{ filled: n <= novaNota }"
          :aria-pressed="n <= novaNota"
          :aria-label="`${n} de 5 estrelas`"
          @click="novaNota = n"
        >{{ n <= novaNota ? '★' : '☆' }}</button>
      </div>
      <textarea
        v-model="novoComentario"
        class="form-textarea"
        rows="3"
        placeholder="Conte como foi sua experiência com essa agência..."
      ></textarea>
      <p v-if="erroAvaliacao" class="form-erro">{{ erroAvaliacao }}</p>
      <button type="submit" class="btn-primary-lg form-submit" :disabled="enviandoAvaliacao">
        {{ enviandoAvaliacao ? 'Enviando...' : 'Enviar avaliação' }}
      </button>
    </form>
    <p v-else class="form-login-hint">
      <router-link to="/login">Entre na sua conta</router-link> pra deixar uma avaliação sobre essa agência.
    </p>

    <div v-if="agencia.avaliacoes.length" class="review-cards reveal-grid" :class="{ 'review-cards-compacta': variante === 'compacta' }">
      <article v-for="avaliacao in agencia.avaliacoes" :key="avaliacao.id" class="review-card">
        <span class="review-stars" role="img" :aria-label="`${avaliacao.nota} de 5 estrelas`">
          <template v-for="n in 5" :key="n"><span aria-hidden="true">{{ n <= avaliacao.nota ? '★' : '☆' }}</span></template>
        </span>
        <p class="review-text">{{ avaliacao.comentario }}</p>
        <router-link :to="{ name: 'perfil-publico', params: { username: avaliacao.autor_username } }" class="review-autor">
          <span class="review-avatar">
            <img v-if="avaliacao.autor_foto" :src="avaliacao.autor_foto" :alt="avaliacao.autor" />
            <span v-else aria-hidden="true">{{ iniciaisDe(avaliacao.autor) }}</span>
          </span>
          <strong>{{ avaliacao.autor }}</strong>
        </router-link>
      </article>
    </div>
    <p v-else class="estado-vazio">Essa agência ainda não recebeu avaliações.</p>
  </section>
</template>

<style scoped>
.avaliacoes {
  padding: 48px 0 0;
}

.gb-heading {
  margin: 8px 0 24px;
}

.btn-primary-lg {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 14px 26px;
  border-radius: 12px;
  text-align: center;
  white-space: nowrap;
  text-decoration: none;
  background: var(--gb-dark);
  color: #fff;
}

.btn-primary-lg:hover {
  background: var(--gb-magenta);
}

.form-avaliacao {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 560px;
  margin-bottom: 32px;
}

.form-label {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gb-dark);
}

.form-stars {
  display: flex;
  gap: 6px;
}

.form-star {
  background: none;
  border: none;
  font-size: 26px;
  line-height: 1;
  color: var(--gb-purple-deep-16);
  cursor: pointer;
  padding: 0;
}

.form-star.filled {
  color: var(--gb-magenta);
}

.form-textarea {
  width: 100%;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  font-family: var(--gb-font-display);
  color: var(--gb-dark);
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--gb-magenta);
}

.form-erro {
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.form-submit {
  align-self: flex-start;
}

.form-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-login-hint {
  background: rgba(46, 10, 46, 0.04);
  border-radius: var(--gb-radius-card);
  padding: 18px 22px;
  font-size: 0.92rem;
  color: var(--gb-ink-soft);
  max-width: 560px;
  margin-bottom: 32px;
}

.form-login-hint a {
  color: var(--gb-magenta);
  font-weight: 600;
}

.review-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.review-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--gb-shadow-card);
}

.review-stars {
  color: var(--gb-magenta);
  font-size: 1rem;
  letter-spacing: 2px;
}

.review-text {
  font-size: 0.92rem;
  line-height: 1.6;
  color: #3A3640;
  margin: 0;
}

.review-autor {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--gb-purple-deep-16);
  text-decoration: none;
}

.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.review-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-autor strong {
  font-size: 0.85rem;
  color: var(--gb-dark);
  transition: color 0.15s ease;
}

.review-autor:hover strong {
  color: var(--gb-magenta);
}

.estado-vazio {
  color: var(--gb-ink-soft);
  font-size: 0.95rem;
}

/* Variante "compacta" das avaliações */
.review-cards-compacta {
  grid-template-columns: 1fr !important;
  max-width: 640px;
}

@media (max-width: 1100px) {
  .review-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 720px) {
  .review-cards { grid-template-columns: 1fr; }
}
</style>
