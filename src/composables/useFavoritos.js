import { computed, reactive, ref } from 'vue'
import { getFavoritos, adicionarFavorito, removerFavorito } from '@/services/api'
import { useContaAtual } from '@/composables/useContaAtual'

const favoritos = reactive([])
const carregado = ref(false)

export function resetarFavoritos() {
  favoritos.splice(0, favoritos.length)
  carregado.value = false
}

export function useFavoritos() {
  const { estado: conta, carregarConta } = useContaAtual()
  const estaLogado = computed(() => conta.logado)

  async function carregarFavoritos(forcar = false) {
    await carregarConta()
    if (!conta.logado || (carregado.value && !forcar)) return
    try {
      const data = await getFavoritos()
      favoritos.splice(0, favoritos.length, ...data)
      carregado.value = true
    } catch (e) {
      console.error('Erro ao buscar favoritos:', e)
    }
  }

  function encontrarFavorito(tipo, objetoId) {
    return favoritos.find((f) => f.tipo === tipo && f.objeto_id === objetoId)
  }

  function isFavorito(tipo, objetoId) {
    return !!encontrarFavorito(tipo, objetoId)
  }

  async function toggleFavorito(tipo, objetoId) {
    if (!conta.logado) return
    const existente = encontrarFavorito(tipo, objetoId)
    if (existente) {
      const idx = favoritos.indexOf(existente)
      favoritos.splice(idx, 1)
      try {
        await removerFavorito(existente.id)
      } catch (e) {
        console.error('Erro ao remover favorito:', e)
        favoritos.push(existente)
      }
    } else {
      try {
        const criado = await adicionarFavorito(tipo, objetoId)
        favoritos.push(criado)
      } catch (e) {
        console.error('Erro ao favoritar:', e)
      }
    }
  }

  return { favoritos, estaLogado, carregarFavoritos, isFavorito, toggleFavorito }
}
