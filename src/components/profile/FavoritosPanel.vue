<script setup>
import { useFavoritos } from '@/composables/useFavoritos'

defineProps({ loading: { type: Boolean, default: false } })

const { favoritos, toggleFavorito } = useFavoritos()
</script>

<template>
  <div class="panel">
    <h2>Favoritos</h2>
    <p class="panel-sub">Países e agências que você salvou para comparar depois</p>
    <table v-if="favoritos.length" class="fav-table">
      <thead>
        <tr><th>Destino</th><th>Detalhe</th><th>Salvo em</th><th><span class="sr-only">Remover</span></th></tr>
      </thead>
      <tbody>
        <tr v-for="fav in favoritos" :key="fav.id">
          <td>
            <div class="fav-country">
              <span class="fav-dot" :style="{ background: fav.tipo === 'pais' ? 'var(--gb-blue)' : 'var(--gb-magenta-strong)' }">{{ fav.tipo === 'pais' ? 'P' : 'A' }}</span>
              <router-link
                :to="fav.tipo === 'pais' ? { name: 'pais', params: { id: fav.objeto_id } } : { name: 'agencia', params: { id: fav.objeto_id } }"
              >{{ fav.nome }}</router-link>
            </div>
          </td>
          <td>{{ fav.subtitulo || '—' }}</td>
          <td>{{ new Date(fav.criado_em).toLocaleDateString('pt-BR') }}</td>
          <td><button class="fav-remove" :aria-label="`Remover ${fav.nome} dos favoritos`" @click="toggleFavorito(fav.tipo, fav.objeto_id)"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-width="1.8" stroke-linecap="round"/></svg></button></td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="!loading" class="panel-empty">Você ainda não salvou nenhum país ou agência.</p>
  </div>
</template>

<style scoped>
.fav-table {
  width: 100%;
  border-collapse: collapse;
}

.fav-table th {
  text-align: left;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gb-ink-faint);
  padding: 0 0 10px;
  border-bottom: 1px solid var(--gb-purple-deep-16);
}

.fav-table td {
  padding: 12px 0;
  border-bottom: 1px solid var(--gb-purple-deep-16);
  font-size: 13px;
  color: var(--gb-dark);
  vertical-align: middle;
}

.fav-table tr:last-child td {
  border-bottom: none;
}

.fav-country {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.fav-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--gb-font-eyebrow);
  font-weight: 700;
  font-size: 10.5px;
  color: #fff;
  flex-shrink: 0;
}

.fav-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.fav-remove svg {
  width: 16px;
  height: 16px;
  stroke: var(--gb-ink-faint);
}
</style>
