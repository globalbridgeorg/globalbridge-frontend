import { nextTick } from 'vue'

// Troca a seção mostrada animando a altura do container (shellRef) do tamanho
// antigo pro novo — sem isso o card "pula" de altura ao trocar de aba.
export function useTrocaAnimada(shellRef, section) {
  return async function selectSection(key) {
    if (key === section.value) return
    const shell = shellRef.value

    if (shell) {
      shell.style.height = shell.getBoundingClientRect().height + 'px'
      shell.classList.add('resizing')
    }

    section.value = key
    await nextTick()

    if (shell) {
      // mede a altura real do conteúdo novo liberando a altura travada por um instante
      // (com a altura antiga ainda fixada, scrollHeight só "estoura" quando o conteúdo novo
      // é maior — quando é menor ele só devolve a altura antiga, e o encolher não anima).
      // Desliga a transição enquanto mede: sem isso, esse vai-e-vem no valor de height
      // "consome" a transição de verdade e o encolher só dá um salto direto pro tamanho
      // final, sem animar.
      const lockedHeight = shell.style.height
      shell.style.transition = 'none'
      shell.style.height = 'auto'
      const endHeight = shell.scrollHeight
      shell.style.height = lockedHeight
      void shell.offsetHeight

      // religa a transição e força o reflow pra registrar a altura de partida antes de animar
      shell.style.transition = ''
      void shell.offsetHeight
      shell.style.height = endHeight + 'px'

      let done = false
      const cleanup = () => {
        if (done) return
        done = true
        shell.style.height = ''
        shell.classList.remove('resizing')
        shell.removeEventListener('transitionend', onEnd)
      }
      const onEnd = (event) => {
        if (event.target === shell && event.propertyName === 'height') cleanup()
      }
      shell.addEventListener('transitionend', onEnd)
      // rede de segurança caso a transição não dispare (ex.: altura igual, prefers-reduced-motion)
      setTimeout(cleanup, 320)
    }
  }
}
