export function iniciaisDe(nome) {
  if (!nome) return ''
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}
