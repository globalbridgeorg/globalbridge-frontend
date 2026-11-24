// Bloqueia esquemas perigosos (javascript:, data:, vbscript:) em URLs vindas
// de campos editáveis por agências (site, vídeo, mapa, redes sociais).
export function sanitizarUrl(url) {
  if (!url || typeof url !== 'string') return null
  const limpa = url.trim()
  if (!limpa) return null
  // Se vier com esquema explícito, só aceita http(s):
  if (/^[a-z][a-z0-9+.-]*:/i.test(limpa) && !/^https?:\/\//i.test(limpa)) {
    return null
  }
  try {
    const parsed = new URL(/^https?:\/\//i.test(limpa) ? limpa : `https://${limpa}`)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href
    }
    return null
  } catch {
    return null
  }
}
