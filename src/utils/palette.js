// Espelha os tokens de cor de src/assets/css/global.css para uso em dados
// dinâmicos (arrays de itens que definem sua própria cor), onde uma
// var(--gb-*) do CSS não é acessível diretamente. Mudou uma cor na paleta?
// Atualiza os dois lugares.
export const palette = {
  cream: '#FBF6E7',
  dark: '#17111A',
  purpleDeep: '#2E0A2E',
  pink: '#FBC2F4',
  magenta: '#B01FB0',
  magentaStrong: '#7A0F74',
  mauve: '#5A4757',
  mauveMuted: '#6B4E64',
  blue: '#3972DE',
  accentLight: '#FF7DEE',
  inkSoft: '#55505A',
  inkFaint: '#757067',
  // Tons de apoio (motores, ranking, custo) já ajustados para 4.5:1 em
  // texto pequeno sobre --gb-cream/--gb-pink — ver auditoria de
  // acessibilidade da branch reworking.
  red: '#C93F29',
  green: '#33803E',
  // magenta escurecido especificamente para texto pequeno sobre --gb-pink
  // (3.85:1 com o magenta padrão, insuficiente para WCAG AA em texto pequeno)
  magentaOnPink: '#9E1C9E',
}
