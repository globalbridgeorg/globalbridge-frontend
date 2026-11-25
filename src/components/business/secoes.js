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
  { tipo: 'galeria', icone: 'fi-rr-picture' },
  { tipo: 'video', icone: 'fi-rr-play-circle' },
  { tipo: 'equipe', icone: 'fi-rr-users-alt' },
  { tipo: 'certificacoes', icone: 'fi-rr-badge-check' },
  { tipo: 'faq', icone: 'fi-rr-interrogation' },
  { tipo: 'localizacao', icone: 'fi-rr-marker' },
  { tipo: 'redes_sociais', icone: 'fi-rr-share' },
  { tipo: 'contato_whatsapp', icone: 'fi-brands-whatsapp' },
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
