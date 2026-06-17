-- ═══════════════════════════════════════════════════════════════
--  ÁLBUM ALMAH — Schema Supabase
--  Execute no Supabase > SQL Editor > New Query
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. PERFIS (vinculados ao auth.users do Supabase)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null,
  created_at  timestamptz default now()
);

-- Cria perfil automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, nome)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 2. COLEÇÃO DE FIGURINHAS
--    Uma linha por figurinha coletada (pode ter várias do mesmo id)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.colecao (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  figurinha_id  int  not null,   -- id do TODOS[] em album.js
  created_at    timestamptz default now()
);

create index if not exists colecao_user_idx on public.colecao(user_id);

-- ──────────────────────────────────────────────────────────────
-- 3. CONTROLE DE PACOTINHOS DIÁRIOS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.pacotes_dia (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  abertos_hoje int         default 0,
  ultimo_reset date        default current_date
);

-- ──────────────────────────────────────────────────────────────
-- 4. TROCAS (sistema de código)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.trocas (
  id              bigserial primary key,
  codigo          text not null unique,
  criador_id      uuid not null references auth.users(id) on delete cascade,
  criador_nome    text not null,
  oferta_id       int  not null,   -- figurinha_id que o criador oferece
  desejo_id       int  not null,   -- figurinha_id que o criador quer
  status          text not null default 'pendente', -- pendente | aceita | cancelada
  aceito_por_id   uuid references auth.users(id),
  created_at      timestamptz default now(),
  expires_at      timestamptz default (now() + interval '24 hours')
);

create index if not exists trocas_codigo_idx on public.trocas(codigo);
create index if not exists trocas_criador_idx on public.trocas(criador_id);

-- ──────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────────

-- profiles: cada um lê/edita só o próprio
alter table public.profiles enable row level security;

create policy "Leitura próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Atualizar próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- colecao: cada um lê/escreve só a própria
alter table public.colecao enable row level security;

create policy "Leitura própria coleção"
  on public.colecao for select
  using (auth.uid() = user_id);

create policy "Inserir na própria coleção"
  on public.colecao for insert
  with check (auth.uid() = user_id);

create policy "Deletar da própria coleção"
  on public.colecao for delete
  using (auth.uid() = user_id);

-- pacotes_dia: cada um lê/escreve só o próprio
alter table public.pacotes_dia enable row level security;

create policy "Leitura próprios pacotes"
  on public.pacotes_dia for select
  using (auth.uid() = user_id);

create policy "Inserir próprios pacotes"
  on public.pacotes_dia for insert
  with check (auth.uid() = user_id);

create policy "Atualizar próprios pacotes"
  on public.pacotes_dia for update
  using (auth.uid() = user_id);

-- trocas: criador vê e altera as suas; qualquer logado lê por código
alter table public.trocas enable row level security;

create policy "Criador gerencia troca"
  on public.trocas for all
  using (auth.uid() = criador_id);

create policy "Qualquer logado lê troca pendente"
  on public.trocas for select
  using (auth.role() = 'authenticated');

create policy "Qualquer logado aceita troca"
  on public.trocas for update
  using (auth.role() = 'authenticated' and status = 'pendente');

-- ──────────────────────────────────────────────────────────────
-- 6. FUNÇÃO: limpar trocas expiradas (rodar via cron ou manualmente)
-- ──────────────────────────────────────────────────────────────
create or replace function public.limpar_trocas_expiradas()
returns void language sql security definer as $$
  update public.trocas
  set status = 'cancelada'
  where status = 'pendente'
    and expires_at < now();
$$;
