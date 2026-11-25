<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  nome: { type: String, required: true },
  descricao: { type: String, required: true },
  cidade: { type: String, default: '' },
  notaMedia: { type: Number, default: null },
  imagemCapa: { type: String, default: null },
  focoX: { type: Number, default: 50 },
  focoY: { type: Number, default: 50 },
  to: { type: [String, Object], default: null }
})

const erroImagem = ref(false)
watch(() => props.imagemCapa, () => { erroImagem.value = false })

const estrelas = computed(() => {
  const nota = Math.round(props.notaMedia ?? 0)
  return Array.from({ length: 5 }, (_, i) => i < nota)
})

const iniciais = computed(() => {
  if (!props.nome) return ''
  return props.nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
})
</script>

<template>
  <article class="agencia-card">
    <div class="agencia-photo" :class="{ 'has-photo': imagemCapa && !erroImagem }" aria-hidden="true">
      <img
        v-if="imagemCapa && !erroImagem"
        :src="imagemCapa"
        alt=""
        loading="lazy"
        class="agencia-photo-img"
        :style="{ objectPosition: `${focoX}% ${focoY}%` }"
        @error="erroImagem = true"
      />
      <span v-else>{{ iniciais }}</span>
    </div>
    <div class="agencia-header">
      <h3 class="agencia-nome">{{ nome }}</h3>
      <span
        v-if="notaMedia !== null"
        class="agencia-stars"
        role="img"
        :aria-label="`${Math.round(notaMedia)} de 5 estrelas`"
      >
        <span v-for="(preenchida, i) in estrelas" :key="i" class="star" :class="{ filled: preenchida }" aria-hidden="true">{{ preenchida ? '★' : '☆' }}</span>
      </span>
    </div>
    <p class="agencia-desc">{{ descricao }}</p>
    <div class="agencia-footer">
      <span v-if="cidade" class="agencia-location">
        <i class="fi fi-rr-marker" aria-hidden="true"></i>
        {{ cidade }}
      </span>
      <component :is="to ? 'router-link' : 'span'" :to="to" class="agencia-btn">Acessar</component>
    </div>
  </article>
</template>

<style scoped>
.agencia-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.agencia-card:hover {
  box-shadow: var(--gb-shadow-card);
  border-color: var(--gb-magenta);
  transform: translateY(-2px);
}

.agencia-photo {
  position: relative;
  height: 124px;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--gb-magenta), var(--gb-purple-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 22px;
  color: rgba(255, 255, 255, 0.85);
}

.agencia-photo.has-photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(23, 17, 26, 0.04) 40%, rgba(23, 17, 26, 0.28) 100%);
  pointer-events: none;
}

.agencia-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.agencia-card:hover .agencia-photo-img {
  transform: scale(1.04);
}

.agencia-header,
.agencia-footer {
  margin-left: 20px;
  margin-right: 20px;
}

.agencia-footer {
  margin-bottom: 20px;
}

.agencia-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.agencia-nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 15px;
  color: var(--gb-dark);
  text-transform: uppercase;
  margin: 0;
}

.agencia-stars {
  white-space: nowrap;
}

.star {
  font-size: 13px;
  color: var(--gb-purple-deep-16);
}

.star.filled {
  color: var(--gb-magenta);
}

.agencia-desc {
  flex: 1;
  margin: 0 20px;
  font-size: 12.5px;
  color: var(--gb-ink-soft);
  line-height: 1.6;
}

.agencia-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.agencia-location {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.agencia-btn {
  background: var(--gb-dark);
  color: #fff;
  border-radius: var(--gb-radius-pill);
  padding: 7px 15px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.agencia-btn:hover {
  background: var(--gb-magenta);
}
</style>
