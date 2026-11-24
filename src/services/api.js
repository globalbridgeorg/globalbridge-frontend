import { supabase, setKeepLogged } from './supabase'

function mediaNotas(avaliacoes) {
  if (!avaliacoes?.length) return null
  const soma = avaliacoes.reduce((acc, a) => acc + Number(a.nota || 0), 0)
  return Math.round((soma / avaliacoes.length) * 10) / 10
}

function extrairTags(rel) {
  return (rel || []).map((item) => item.tag).filter(Boolean)
}

function formatarAgenciaResumida(a, paisContexto = null) {
  const estado = a.estado
  const sedePais = estado?.pais
  const mesmaSede = !paisContexto || (estado && estado.pais_id === paisContexto.id)
  return {
    id: a.id,
    nome: a.nome,
    descricao: a.descricao,
    cidade: mesmaSede ? (estado?.cidade_principal ?? null) : null,
    pais: paisContexto ? paisContexto.nome : (sedePais?.nome ?? null),
    pais_nome_ingles: paisContexto ? paisContexto.nome_ingles : (sedePais?.nome_ingles ?? null),
    nota_media: mediaNotas(a.avaliacoes),
    tags: extrairTags(a.agencia_tags),
    imagem_capa_url: a.imagem_capa_url ?? null,
    imagem_capa_foco_x: a.imagem_capa_foco_x ?? 50,
    imagem_capa_foco_y: a.imagem_capa_foco_y ?? 50,
  }
}

// ─── Catálogo público ────────────────────────────────────────────────────────

export async function getEstatisticas() {
  const { data, error } = await supabase.rpc('get_estatisticas')
  if (error) throw error
  return data
}

export async function getPaises({ regiao } = {}) {
  let q = supabase
    .from('paises')
    .select(`
      id, nome, nome_ingles, codigo_iso, regiao, custo_de_vida, idioma, cultura,
      descricao, imagem_url, intercambistas, universidades, ativo,
      pais_tags(tag:tags(id, categoria, valor, label)),
      agencia_paises_atendidos(agencia:agencias(id, ativo))
    `)
    .order('id')

  if (regiao) q = q.eq('regiao', regiao)

  const { data, error } = await q
  if (error) throw error

  return (data || []).map((p) => {
    const agenciasAtivas = new Set(
      (p.agencia_paises_atendidos || [])
        .map((r) => r.agencia)
        .filter((a) => a && a.ativo)
        .map((a) => a.id),
    )
    return {
      ...p,
      tags: extrairTags(p.pais_tags),
      agencias_count: agenciasAtivas.size,
    }
  })
}

export async function getPaisesMaisProcurados(quantidade = 6) {
  const { data, error } = await supabase
    .from('paises')
    .select(`
      id, nome, nome_ingles, codigo_iso, regiao, custo_de_vida, idioma,
      imagem_url, intercambistas, universidades, ativo,
      agencia_paises_atendidos(agencia:agencias(id, ativo))
    `)
    .eq('ativo', true)
    .order('intercambistas', { ascending: false })
    .limit(quantidade)

  if (error) throw error

  return (data || []).map((p) => ({
    ...p,
    agencias_count: new Set(
      (p.agencia_paises_atendidos || [])
        .map((r) => r.agencia)
        .filter((a) => a && a.ativo)
        .map((a) => a.id),
    ).size,
  }))
}

export async function getPaisDetalhe(id) {
  const { data, error } = await supabase
    .from('paises')
    .select(`
      id, nome, nome_ingles, codigo_iso, regiao, custo_de_vida, idioma, cultura,
      descricao, imagem_url, intercambistas, universidades, ativo,
      estados(id, nome, cidade_principal),
      agencia_paises_atendidos(
        agencia:agencias(
          id, nome, descricao, ativo, imagem_capa_url, imagem_capa_foco_x, imagem_capa_foco_y,
          estado:estados(cidade_principal, pais_id, pais:paises(nome, nome_ingles)),
          avaliacoes(nota),
          agencia_tags(tag:tags(id, categoria, valor, label)),
          planos(programa:programas(id, nome, descricao, duracao_min, duracao_max))
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  const agenciasMap = new Map()
  const programasMap = new Map()
  for (const rel of data.agencia_paises_atendidos || []) {
    const ag = rel.agencia
    if (!ag || !ag.ativo) continue
    if (!agenciasMap.has(ag.id)) {
      agenciasMap.set(ag.id, formatarAgenciaResumida(ag, data))
    }
    for (const pl of ag.planos || []) {
      if (pl.programa && !programasMap.has(pl.programa.id)) {
        programasMap.set(pl.programa.id, pl.programa)
      }
    }
  }

  return {
    id: data.id,
    nome: data.nome,
    codigo_iso: data.codigo_iso,
    regiao: data.regiao,
    custo_de_vida: data.custo_de_vida,
    idioma: data.idioma,
    cultura: data.cultura,
    descricao: data.descricao,
    imagem_url: data.imagem_url,
    intercambistas: data.intercambistas,
    universidades: data.universidades,
    ativo: data.ativo,
    cidades: data.estados || [],
    agencias: Array.from(agenciasMap.values()),
    programas: Array.from(programasMap.values()),
  }
}

export async function getAgencias({ pais, regiao } = {}) {
  const { data, error } = await supabase
    .from('agencias')
    .select(`
      id, nome, descricao, ativo, imagem_capa_url, imagem_capa_foco_x, imagem_capa_foco_y,
      estado:estados(cidade_principal, pais_id, pais:paises(id, nome, nome_ingles, regiao)),
      avaliacoes(nota),
      agencia_tags(tag:tags(id, categoria, valor, label)),
      agencia_paises_atendidos(pais:paises(id, regiao))
    `)
    .eq('ativo', true)
    .order('id')

  if (error) throw error

  let lista = data || []
  if (pais) {
    const paisNum = Number(pais)
    lista = lista.filter((a) =>
      (a.agencia_paises_atendidos || []).some((p) => p.pais?.id === paisNum),
    )
  }
  if (regiao) {
    lista = lista.filter((a) =>
      (a.agencia_paises_atendidos || []).some((p) => p.pais?.regiao === regiao),
    )
  }

  return lista.map((a) => formatarAgenciaResumida(a))
}

export async function getAgenciaDetalhe(id) {
  const { data, error } = await supabase
    .from('agencias')
    .select(`
      id, nome, descricao, como_funciona, contato, telefone, site, endereco,
      ativo, layout, imagem_capa_url, imagem_capa_foco_x, imagem_capa_foco_y, conteudo_blocos,
      estado:estados(cidade_principal, pais_id, pais:paises(id, nome, regiao)),
      agencia_paises_atendidos(pais:paises(id, nome)),
      planos(id, programa_id, preco, descricao, inclui, programa:programas(id, nome, duracao_min, duracao_max)),
      avaliacoes(id, nota, comentario, autor:profiles(id, name, username, avatar_url)),
      galeria:imagens_galeria(id, url, storage_path, ordem)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  const sedePais = data.estado?.pais
  const sedePaisId = sedePais?.id ?? null
  const outrosPaises = (data.agencia_paises_atendidos || [])
    .map((r) => r.pais)
    .filter((p) => p && p.id !== sedePaisId)
    .map((p) => p.nome)
    .sort((a, b) => a.localeCompare(b))

  const avaliacoesOrdenadas = [...(data.avaliacoes || [])]
    .sort((a, b) => b.id - a.id)
    .slice(0, 20)
    .map((av) => ({
      id: av.id,
      nota: av.nota,
      comentario: av.comentario,
      autor: av.autor?.name || av.autor?.username || 'Estudante',
      autor_id: av.autor?.id ?? null,
      autor_username: av.autor?.username ?? '',
      autor_foto: av.autor?.avatar_url ?? null,
    }))

  const planosFormatados = (data.planos || [])
    .sort((a, b) => a.id - b.id)
    .map((pl) => ({
      id: pl.id,
      programa_id: pl.programa_id,
      programa_nome: pl.programa?.nome || 'Programa',
      duracao_min: pl.programa?.duracao_min ?? 1,
      duracao_max: pl.programa?.duracao_max ?? 12,
      preco: Number(pl.preco),
      descricao: pl.descricao,
      inclui: pl.inclui,
    }))

  const galeriaOrdenada = [...(data.galeria || [])].sort(
    (a, b) => (a.ordem - b.ordem) || (a.id - b.id),
  )

  return {
    id: data.id,
    nome: data.nome,
    descricao: data.descricao,
    como_funciona: data.como_funciona,
    contato: data.contato,
    telefone: data.telefone,
    site: data.site,
    endereco: data.endereco,
    ativo: data.ativo,
    cidade: data.estado?.cidade_principal ?? null,
    pais: sedePais?.nome ?? null,
    pais_id: sedePaisId,
    regiao: sedePais?.regiao ?? null,
    outros_paises: outrosPaises,
    nota_media: mediaNotas(data.avaliacoes),
    total_avaliacoes: (data.avaliacoes || []).length,
    planos: planosFormatados,
    avaliacoes: avaliacoesOrdenadas,
    layout: data.layout || [],
    imagem_capa_url: data.imagem_capa_url,
    imagem_capa_foco_x: data.imagem_capa_foco_x ?? 50,
    imagem_capa_foco_y: data.imagem_capa_foco_y ?? 50,
    conteudo_blocos: data.conteudo_blocos || {},
    galeria: galeriaOrdenada,
  }
}

export async function getProgramas() {
  const { data, error } = await supabase
    .from('programas')
    .select('id, nome, descricao, duracao_min, duracao_max')
    .order('nome')
  if (error) throw error
  return data || []
}

export async function getDepoimentosHome(limite = 3) {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select(`
      id, nota, comentario,
      autor:profiles(id, name, username, avatar_url),
      agencia:agencias(id, nome, ativo, estado:estados(cidade_principal, pais:paises(nome)))
    `)
    .gte('nota', 4)
    .order('nota', { ascending: false })
    .order('id', { ascending: false })
    .limit(60)

  if (error) throw error

  const candidatos = (data || [])
    .filter((av) => av.agencia?.ativo && av.autor?.name && av.comentario?.trim())
    .sort((a, b) => (b.comentario.length - a.comentario.length) || (b.nota - a.nota) || (b.id - a.id))

  const escolhidos = []
  const autoresVistos = new Set()
  const textosVistos = new Set()
  const paisesVistos = new Set()

  const tentarAdicionar = (av, exigirPaisUnico) => {
    const autorKey = av.autor.id
    const textoKey = av.comentario.trim().toLowerCase()
    const paisNome = av.agencia.estado?.pais?.nome || ''
    if (autoresVistos.has(autorKey) || textosVistos.has(textoKey)) return
    if (exigirPaisUnico && paisNome && paisesVistos.has(paisNome)) return
    autoresVistos.add(autorKey)
    textosVistos.add(textoKey)
    if (paisNome) paisesVistos.add(paisNome)
    escolhidos.push({
      id: av.id,
      nota: av.nota,
      texto: av.comentario.trim(),
      autor: av.autor.name,
      autor_username: av.autor.username || '',
      autor_foto: av.autor.avatar_url || null,
      agencia_id: av.agencia.id,
      agencia_nome: av.agencia.nome,
      cidade: av.agencia.estado?.cidade_principal || null,
      pais: paisNome || null,
    })
  }

  for (const av of candidatos) {
    if (escolhidos.length >= limite) break
    tentarAdicionar(av, true)
  }
  if (escolhidos.length < limite) {
    for (const av of candidatos) {
      if (escolhidos.length >= limite) break
      tentarAdicionar(av, false)
    }
  }

  return escolhidos
}

export async function getPerfilPublico(username) {
  const { data: prof, error } = await supabase
    .from('profiles')
    .select('id, username, name, tipo, avatar_url')
    .eq('username', username)
    .single()

  if (error) throw error

  let agencia = null
  if (prof.tipo === 'agencia') {
    const { data: ag } = await supabase
      .from('agencias')
      .select(`
        id, nome, descricao, imagem_capa_url, imagem_capa_foco_x, imagem_capa_foco_y,
        estado:estados(cidade_principal, pais:paises(nome)),
        avaliacoes(nota),
        planos(id)
      `)
      .eq('usuario_id', prof.id)
      .maybeSingle()

    if (ag) {
      agencia = {
        id: ag.id,
        nome: ag.nome,
        descricao: ag.descricao,
        imagem_capa_url: ag.imagem_capa_url ?? null,
        imagem_capa_foco_x: ag.imagem_capa_foco_x ?? 50,
        imagem_capa_foco_y: ag.imagem_capa_foco_y ?? 50,
        cidade: ag.estado?.cidade_principal ?? null,
        pais: ag.estado?.pais?.nome ?? null,
        nota_media: mediaNotas(ag.avaliacoes),
        total_avaliacoes: (ag.avaliacoes || []).length,
        total_programas: (ag.planos || []).length,
      }
    }
  }

  let avaliacoes = []
  let totalAvaliacoes = 0
  let notaMediaDada = null
  let agenciasAvaliadas = 0

  if (prof.tipo === 'estudante') {
    const { data: avs } = await supabase
      .from('avaliacoes')
      .select(`
        id, nota, comentario, agencia_id,
        agencia:agencias(id, nome, estado:estados(cidade_principal, pais:paises(nome)))
      `)
      .eq('usuario_id', prof.id)
      .order('id', { ascending: false })
      .limit(20)

    const lista = avs || []
    totalAvaliacoes = lista.length
    notaMediaDada = mediaNotas(lista)
    agenciasAvaliadas = new Set(lista.map((a) => a.agencia_id)).size
    avaliacoes = lista.map((a) => ({
      id: a.id,
      nota: a.nota,
      comentario: a.comentario,
      agencia_id: a.agencia?.id ?? a.agencia_id,
      agencia_nome: a.agencia?.nome ?? 'Agência',
      agencia_cidade: a.agencia?.estado?.cidade_principal ?? null,
      agencia_pais: a.agencia?.estado?.pais?.nome ?? null,
    }))
  }

  return {
    id: prof.id,
    username: prof.username,
    name: prof.name,
    tipo: prof.tipo,
    avatar_url: prof.avatar_url,
    foto_url: prof.avatar_url,
    agencia,
    avaliacoes,
    total_avaliacoes: totalAvaliacoes,
    nota_media_dada: notaMediaDada,
    agencias_avaliadas: agenciasAvaliadas,
  }
}

// ─── Autenticação & Conta ────────────────────────────────────────────────────

export async function getContaAtual() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  const user = session.user

  const [{ data: profile }, { data: agencia }, { data: isAdmin }] = await Promise.all([
    supabase.from('profiles').select('id, username, name, tipo, avatar_url').eq('id', user.id).maybeSingle(),
    supabase.from('agencias').select('id').eq('usuario_id', user.id).maybeSingle(),
    supabase.rpc('is_current_user_admin'),
  ])

  return {
    id: user.id,
    email: user.email || '',
    username: profile?.username || '',
    name: profile?.name || user.user_metadata?.name || '',
    tipo: profile?.tipo || (agencia ? 'agencia' : 'estudante'),
    avatar_url: profile?.avatar_url || '',
    agencia_id: agencia?.id ?? null,
    is_admin: Boolean(isAdmin),
  }
}

export async function signInPassword(email, password, keepLogged = false) {
  setKeepLogged(keepLogged)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw error
  return data
}

export async function signInOtp(email, keepLogged = false) {
  setKeepLogged(keepLogged)
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: false },
  })
  if (error) throw error
}

export async function verifyLoginOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  })
  if (error) throw error
  return data
}

export async function signUpConta({ email, password, name }) {
  setKeepLogged(true)
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { name: name.trim() },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  })
  if (error) throw error
  return data
}

export async function verifySignupOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'signup',
  })
  if (error) throw error
  return data
}

export async function resendSignupOtp(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  })
  if (error) throw error
}

export async function solicitarRedefinicaoSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })
  if (error) throw error
}

export async function atualizarSenha(novaSenha) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  if (error) throw error
}

export async function signOutConta() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function atualizarPerfil(userId, { name, avatar_url }) {
  const payload = {}
  if (name !== undefined) payload.name = name
  if (avatar_url !== undefined) payload.avatar_url = avatar_url
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('id, username, name, tipo, avatar_url')
    .single()
  if (error) throw error
  return data
}

export async function uploadAvatar(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${userId}/avatar.${ext || 'jpg'}`
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (upErr) throw upErr

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${pub.publicUrl}?t=${Date.now()}`
  await atualizarPerfil(userId, { avatar_url: avatarUrl })
  return avatarUrl
}

export async function excluirMinhaConta() {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
  if (error) throw error
  await supabase.auth.signOut().catch(() => {})
}

// ─── Interações do Estudante (Favoritos, Avaliações, Contato) ────────────────

export async function getFavoritos() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('favoritos')
    .select('id, tipo, objeto_id, criado_em')
    .eq('usuario_id', session.user.id)
    .order('criado_em', { ascending: false })
  if (error) throw error
  if (!data?.length) return []

  const paisIds = data.filter((f) => f.tipo === 'pais').map((f) => f.objeto_id)
  const agIds = data.filter((f) => f.tipo === 'agencia').map((f) => f.objeto_id)

  const [paisesRes, agenciasRes] = await Promise.all([
    paisIds.length ? supabase.from('paises').select('id, nome, regiao, idioma').in('id', paisIds) : { data: [] },
    agIds.length
      ? supabase.from('agencias').select('id, nome, estado:estados(cidade_principal, pais:paises(nome))').in('id', agIds)
      : { data: [] },
  ])

  const paisMap = new Map((paisesRes.data || []).map((p) => [p.id, p]))
  const agMap = new Map((agenciasRes.data || []).map((a) => [a.id, a]))

  return data.map((f) => {
    if (f.tipo === 'pais') {
      const p = paisMap.get(f.objeto_id)
      return { ...f, nome: p?.nome || `País #${f.objeto_id}`, subtitulo: p?.idioma || '' }
    }
    const a = agMap.get(f.objeto_id)
    const loc = a?.estado ? [a.estado.cidade_principal, a.estado.pais?.nome].filter(Boolean).join(', ') : ''
    return { ...f, nome: a?.nome || `Agência #${f.objeto_id}`, subtitulo: loc }
  })
}

export async function adicionarFavorito(tipo, objetoId) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Faça login para favoritar.')
  const { data, error } = await supabase
    .from('favoritos')
    .insert({ usuario_id: session.user.id, tipo, objeto_id: objetoId })
    .select('id, tipo, objeto_id, criado_em')
    .single()
  if (error) throw error
  return data
}

export async function removerFavorito(id) {
  const { error } = await supabase.from('favoritos').delete().eq('id', id)
  if (error) throw error
}

export async function salvarAvaliacao({ agenciaId, nota, comentario }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Faça login para avaliar.')

  const { data, error } = await supabase
    .from('avaliacoes')
    .upsert(
      { usuario_id: session.user.id, agencia_id: agenciaId, nota, comentario: comentario.trim() },
      { onConflict: 'usuario_id,agencia_id' },
    )
    .select('id, nota, comentario, agencia_id')
    .single()
  if (error) throw error
  return data
}

export async function getMinhasAvaliacoes() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('avaliacoes')
    .select(`
      id, nota, comentario, created_at, agencia_id,
      agencia:agencias(id, nome, estado:estados(cidade_principal, pais:paises(nome)))
    `)
    .eq('usuario_id', session.user.id)
    .order('id', { ascending: false })

  if (error) throw error
  return (data || []).map((a) => ({
    id: a.id,
    nota: a.nota,
    comentario: a.comentario,
    created_at: a.created_at,
    agencia_id: a.agencia?.id ?? a.agencia_id,
    agencia_nome: a.agencia?.nome ?? 'Agência',
    local: a.agencia?.estado
      ? [a.agencia.estado.cidade_principal, a.agencia.estado.pais?.nome].filter(Boolean).join(' · ')
      : '',
  }))
}

export async function removerAvaliacao(id) {
  const { error } = await supabase.from('avaliacoes').delete().eq('id', id)
  if (error) throw error
}

export async function enviarContato({ publico, nome, email, nomeAgencia, assunto, mensagem }) {
  const { error } = await supabase.from('mensagens_contato').insert({
    publico,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    nome_agencia: (nomeAgencia || '').trim(),
    assunto: assunto.trim(),
    mensagem: mensagem.trim(),
    lida: false,
  })
  if (error) throw error
}

// ─── Área Business (Painel, Editor, Planos, Solicitação) ─────────────────────

export async function getPainelAgencia(agenciaId) {
  const { data, error } = await supabase.rpc('get_painel_agencia', { p_agencia_id: Number(agenciaId) })
  if (error) throw error
  return data
}

export async function atualizarAgencia(agenciaId, campos) {
  const { error } = await supabase
    .from('agencias')
    .update(campos)
    .eq('id', Number(agenciaId))
  if (error) throw error
  return getAgenciaDetalhe(agenciaId)
}

export async function uploadCapaAgencia(agenciaId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${agenciaId}/capa.${ext || 'jpg'}`
  const { error: upErr } = await supabase.storage
    .from('agencias')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (upErr) throw upErr

  const { data: pub } = supabase.storage.from('agencias').getPublicUrl(path)
  const url = `${pub.publicUrl}?t=${Date.now()}`
  return atualizarAgencia(agenciaId, { imagem_capa_url: url })
}

export async function uploadFotoGaleria(agenciaId, file, ordem = 0) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const idUnico = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
  const path = `${agenciaId}/galeria/${idUnico}.${ext || 'jpg'}`

  const { error: upErr } = await supabase.storage
    .from('agencias')
    .upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' })
  if (upErr) throw upErr

  const { data: pub } = supabase.storage.from('agencias').getPublicUrl(path)
  const { data, error } = await supabase
    .from('imagens_galeria')
    .insert({ agencia_id: Number(agenciaId), url: pub.publicUrl, storage_path: path, ordem })
    .select('id, url, storage_path, ordem')
    .single()
  if (error) throw error
  return data
}

export async function removerFotoGaleria(imagem) {
  const { error } = await supabase.from('imagens_galeria').delete().eq('id', imagem.id)
  if (error) throw error
  if (imagem.storage_path) {
    await supabase.storage.from('agencias').remove([imagem.storage_path]).catch(() => {})
  }
}

export async function solicitarPaisAdicional(agenciaId, paisId) {
  const { data, error } = await supabase
    .from('solicitacoes_pais_adicional')
    .insert({ agencia_id: Number(agenciaId), pais_id: Number(paisId), status: 'pendente' })
    .select('id, status')
    .single()
  if (error) throw error
  return data
}

export async function criarPlano(agenciaId, { programa_id, preco, descricao, inclui }) {
  const { data, error } = await supabase
    .from('planos')
    .insert({
      agencia_id: Number(agenciaId),
      programa_id: Number(programa_id),
      preco: Number(preco),
      descricao: (descricao || '').trim(),
      inclui: (inclui || '').trim(),
    })
    .select('id')
    .single()
  if (error) throw error
  return data
}

export async function atualizarPlano(planoId, { programa_id, preco, descricao, inclui }) {
  const { error } = await supabase
    .from('planos')
    .update({
      programa_id: Number(programa_id),
      preco: Number(preco),
      descricao: (descricao || '').trim(),
      inclui: (inclui || '').trim(),
    })
    .eq('id', Number(planoId))
  if (error) throw error
}

export async function removerPlano(planoId) {
  const { error } = await supabase.from('planos').delete().eq('id', Number(planoId))
  if (error) throw error
}

export async function enviarSolicitacaoAgencia(form, documentoFile) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Sessão necessária para concluir o envio.')
  const uid = session.user.id

  const ext = (documentoFile.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '')
  const docPath = `${uid}/comprovante-${Date.now()}.${ext || 'pdf'}`
  const { error: upErr } = await supabase.storage
    .from('documentos-agencia')
    .upload(docPath, documentoFile, { upsert: true, contentType: documentoFile.type || 'application/octet-stream' })
  if (upErr) throw upErr

  const atendidos = Array.from(
    new Set([...(form.paises_atendidos || []).map(Number), Number(form.pais_sede)]),
  ).filter(Boolean)

  const { data, error } = await supabase
    .from('solicitacoes_agencia')
    .insert({
      nome: form.nome.trim(),
      site: (form.site || '').trim(),
      cidade: form.cidade.trim(),
      pais_sede_id: Number(form.pais_sede),
      paises_atendidos_ids: atendidos,
      ano_fundacao: form.ano_fundacao ? Number(form.ano_fundacao) : null,
      nome_responsavel: form.nome_responsavel.trim(),
      cargo_responsavel: (form.cargo_responsavel || '').trim(),
      email_responsavel: form.email_responsavel.trim().toLowerCase(),
      documento_path: docPath,
      descricao: (form.descricao || '').trim(),
      status: 'pendente',
      usuario_criado_id: uid,
    })
    .select('id, nome, status, motivo_recusa, criado_em, revisado_em')
    .single()

  if (error) throw error
  return data
}

export async function getMinhaSolicitacaoAgencia() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('solicitacoes_agencia')
    .select('id, nome, status, motivo_recusa, criado_em, revisado_em, agencia_criada_id')
    .eq('usuario_criado_id', session.user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

// ─── Painel Admin (somente usuários em private.admins) ───────────────────────

export async function getAdminDados() {
  const [solAg, solPais, msgs] = await Promise.all([
    supabase
      .from('solicitacoes_agencia')
      .select(`
        id, nome, site, cidade, ano_fundacao, nome_responsavel, cargo_responsavel,
        email_responsavel, documento_path, descricao, status, motivo_recusa, criado_em, revisado_em,
        pais_sede:paises(nome)
      `)
      .order('criado_em', { ascending: false }),
    supabase
      .from('solicitacoes_pais_adicional')
      .select(`
        id, status, motivo_recusa, criado_em, revisado_em,
        agencia:agencias(id, nome),
        pais:paises(id, nome)
      `)
      .order('criado_em', { ascending: false }),
    supabase
      .from('mensagens_contato')
      .select('id, publico, nome, email, nome_agencia, assunto, mensagem, lida, criado_em')
      .order('criado_em', { ascending: false })
      .limit(50),
  ])

  if (solAg.error) throw solAg.error
  if (solPais.error) throw solPais.error
  if (msgs.error) throw msgs.error

  return {
    solicitacoesAgencia: solAg.data || [],
    solicitacoesPais: solPais.data || [],
    mensagens: msgs.data || [],
  }
}

export async function getDocumentoAssinadoUrl(path) {
  const { data, error } = await supabase.storage
    .from('documentos-agencia')
    .createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}

export async function aprovarSolicitacaoAgencia(id) {
  const { data, error } = await supabase.rpc('aprovar_solicitacao_agencia', { p_solicitacao_id: id })
  if (error) throw error
  return data
}

export async function recusarSolicitacaoAgencia(id, motivo = '') {
  const { error } = await supabase.rpc('recusar_solicitacao_agencia', {
    p_solicitacao_id: id,
    p_motivo: motivo || null,
  })
  if (error) throw error
}

export async function aprovarPaisAdicional(id) {
  const { error } = await supabase.rpc('aprovar_pais_adicional', { p_solicitacao_id: id })
  if (error) throw error
}

export async function recusarPaisAdicional(id, motivo = '') {
  const { error } = await supabase.rpc('recusar_pais_adicional', {
    p_solicitacao_id: id,
    p_motivo: motivo || null,
  })
  if (error) throw error
}

export async function marcarMensagemLida(id, lida = true) {
  const { error } = await supabase.from('mensagens_contato').update({ lida }).eq('id', id)
  if (error) throw error
}
