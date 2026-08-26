import { reactive, ref } from 'vue'
import axios from '@/services/axios'

// Estado compartilhado entre todas as telas que usam o composable — evita
// buscar /favoritos/ de novo toda vez que o usuário entra numa página de
// país/agência diferente.
const favoritos = reactive([])
const carregado = ref(false)

const getStoredToken = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token')

export function useFavoritos() {
  const estaLogado = ref(!!getStoredToken())

  async function carregarFavoritos() {
    if (!estaLogado.value || carregado.value) return
    try {
      const { data } = await axios.get('/favoritos/')
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
    if (!estaLogado.value) return
    const existente = encontrarFavorito(tipo, objetoId)
    if (existente) {
      const idx = favoritos.indexOf(existente)
      favoritos.splice(idx, 1)
      try {
        await axios.delete(`/favoritos/${existente.id}/`)
      } catch (e) {
        console.error('Erro ao remover favorito:', e)
        favoritos.push(existente)
      }
    } else {
      try {
        const { data } = await axios.post('/favoritos/', { tipo, objeto_id: objetoId })
        favoritos.push(data)
      } catch (e) {
        console.error('Erro ao favoritar:', e)
      }
    }
  }

  return { favoritos, estaLogado, carregarFavoritos, isFavorito, toggleFavorito }
}
