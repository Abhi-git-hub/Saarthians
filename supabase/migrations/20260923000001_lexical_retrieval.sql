-- Lexical retrieval fallback.
--
-- The Groq account backing this project exposes chat models only: its
-- /models list contains no embedding model and /embeddings answers
-- model_not_found. Rather than ship dead semantic search, retrieval falls
-- back to pg_trgm similarity over chunks with the SAME authorization gates
-- as match_material_chunks (owner teacher / actively-assigned student /
-- admin, READY materials only). Relevance cutoffs stay in application code;
-- authorization stays in SQL. If an embedding provider is configured later,
-- the pgvector path is used and this RPC remains as the offline fallback.

create extension if not exists pg_trgm;

create index if not exists study_material_chunks_text_trgm
  on public.study_material_chunks
  using gin (text gin_trgm_ops);

drop function if exists public.match_material_chunks_lexical(text, uuid, integer);

create or replace function public.match_material_chunks_lexical(
  p_query text,
  p_material_id uuid default null,
  p_limit integer default 8
)
returns table (
  chunk_id uuid,
  material_id uuid,
  material_title text,
  page_number integer,
  chunk_text text,
  similarity real
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
begin
  if v_user is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;
  if p_query is null or char_length(btrim(p_query)) < 2 then
    raise exception 'INVALID_QUERY' using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 20 then
    raise exception 'INVALID_LIMIT' using errcode = '22023';
  end if;

  select role::text into v_role from public.profiles where id = v_user;
  if v_role is null then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    c.id, m.id, m.title, c.page_number, c.text,
    similarity(c.text, p_query) as similarity
  from public.study_material_chunks c
  join public.study_materials m on m.id = c.material_id
  where m.processing_status = 'ready'
    and (p_material_id is null or m.id = p_material_id)
    and (
      m.teacher_id = v_user
      or public.is_admin()
      or (
        v_role = 'student'
        and exists (
          select 1 from public.teacher_student ts
          where ts.teacher_id = m.teacher_id
            and ts.student_id = v_user
            and ts.status = 'active'
        )
      )
    )
  order by similarity(c.text, p_query) desc
  limit p_limit;
end;
$$;

revoke execute on function public.match_material_chunks_lexical(text, uuid, integer) from public, anon;
grant execute on function public.match_material_chunks_lexical(text, uuid, integer) to authenticated;
