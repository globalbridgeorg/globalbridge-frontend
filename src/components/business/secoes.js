// Mesmo padrão do AgenciaView — hero sempre primeiro (só a variante dele
// muda), as outras três seções centrais podem trocar de ordem entre si.
// As demais (galeria, vídeo, equipe...) são opcionais — só entram no
// layout quando a agência clica pra adicionar (ver SECOES_ADICIONAIS).
export const LAYOUT_PADRAO = [
  { tipo: 'hero', variante: 'foto' },
  { tipo: 'como_funciona', variante: 'texto' },
  { tipo: 'catalogo', variante: 'grade' },
  { tipo: 'avaliacoes', variante: 'grade' }
]

export const VARIANTES = {
  hero: [
    { valor: 'foto', label: 'Foto + nota' },
    { valor: 'banner', label: 'Banner cheio' }
  ],
  como_funciona: [
    { valor: 'texto', label: 'Só texto' },
    { valor: 'destaque', label: 'Citação em destaque' }
  ],
  catalogo: [
    { valor: 'grade', label: 'Grade' },
    { valor: 'lista', label: 'Lista' }
  ],
  avaliacoes: [
    { valor: 'grade', label: 'Grade 3 colunas' },
    { valor: 'compacta', label: 'Compacta' }
  ]
}

export const LABELS = {
  hero: 'Apresentação', como_funciona: 'Como funciona', catalogo: 'Catálogo', avaliacoes: 'Avaliações',
  galeria: 'Galeria de fotos', video: 'Vídeo institucional', equipe: 'Equipe',
  certificacoes: 'Certificações e parcerias', faq: 'Perguntas frequentes',
  localizacao: 'Localização e mapa', redes_sociais: 'Redes sociais', contato_whatsapp: 'Fale conosco (WhatsApp)',
}

export const TAGS = {
  hero: 'Hero', como_funciona: 'Texto', catalogo: 'Programas', avaliacoes: 'Depoimentos',
  galeria: 'Espaço', video: 'Vídeo', equipe: 'Time', certificacoes: 'Selos',
  faq: 'Dúvidas', localizacao: 'Mapa', redes_sociais: 'Social', contato_whatsapp: 'WhatsApp',
}

// As 8 seções opcionais — aparecem colapsadas até a agência clicar pra
// adicionar. Cada uma guarda seu conteúdo em conteudoBlocos[tipo] (ver
// normalizarConteudo), exceto "galeria" — essa usa upload de arquivo de
// verdade (agencia.galeria), não texto.
export const SECOES_ADICIONAIS = [
  { tipo: 'galeria', icone: 'M4 5h16v14H4z M4 15l4-4 3 3 5-6 4 5' },
  { tipo: 'video', icone: 'M8 5v14l11-7z' },
  { tipo: 'equipe', icone: 'M9 7a3 3 0 100 6 3 3 0 000-6z M2 21a7 7 0 0114 0 M17 7a3 3 0 100 6 3 3 0 000-6z M16 21a7 7 0 00-4.3-13.6' },
  { tipo: 'certificacoes', icone: 'M12 3l2.9 6.3 6.9.9-5 4.9 1.2 6.9L12 17.8l-6 3.2 1.2-6.9-5-4.9 6.9-.9z' },
  { tipo: 'faq', icone: 'M12 21a9 9 0 100-18 9 9 0 000 18z M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5 M12 17h.01' },
  { tipo: 'localizacao', icone: 'M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z' },
  { tipo: 'redes_sociais', icone: 'M3 3h18v18H3z M12 12a4 4 0 100 8 4 4 0 000-8z M17.2 6.8h.01' },
  { tipo: 'contato_whatsapp', icone: 'M3 5a2 2 0 012-2h2l2 5-2.5 1.5a11 11 0 005 5L13 12l5 2v2a2 2 0 01-2 2A15 15 0 013 5z' },
]

export function normalizarConteudo(raw) {
  return {
    video: { url: '', ...raw.video },
    equipe: { membros: [], ...(raw.equipe || {}) },
    certificacoes: { itens: [], ...(raw.certificacoes || {}) },
    faq: { perguntas: [], ...(raw.faq || {}) },
    localizacao: { link_mapa: '', ...(raw.localizacao || {}) },
    redes_sociais: { instagram: '', facebook: '', tiktok: '', linkedin: '', youtube: '', ...(raw.redes_sociais || {}) },
    contato_whatsapp: { numero: '', mensagem: '', ...(raw.contato_whatsapp || {}) },
  }
}

// Cada seção "opcional" tem uma forma diferente de guardar conteúdo —
// isso só decide se remover deveria pedir confirmação (não apaga o
// conteúdo de verdade: se a agência adicionar a seção de novo antes de
// publicar, o que já tinha preenchido continua lá).
export function secaoTemConteudo(tipo, conteudo, galeria) {
  switch (tipo) {
    case 'galeria': return galeria.length > 0
    case 'video': return Boolean(conteudo.video.url)
    case 'equipe': return conteudo.equipe.membros.length > 0
    case 'certificacoes': return conteudo.certificacoes.itens.length > 0
    case 'faq': return conteudo.faq.perguntas.length > 0
    case 'localizacao': return Boolean(conteudo.localizacao.link_mapa)
    case 'redes_sociais': return Object.values(conteudo.redes_sociais).some(Boolean)
    case 'contato_whatsapp': return Boolean(conteudo.contato_whatsapp.numero)
    default: return false
  }
}
