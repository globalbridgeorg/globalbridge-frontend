const MSG_RATE_LIMIT = 'Muitas tentativas em pouco tempo. Aguarde alguns instantes antes de tentar novamente.'

export function ehRateLimitAuth(err) {
  const msg = String(err?.message || '').toLowerCase()
  return err?.status === 429
    || msg.includes('rate limit')
    || msg.includes('too many')
    || msg.includes('security purposes')
}

export function traduzirErroAuth(err, fallback = 'Não foi possível concluir agora. Tente novamente.') {
  if (ehRateLimitAuth(err)) return MSG_RATE_LIMIT
  const msg = String(err?.message || '').toLowerCase()
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha inválidos.'
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('token has expired') || msg.includes('invalid otp') || msg.includes('otp expired')) {
    return 'Código inválido ou expirado.'
  }
  return fallback
}
