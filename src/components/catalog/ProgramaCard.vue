<script setup>
defineProps({
  tag: { type: String, required: true },
  duracao: { type: String, required: true },
  nome: { type: String, required: true },
  descricao: { type: String, required: true },
  footerMeta: { type: String, default: '' },
  ctaText: { type: String, default: 'Ver detalhes' },
  to: { type: [String, Object], default: null }
})
</script>

<template>
  <article class="programa-card">
    <div class="card-top">
      <span class="tag">{{ tag }}</span>
      <span class="duration">{{ duracao }}</span>
    </div>
    <div>
      <h3 class="nome">{{ nome }}</h3>
      <p class="descricao">{{ descricao }}</p>
    </div>
    <div class="card-footer">
      <span class="footer-meta">{{ footerMeta }}</span>
      <router-link v-if="to" :to="to" class="cta">{{ ctaText }}</router-link>
    </div>
  </article>
</template>

<style scoped>
.programa-card {
  background: #fff;
  border: 1px solid var(--gb-purple-deep-16);
  border-radius: var(--gb-radius-card);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.programa-card:hover {
  box-shadow: var(--gb-shadow-card);
  border-color: var(--gb-magenta);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.tag {
  display: inline-block;
  background: var(--gb-pink);
  color: var(--gb-magenta-strong);
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: var(--gb-radius-pill);
}

.duration {
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  color: var(--gb-ink-faint);
  white-space: nowrap;
}

.nome {
  font-family: var(--gb-font-display);
  font-weight: 900;
  font-size: 17px;
  color: var(--gb-dark);
  margin: 0 0 6px;
  text-transform: uppercase;
}

.descricao {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--gb-ink-soft);
  margin: 0;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--gb-purple-deep-16);
}

.footer-meta {
  font-size: 11.5px;
  color: var(--gb-ink-faint);
}

.cta {
  background: var(--gb-dark);
  color: #fff;
  border: none;
  border-radius: var(--gb-radius-pill);
  padding: 7px 15px;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.cta:hover {
  background: var(--gb-magenta);
}
</style>
