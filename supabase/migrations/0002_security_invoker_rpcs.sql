-- Converte todas as RPCs expostas em public para SECURITY INVOKER (zero SECURITY DEFINER no schema public)
-- e libera update de profiles para admins via RLS (usado por aprovar_solicitacao_agencia).

create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Helper privado (schema não exposto) para agregar favoritos de uma agência sem abrir RLS de favoritos
create or replace function private.agencia_favoritos_stats(p_agencia_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_total integer;
  v_30 integer;
  v_recentes jsonb;
begin
  if current_user not in ('postgres', 'service_role')
    and not private.owns_agencia(p_agencia_id)
    and not private.is_admin()
  then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select
    count(*),
    count(*) filter (where criado_em >= now() - interval '30 days')
  into v_total, v_30
  from public.favoritos
  where tipo = 'agencia' and objeto_id = p_agencia_id;

  select coalesce(jsonb_agg(row_obj), '[]'::jsonb)
  into v_recentes
  from (
    select jsonb_build_object(
      'nome', coalesce(nullif(pr.name, ''), pr.username, 'Estudante'),
      'quando', f.criado_em
    ) as row_obj
    from public.favoritos f
    left join public.profiles pr on pr.id = f.usuario_id
    where f.tipo = 'agencia' and f.objeto_id = p_agencia_id
    order by f.criado_em desc
    limit 6
  ) sub;

  return jsonb_build_object('total', v_total, 'ultimos_30', v_30, 'recentes', v_recentes);
end;
$$;
revoke all on function private.agencia_favoritos_stats(bigint) from public, anon;
grant execute on function private.agencia_favoritos_stats(bigint) to authenticated;

-- 1. is_current_user_admin -> SECURITY INVOKER
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin();
$$;

-- 2. get_painel_agencia -> SECURITY INVOKER
create or replace function public.get_painel_agencia(p_agencia_id bigint)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  ag record;
  v_total_av integer;
  v_nota_media numeric;
  v_dist jsonb;
  v_fav jsonb;
  v_ranking jsonb := null;
  v_pais_sede_id bigint;
  v_pais_sede_nome text;
  v_posicao integer;
  v_total_conc integer;
  v_planos jsonb;
  v_planos_count integer;
  v_tags jsonb;
  v_tags_count integer;
  v_paises_atendidos jsonb;
  v_paises_count integer;
  v_paises_pendentes jsonb;
  v_verificacao jsonb := null;
  v_av_recentes jsonb;
  v_comp_itens jsonb;
  v_feitos integer;
begin
  if current_user not in ('postgres', 'service_role')
    and not private.owns_agencia(p_agencia_id)
    and not private.is_admin()
  then
    raise exception 'Você só pode ver o painel da sua própria agência.' using errcode = '42501';
  end if;

  select * into ag from public.agencias where id = p_agencia_id;
  if not found then
    raise exception 'Agência não encontrada.' using errcode = 'P0002';
  end if;

  select count(*), round(avg(nota)::numeric, 1)
    into v_total_av, v_nota_media
  from public.avaliacoes where agencia_id = p_agencia_id;

  select jsonb_agg(
    jsonb_build_object(
      'estrelas', s.estrela,
      'quantidade', coalesce(c.qtd, 0),
      'largura', case when v_total_av > 0 then round(coalesce(c.qtd, 0)::numeric / v_total_av * 100) else 0 end
    ) order by s.estrela desc
  )
  into v_dist
  from unnest(array[5,4,3,2,1]) as s(estrela)
  left join (
    select nota, count(*) as qtd from public.avaliacoes where agencia_id = p_agencia_id group by nota
  ) c on c.nota = s.estrela;

  v_fav := private.agencia_favoritos_stats(p_agencia_id);

  if ag.estado_id is not null then
    select e.pais_id, p.nome into v_pais_sede_id, v_pais_sede_nome
    from public.estados e join public.paises p on p.id = e.pais_id
    where e.id = ag.estado_id;

    if v_pais_sede_id is not null then
      with ranked as (
        select
          a.id,
          row_number() over (order by avg(av.nota) desc nulls last, a.id asc) as pos,
          count(*) over () as tot
        from public.agencias a
        join public.estados e on e.id = a.estado_id
        left join public.avaliacoes av on av.agencia_id = a.id
        where e.pais_id = v_pais_sede_id and a.ativo = true
        group by a.id
      )
      select pos, tot into v_posicao, v_total_conc from ranked where id = p_agencia_id;
      if v_posicao is not null then
        v_ranking := jsonb_build_object('posicao', v_posicao, 'total', v_total_conc, 'pais', v_pais_sede_nome);
      end if;
    end if;
  end if;

  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', pl.id,
        'programa_id', pl.programa_id,
        'nome', pr.nome,
        'duracao', pr.duracao_min::text || ' a ' || pr.duracao_max::text || ' meses',
        'preco', pl.preco::float8,
        'descricao', pl.descricao,
        'inclui', pl.inclui
      ) order by pl.id
    ), '[]'::jsonb),
    count(*)
  into v_planos, v_planos_count
  from public.planos pl
  join public.programas pr on pr.id = pl.programa_id
  where pl.agencia_id = p_agencia_id;

  select coalesce(jsonb_agg(coalesce(nullif(t.label, ''), t.valor) order by t.id), '[]'::jsonb), count(*)
  into v_tags, v_tags_count
  from public.agencia_tags atg
  join public.tags t on t.id = atg.tag_id
  where atg.agencia_id = p_agencia_id;

  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'sigla', p.codigo_iso) order by p.nome), '[]'::jsonb), count(*)
  into v_paises_atendidos, v_paises_count
  from public.agencia_paises_atendidos apa
  join public.paises p on p.id = apa.pais_id
  where apa.agencia_id = p_agencia_id;

  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'sigla', p.codigo_iso) order by p.nome), '[]'::jsonb)
  into v_paises_pendentes
  from public.solicitacoes_pais_adicional spa
  join public.paises p on p.id = spa.pais_id
  where spa.agencia_id = p_agencia_id and spa.status = 'pendente';

  select jsonb_build_object(
    'responsavel', sa.nome_responsavel,
    'cargo', nullif(sa.cargo_responsavel, ''),
    'enviado_em', sa.criado_em,
    'aprovado_em', sa.revisado_em
  )
  into v_verificacao
  from public.solicitacoes_agencia sa
  where sa.agencia_criada_id = p_agencia_id
  limit 1;

  select coalesce(jsonb_agg(row_obj), '[]'::jsonb)
  into v_av_recentes
  from (
    select jsonb_build_object(
      'nome', coalesce(nullif(pr.name, ''), pr.username),
      'nota', av.nota,
      'comentario', av.comentario
    ) as row_obj
    from public.avaliacoes av
    join public.profiles pr on pr.id = av.usuario_id
    where av.agencia_id = p_agencia_id
    order by av.id desc
    limit 5
  ) sub;

  v_comp_itens := jsonb_build_array(
    jsonb_build_object('texto', 'Descrição preenchida', 'feito', length(trim(coalesce(ag.descricao, ''))) > 0),
    jsonb_build_object('texto', '"Como funciona" preenchido', 'feito', length(trim(coalesce(ag.como_funciona, ''))) > 0),
    jsonb_build_object('texto', 'Imagem de capa enviada', 'feito', ag.imagem_capa_url is not null and ag.imagem_capa_url <> ''),
    jsonb_build_object('texto', 'Layout personalizado', 'feito', jsonb_array_length(coalesce(ag.layout, '[]'::jsonb)) > 0),
    jsonb_build_object('texto', 'Ao menos 1 programa cadastrado', 'feito', v_planos_count > 0),
    jsonb_build_object('texto', 'Ao menos 1 especialidade marcada', 'feito', v_tags_count > 0)
  );

  select count(*) into v_feitos
  from jsonb_array_elements(v_comp_itens) elem
  where (elem->>'feito')::boolean = true;

  return jsonb_build_object(
    'stats', jsonb_build_object(
      'nota', v_nota_media,
      'total_avaliacoes', v_total_av,
      'favoritos', (v_fav->>'total')::integer,
      'favoritos_30_dias', (v_fav->>'ultimos_30')::integer,
      'programas', v_planos_count,
      'paises', v_paises_count
    ),
    'ranking', v_ranking,
    'distribuicao_notas', v_dist,
    'completude', jsonb_build_object(
      'percentual', round(v_feitos::numeric / 6 * 100),
      'itens', v_comp_itens
    ),
    'paises_atendidos', v_paises_atendidos,
    'paises_pendentes', v_paises_pendentes,
    'planos', v_planos,
    'tags', v_tags,
    'contato', jsonb_build_object(
      'email', ag.contato,
      'telefone', ag.telefone,
      'site', ag.site,
      'endereco', ag.endereco
    ),
    'verificacao', v_verificacao,
    'avaliacoes_recentes', v_av_recentes,
    'favoritos_recentes', coalesce(v_fav->'recentes', '[]'::jsonb)
  );
end;
$$;

-- 3. RPCs de aprovação -> SECURITY INVOKER (RLS já valida admin em todas as tabelas!)
create or replace function public.aprovar_solicitacao_agencia(p_solicitacao_id bigint)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  sol record;
  v_estado_id bigint;
  v_pais_nome text;
  v_agencia_id bigint;
  v_pid bigint;
begin
  if current_user not in ('postgres', 'service_role') and not private.is_admin() then
    raise exception 'Apenas administradores podem aprovar solicitações.' using errcode = '42501';
  end if;

  select * into sol from public.solicitacoes_agencia where id = p_solicitacao_id for update;
  if not found then
    raise exception 'Solicitação não encontrada.' using errcode = 'P0002';
  end if;
  if sol.status <> 'pendente' then
    raise exception 'Solicitação já revisada (status: %).', sol.status;
  end if;
  if sol.usuario_criado_id is null then
    raise exception 'Solicitação sem usuário vinculado.';
  end if;

  select nome into v_pais_nome from public.paises where id = sol.pais_sede_id;

  select id into v_estado_id
  from public.estados
  where pais_id = sol.pais_sede_id and lower(cidade_principal) = lower(sol.cidade)
  limit 1;

  if v_estado_id is null then
    insert into public.estados (nome, cidade_principal, pais_id)
    values (sol.cidade, sol.cidade, sol.pais_sede_id)
    returning id into v_estado_id;
  end if;

  insert into public.agencias (
    nome, descricao, contato, telefone, site, endereco,
    data_cadastro, ativo, estado_id, usuario_id
  ) values (
    sol.nome,
    coalesce(nullif(trim(sol.descricao), ''), 'Agência verificada pela GlobalBridge — ' || sol.nome || '.'),
    sol.email_responsavel,
    '',
    sol.site,
    sol.cidade || ', ' || coalesce(v_pais_nome, ''),
    now(),
    true,
    v_estado_id,
    sol.usuario_criado_id
  )
  returning id into v_agencia_id;

  insert into public.agencia_paises_atendidos (agencia_id, pais_id)
  values (v_agencia_id, sol.pais_sede_id)
  on conflict do nothing;

  foreach v_pid in array coalesce(sol.paises_atendidos_ids, '{}') loop
    insert into public.agencia_paises_atendidos (agencia_id, pais_id)
    values (v_agencia_id, v_pid)
    on conflict do nothing;
  end loop;

  update public.profiles set tipo = 'agencia' where id = sol.usuario_criado_id;

  update public.solicitacoes_agencia
  set status = 'aprovado',
      agencia_criada_id = v_agencia_id,
      revisado_em = now()
  where id = p_solicitacao_id;

  return v_agencia_id;
end;
$$;

create or replace function public.recusar_solicitacao_agencia(p_solicitacao_id bigint, p_motivo text default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role') and not private.is_admin() then
    raise exception 'Apenas administradores podem recusar solicitações.' using errcode = '42501';
  end if;

  update public.solicitacoes_agencia
  set status = 'recusado',
      motivo_recusa = coalesce(
        nullif(trim(p_motivo), ''),
        nullif(trim(motivo_recusa), ''),
        'Não conseguimos confirmar as informações enviadas. Entre em contato com a gente se quiser mais detalhes.'
      ),
      revisado_em = now()
  where id = p_solicitacao_id and status = 'pendente';

  if not found then
    raise exception 'Solicitação pendente não encontrada.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.aprovar_pais_adicional(p_solicitacao_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  sol record;
begin
  if current_user not in ('postgres', 'service_role') and not private.is_admin() then
    raise exception 'Apenas administradores podem aprovar países.' using errcode = '42501';
  end if;

  select * into sol from public.solicitacoes_pais_adicional where id = p_solicitacao_id and status = 'pendente' for update;
  if not found then
    raise exception 'Solicitação pendente não encontrada.' using errcode = 'P0002';
  end if;

  insert into public.agencia_paises_atendidos (agencia_id, pais_id)
  values (sol.agencia_id, sol.pais_id)
  on conflict do nothing;

  update public.solicitacoes_pais_adicional
  set status = 'aprovado', revisado_em = now()
  where id = p_solicitacao_id;
end;
$$;

create or replace function public.recusar_pais_adicional(p_solicitacao_id bigint, p_motivo text default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role') and not private.is_admin() then
    raise exception 'Apenas administradores podem recusar países.' using errcode = '42501';
  end if;

  update public.solicitacoes_pais_adicional
  set status = 'recusado',
      motivo_recusa = coalesce(nullif(trim(p_motivo), ''), 'Pedido recusado pela equipe.'),
      revisado_em = now()
  where id = p_solicitacao_id and status = 'pendente';

  if not found then
    raise exception 'Solicitação pendente não encontrada.' using errcode = 'P0002';
  end if;
end;
$$;
