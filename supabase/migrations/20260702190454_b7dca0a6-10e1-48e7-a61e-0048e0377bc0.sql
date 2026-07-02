
-- ============================================================
-- STORAGE POLICIES
-- Convenção de path: <cliente_id>/<uuid>-<nome> (exceto videos-sistema/geral)
-- ============================================================

-- audios-cliente
create policy "audios_cliente_admin_all"
  on storage.objects for all to authenticated
  using (bucket_id = 'audios-cliente' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'audios-cliente' and public.has_role(auth.uid(), 'admin'));

create policy "audios_cliente_cliente_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'audios-cliente'
    and public.has_role(auth.uid(), 'cliente')
    and (storage.foldername(name))[1] = public.current_cliente_id()::text
  );

-- videos-sistema (institucional: qualquer autenticado lê; admin escreve)
create policy "videos_sistema_auth_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'videos-sistema');

create policy "videos_sistema_admin_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'videos-sistema' and public.has_role(auth.uid(), 'admin'));

create policy "videos_sistema_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'videos-sistema' and public.has_role(auth.uid(), 'admin'));

create policy "videos_sistema_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'videos-sistema' and public.has_role(auth.uid(), 'admin'));

-- videos-cliente
create policy "videos_cliente_admin_all"
  on storage.objects for all to authenticated
  using (bucket_id = 'videos-cliente' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'videos-cliente' and public.has_role(auth.uid(), 'admin'));

create policy "videos_cliente_cliente_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'videos-cliente'
    and public.has_role(auth.uid(), 'cliente')
    and (storage.foldername(name))[1] = public.current_cliente_id()::text
  );

-- documentos
create policy "documentos_admin_all"
  on storage.objects for all to authenticated
  using (bucket_id = 'documentos' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'documentos' and public.has_role(auth.uid(), 'admin'));

create policy "documentos_cliente_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos'
    and public.has_role(auth.uid(), 'cliente')
    and (storage.foldername(name))[1] = public.current_cliente_id()::text
  );

-- midias-conteudo (admin)
create policy "midias_conteudo_admin_all"
  on storage.objects for all to authenticated
  using (bucket_id = 'midias-conteudo' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'midias-conteudo' and public.has_role(auth.uid(), 'admin'));

-- recursos-marca
create policy "recursos_marca_admin_all"
  on storage.objects for all to authenticated
  using (bucket_id = 'recursos-marca' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'recursos-marca' and public.has_role(auth.uid(), 'admin'));

create policy "recursos_marca_cliente_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'recursos-marca'
    and public.has_role(auth.uid(), 'cliente')
    and (storage.foldername(name))[1] = public.current_cliente_id()::text
  );

-- geral (só admin)
create policy "geral_admin_all"
  on storage.objects for all to authenticated
  using (bucket_id = 'geral' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'geral' and public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- TABELA ARQUIVOS
-- ============================================================
create type public.arquivo_tipo as enum ('audio','video','documento','imagem','design','outro');
create type public.arquivo_contexto as enum ('central_cliente','onboarding_sistema','tarefa','recurso_marca','documento_juridico','geral');

create table public.arquivos (
  id uuid primary key default gen_random_uuid(),
  nome_original text not null,
  nome_storage text not null,
  bucket text not null,
  url_publica text,
  tipo_arquivo public.arquivo_tipo not null default 'outro',
  contexto public.arquivo_contexto not null default 'geral',
  cliente_id uuid references public.clientes(id) on delete set null,
  tarefa_id uuid,
  uploader_id uuid references auth.users(id) on delete set null,
  tamanho_bytes bigint,
  duracao_segundos integer,
  titulo text,
  descricao text,
  visivel_cliente boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.arquivos to authenticated;
grant all on public.arquivos to service_role;

alter table public.arquivos enable row level security;

create policy "arquivos_admin_all"
  on public.arquivos for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "arquivos_cliente_read"
  on public.arquivos for select to authenticated
  using (
    public.has_role(auth.uid(), 'cliente')
    and cliente_id = public.current_cliente_id()
    and visivel_cliente = true
  );

create trigger arquivos_updated_at
  before update on public.arquivos
  for each row execute function public.set_updated_at();

create index arquivos_cliente_idx on public.arquivos(cliente_id);
create index arquivos_contexto_idx on public.arquivos(contexto);
create index arquivos_bucket_idx on public.arquivos(bucket);

-- ============================================================
-- PROGRESSO DE ÁUDIO
-- ============================================================
create table public.progresso_audio (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  arquivo_id uuid not null references public.arquivos(id) on delete cascade,
  posicao_segundos integer not null default 0,
  concluido boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (cliente_id, arquivo_id)
);

grant select, insert, update, delete on public.progresso_audio to authenticated;
grant all on public.progresso_audio to service_role;

alter table public.progresso_audio enable row level security;

create policy "progresso_audio_admin_all"
  on public.progresso_audio for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "progresso_audio_cliente_rw"
  on public.progresso_audio for all to authenticated
  using (public.has_role(auth.uid(), 'cliente') and cliente_id = public.current_cliente_id())
  with check (public.has_role(auth.uid(), 'cliente') and cliente_id = public.current_cliente_id());

create trigger progresso_audio_updated_at
  before update on public.progresso_audio
  for each row execute function public.set_updated_at();
