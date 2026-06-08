create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create type rulebook_source_type as enum ('pdf', 'ocr_text', 'manual_entry');
create type ingestion_status as enum ('queued', 'processing', 'ready', 'failed');
create type graph_node_type as enum ('component', 'action', 'phase', 'resource', 'condition', 'scoring_rule', 'exception', 'term');

create table public.board_games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  year_published integer,
  publisher text,
  designers text[] not null default '{}',
  min_players integer,
  max_players integer,
  min_play_time_minutes integer,
  max_play_time_minutes integer,
  complexity numeric(3, 2),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index board_games_title_trgm_idx on public.board_games using gin (title gin_trgm_ops);
create index board_games_slug_idx on public.board_games (slug);

create table public.rulebooks (
  id uuid primary key default gen_random_uuid(),
  board_game_id uuid not null references public.board_games(id) on delete cascade,
  source_type rulebook_source_type not null,
  source_url text,
  file_name text,
  language_code text not null default 'en',
  version_label text,
  ingestion_status ingestion_status not null default 'queued',
  raw_ocr_text text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rulebooks_board_game_id_idx on public.rulebooks (board_game_id);
create index rulebooks_status_idx on public.rulebooks (ingestion_status);

create table public.rulebook_sections (
  id uuid primary key default gen_random_uuid(),
  rulebook_id uuid not null references public.rulebooks(id) on delete cascade,
  parent_section_id uuid references public.rulebook_sections(id) on delete cascade,
  title text not null,
  section_path text[] not null default '{}',
  page_start integer,
  page_end integer,
  ordinal integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.rulebook_chunks (
  id uuid primary key default gen_random_uuid(),
  rulebook_id uuid not null references public.rulebooks(id) on delete cascade,
  section_id uuid references public.rulebook_sections(id) on delete set null,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  page_number integer,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (rulebook_id, chunk_index)
);

create index rulebook_chunks_rulebook_id_idx on public.rulebook_chunks (rulebook_id);
create index rulebook_chunks_section_id_idx on public.rulebook_chunks (section_id);
create index rulebook_chunks_embedding_idx on public.rulebook_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table public.rulebook_citations (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null references public.rulebook_chunks(id) on delete cascade,
  page_number integer,
  quote text not null,
  bounding_boxes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.rulebook_graph_nodes (
  id uuid primary key default gen_random_uuid(),
  board_game_id uuid not null references public.board_games(id) on delete cascade,
  rulebook_id uuid references public.rulebooks(id) on delete cascade,
  source_chunk_id uuid references public.rulebook_chunks(id) on delete set null,
  node_type graph_node_type not null,
  label text not null,
  canonical_key text not null,
  description text,
  properties jsonb not null default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (board_game_id, canonical_key)
);

create table public.rulebook_graph_edges (
  id uuid primary key default gen_random_uuid(),
  board_game_id uuid not null references public.board_games(id) on delete cascade,
  from_node_id uuid not null references public.rulebook_graph_nodes(id) on delete cascade,
  to_node_id uuid not null references public.rulebook_graph_nodes(id) on delete cascade,
  relationship text not null,
  weight numeric(6, 4) not null default 1,
  source_chunk_id uuid references public.rulebook_chunks(id) on delete set null,
  evidence text,
  properties jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (from_node_id, to_node_id, relationship)
);

create table public.rules_questions (
  id uuid primary key default gen_random_uuid(),
  board_game_id uuid not null references public.board_games(id) on delete cascade,
  question text not null,
  answer text,
  retrieval_context jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.admin_game_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text,
  year_published integer,
  player_count text,
  play_time text,
  complexity text not null check (complexity in ('입문', '중급', '전략')),
  tags text[] not null default '{}',
  summary text not null,
  rulebook_pdf_url text,
  ocr_text text,
  status text not null default '요청됨' check (status in ('요청됨', '검토 중', '등록 완료')),
  created_at timestamptz not null default now()
);

create index admin_game_requests_status_idx on public.admin_game_requests (status);
create index admin_game_requests_created_at_idx on public.admin_game_requests (created_at desc);

create or replace function public.match_rulebook_chunks(
  query_embedding vector(1536),
  match_board_game_id uuid,
  match_count integer default 8
)
returns table (
  chunk_id uuid,
  rulebook_id uuid,
  section_id uuid,
  content text,
  page_number integer,
  similarity double precision
)
language sql
stable
as $$
  select
    rc.id as chunk_id,
    rc.rulebook_id,
    rc.section_id,
    rc.content,
    rc.page_number,
    1 - (rc.embedding <=> query_embedding) as similarity
  from public.rulebook_chunks rc
  join public.rulebooks rb on rb.id = rc.rulebook_id
  where rb.board_game_id = match_board_game_id
    and rc.embedding is not null
  order by rc.embedding <=> query_embedding
  limit match_count;
$$;
