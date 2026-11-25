import {
  apiRequest,
  clearTokens,
  emitAuthChange,
  hasStoredSession,
  setKeepLogged,
  setTokens,
} from './http'

// ─── Catálogo público ────────────────────────────────────────────────────────

export async function getEstatisticas() {
  return apiRequest('/estatisticas/', { auth: false })
}

export async function getPaises({ regiao } = {}) {
  const qs = regiao ? `?regiao=${encodeURIComponent(regiao)}` : ''
  return apiRequest(`/paises/${qs}`, { auth: false })
}

export async function getPaisesMaisProcurados(quantidade = 6) {
  return apiRequest(`/paises/mais-procurados/?quantidade=${encodeURIComponent(quantidade)}`, { auth: false })
}

export async function getPaisDetalhe(id) {
  return apiRequest(`/paises/${encodeURIComponent(id)}/`, { auth: false })
}

export async function getAgencias({ pais, regiao } = {}) {
  const params = new URLSearchParams()
  if (pais) params.set('pais', String(pais))
  if (regiao) params.set('regiao', String(regiao))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiRequest(`/agencia/${qs}`, { auth: false })
}

export async function getAgenciaDetalhe(id) {
  return apiRequest(`/agencia/${encodeURIComponent(id)}/`, { auth: false })
}

export async function getProgramas() {
  return apiRequest('/programa/', { auth: false })
}

export async function getDepoimentosHome(limite = 3) {
  return apiRequest(`/avaliacao/depoimentos/?limite=${encodeURIComponent(limite)}`, { auth: false })
}

export async function getPerfilPublico(username) {
  return apiRequest(`/usuarios/u/${encodeURIComponent(username)}/`, { auth: false })
}

// ─── Autenticação & Conta (Django + SimpleJWT) ───────────────────────────────

export async function getContaAtual() {
  if (!hasStoredSession()) return null
  try {
    const u = await apiRequest('/usuarios/me/')
    if (!u) return null
    return {
      id: u.id,
      email: u.email || '',
      username: u.username || '',
      name: u.name || '',
      tipo: u.tipo || (u.agencia_id ? 'agencia' : 'estudante'),
      avatar_url: u.avatar_url || u.foto_url || '',
      agencia_id: u.agencia_id ?? null,
      is_admin: Boolean(u.is_admin || u.is_staff || u.is_superuser),
    }
  } catch (err) {
    if (err?.status === 401) {
      clearTokens()
      return null
    }
    throw err
  }
}

export async function signInPassword(email, password, keepLogged = false) {
  setKeepLogged(keepLogged)
  const data = await apiRequest('/token/', {
    method: 'POST',
    auth: false,
    body: {
      email: email.trim().toLowerCase(),
      password,
    },
  })
  setTokens(data, keepLogged)
  emitAuthChange('SIGNED_IN')
  return data
}

export async function signInOtp(email, keepLogged = false) {
  setKeepLogged(keepLogged)
  await apiRequest('/auth/codigo/solicitar/', {
    method: 'POST',
    auth: false,
    body: { email: email.trim().toLowerCase() },
  })
}

export async function verifyLoginOtp(email, token) {
  const data = await apiRequest('/auth/codigo/verificar/', {
    method: 'POST',
    auth: false,
    body: {
      email: email.trim().toLowerCase(),
      codigo: token.trim(),
    },
  })
  setTokens(data)
  emitAuthChange('SIGNED_IN')
  return data
}

export async function signUpConta({ email, password, name }) {
  setKeepLogged(true)
  const data = await apiRequest('/registro/', {
    method: 'POST',
    auth: false,
    body: {
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    },
  })
  if (data?.access) {
    setTokens({ access: data.access, refresh: data.refresh }, true)
    emitAuthChange('SIGNED_IN')
  }
  return {
    user: data?.user || data,
    session: data?.access ? { access_token: data.access, refresh_token: data.refresh } : null,
  }
}

export async function verifySignupOtp(email, token) {
  return apiRequest('/auth/cadastro/codigo/verificar/', {
    method: 'POST',
    auth: false,
    body: {
      email: email.trim().toLowerCase(),
      codigo: token.trim(),
    },
  })
}

export async function resendSignupOtp(email) {
  return apiRequest('/auth/cadastro/codigo/solicitar/', {
    method: 'POST',
    auth: false,
    body: { email: email.trim().toLowerCase() },
  })
}

export async function solicitarRedefinicaoSenha(email) {
  return apiRequest('/auth/esqueci-senha/', {
    method: 'POST',
    auth: false,
    body: { email: email.trim().toLowerCase() },
  })
}

export async function atualizarSenha(novaSenha) {
  return apiRequest('/usuarios/me/senha/', {
    method: 'POST',
    body: { nova_senha: novaSenha },
  })
}

export async function redefinirSenhaComToken({ uid, token, novaSenha }) {
  return apiRequest('/auth/redefinir-senha/', {
    method: 'POST',
    auth: false,
    body: { uid, token, nova_senha: novaSenha },
  })
}

export async function signOutConta() {
  clearTokens()
  emitAuthChange('SIGNED_OUT')
}

export async function atualizarPerfil(_userId, { name, avatar_url }) {
  const body = {}
  if (name !== undefined) body.name = name
  if (avatar_url !== undefined) body.avatar_url = avatar_url
  const data = await apiRequest('/usuarios/me/', {
    method: 'PATCH',
    body,
  })
  emitAuthChange('USER_UPDATED')
  return data
}

export async function uploadAvatar(_userId, file) {
  const formData = new FormData()
  formData.append('avatar', file)
  const data = await apiRequest('/usuarios/me/avatar/', {
    method: 'PATCH',
    formData,
  })
  emitAuthChange('USER_UPDATED')
  return data?.avatar_url || data?.foto_url || ''
}

export async function excluirMinhaConta() {
  await apiRequest('/usuarios/me/', { method: 'DELETE' })
  clearTokens()
  emitAuthChange('SIGNED_OUT')
}

// ─── Interações do Estudante (Favoritos, Avaliações, Contato) ────────────────

export async function getFavoritos() {
  if (!hasStoredSession()) return []
  return apiRequest('/favoritos/')
}

export async function adicionarFavorito(tipo, objetoId) {
  return apiRequest('/favoritos/', {
    method: 'POST',
    body: { tipo, objeto_id: Number(objetoId) },
  })
}

export async function removerFavorito(id) {
  return apiRequest(`/favoritos/${encodeURIComponent(id)}/`, { method: 'DELETE' })
}

export async function salvarAvaliacao({ agenciaId, nota, comentario }) {
  return apiRequest('/avaliacao/', {
    method: 'POST',
    body: {
      id_agencia: Number(agenciaId),
      nota: Number(nota),
      comentario: comentario.trim(),
    },
  })
}

export async function getMinhasAvaliacoes() {
  if (!hasStoredSession()) return []
  return apiRequest('/avaliacao/minhas/')
}

export async function removerAvaliacao(id) {
  return apiRequest(`/avaliacao/${encodeURIComponent(id)}/`, { method: 'DELETE' })
}

export async function enviarContato({ publico, nome, email, nomeAgencia, assunto, mensagem }) {
  return apiRequest('/contato/', {
    method: 'POST',
    auth: false,
    body: {
      publico,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      nome_agencia: (nomeAgencia || '').trim(),
      assunto: assunto.trim(),
      mensagem: mensagem.trim(),
    },
  })
}

// ─── Área Business (Painel, Editor, Planos, Solicitação) ─────────────────────

export async function getPainelAgencia(agenciaId) {
  return apiRequest(`/agencia/${encodeURIComponent(agenciaId)}/painel/`)
}

export async function atualizarAgencia(agenciaId, campos) {
  return apiRequest(`/agencia/${encodeURIComponent(agenciaId)}/`, {
    method: 'PATCH',
    body: campos,
  })
}

export async function uploadCapaAgencia(agenciaId, file) {
  const formData = new FormData()
  formData.append('imagem_capa', file)
  return apiRequest(`/agencia/${encodeURIComponent(agenciaId)}/capa/`, {
    method: 'PATCH',
    formData,
  })
}

export async function uploadFotoGaleria(agenciaId, file, ordem = 0) {
  const formData = new FormData()
  formData.append('imagem', file)
  formData.append('ordem', String(ordem))
  return apiRequest(`/agencia/${encodeURIComponent(agenciaId)}/galeria/`, {
    method: 'POST',
    formData,
  })
}

export async function removerFotoGaleria(imagem) {
  if (!imagem?.agencia_id || !imagem?.id) {
    throw new Error('Identificação da imagem inválida.')
  }
  return apiRequest(`/agencia/${encodeURIComponent(imagem.agencia_id)}/galeria/${encodeURIComponent(imagem.id)}/`, {
    method: 'DELETE',
  })
}

export async function solicitarPaisAdicional(agenciaId, paisId) {
  return apiRequest(`/agencia/${encodeURIComponent(agenciaId)}/paises/solicitar/`, {
    method: 'POST',
    body: { pais: Number(paisId) },
  })
}

export async function criarPlano(agenciaId, { programa_id, preco, descricao, inclui }) {
  return apiRequest('/plano/', {
    method: 'POST',
    body: {
      id_agencia: Number(agenciaId),
      id_programa: Number(programa_id),
      preco: Number(preco),
      descricao: (descricao || '').trim(),
      inclui: (inclui || '').trim(),
    },
  })
}

export async function atualizarPlano(planoId, { programa_id, preco, descricao, inclui }) {
  return apiRequest(`/plano/${encodeURIComponent(planoId)}/`, {
    method: 'PATCH',
    body: {
      id_programa: Number(programa_id),
      preco: Number(preco),
      descricao: (descricao || '').trim(),
      inclui: (inclui || '').trim(),
    },
  })
}

export async function removerPlano(planoId) {
  return apiRequest(`/plano/${encodeURIComponent(planoId)}/`, { method: 'DELETE' })
}

export async function enviarSolicitacaoAgencia(form, documentoFile) {
  const formData = new FormData()
  formData.append('nome', form.nome.trim())
  formData.append('site', (form.site || '').trim())
  formData.append('cidade', form.cidade.trim())
  formData.append('pais_sede', String(Number(form.pais_sede)))

  const atendidos = Array.from(
    new Set([...(form.paises_atendidos || []).map(Number), Number(form.pais_sede)]),
  ).filter(Boolean)
  for (const pid of atendidos) {
    formData.append('paises_atendidos', String(pid))
  }

  if (form.ano_fundacao) {
    formData.append('ano_fundacao', String(Number(form.ano_fundacao)))
  }
  formData.append('nome_responsavel', form.nome_responsavel.trim())
  formData.append('cargo_responsavel', (form.cargo_responsavel || '').trim())
  formData.append('email_responsavel', form.email_responsavel.trim().toLowerCase())
  if (form.senha) {
    formData.append('senha', form.senha)
  }
  formData.append('descricao', (form.descricao || '').trim())
  formData.append('documento', documentoFile)

  return apiRequest('/solicitacoes-agencia/', {
    method: 'POST',
    formData,
  })
}

export async function getMinhaSolicitacaoAgencia() {
  if (!hasStoredSession()) return null
  try {
    return await apiRequest('/solicitacoes-agencia/minha/')
  } catch (err) {
    if (err?.status === 404) return null
    throw err
  }
}

// ─── Painel Admin (somente usuários is_staff no Django) ──────────────────────

export async function getAdminDados() {
  return apiRequest('/admin-painel/dados/')
}

export async function getDocumentoAssinadoUrl(path) {
  const data = await apiRequest(`/admin-painel/documento/?path=${encodeURIComponent(path)}`)
  return data?.url || ''
}

export async function aprovarSolicitacaoAgencia(id) {
  return apiRequest(`/admin-painel/solicitacoes-agencia/${encodeURIComponent(id)}/aprovar/`, {
    method: 'POST',
  })
}

export async function recusarSolicitacaoAgencia(id, motivo = '') {
  return apiRequest(`/admin-painel/solicitacoes-agencia/${encodeURIComponent(id)}/recusar/`, {
    method: 'POST',
    body: { motivo },
  })
}

export async function aprovarPaisAdicional(id) {
  return apiRequest(`/admin-painel/solicitacoes-pais/${encodeURIComponent(id)}/aprovar/`, {
    method: 'POST',
  })
}

export async function recusarPaisAdicional(id, motivo = '') {
  return apiRequest(`/admin-painel/solicitacoes-pais/${encodeURIComponent(id)}/recusar/`, {
    method: 'POST',
    body: { motivo },
  })
}

export async function marcarMensagemLida(id, lida = true) {
  return apiRequest(`/admin-painel/mensagens/${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    body: { lida },
  })
}
