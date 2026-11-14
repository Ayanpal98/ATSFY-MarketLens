-- MarketLens core schema: personal workspaces, research and ownership controls.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.research_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text not null check (char_length(title) between 1 and 240),
  product_name text,
  status text not null default 'draft' check (status in ('draft','in_progress','complete','archived')),
  report_content jsonb not null default '{}'::jsonb check (jsonb_typeof(report_content) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  entity_type text not null check (entity_type in ('product','company','launch','market_signal')),
  external_id text,
  title text not null check (char_length(title) between 1 and 240),
  source_url text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create unique index watchlist_items_owner_entity_unique
  on public.watchlist_items(owner_id, entity_type, coalesce(external_id, title));
create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  website text,
  notes text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.evidence_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text not null check (char_length(title) between 1 and 240),
  source_url text not null,
  source_type text not null default 'user_provided' check (source_type in ('official','news','company','research','user_provided','other')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','rejected')),
  observed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create table public.market_signals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text not null check (char_length(title) between 1 and 240),
  summary text,
  signal_type text not null default 'market_observation' check (signal_type in ('launch','competitor_move','market_gap','market_observation','regulatory')),
  evidence_status text not null default 'hypothesis' check (evidence_status in ('hypothesis','observed','verified','disputed')),
  source_ids uuid[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workspaces_owner_id_idx on public.workspaces(owner_id);
create index research_reports_owner_updated_idx on public.research_reports(owner_id, updated_at desc);
create index research_reports_workspace_idx on public.research_reports(workspace_id);
create index watchlist_items_owner_created_idx on public.watchlist_items(owner_id, created_at desc);
create index competitors_owner_idx on public.competitors(owner_id);
create index evidence_sources_owner_idx on public.evidence_sources(owner_id);
create index market_signals_owner_created_idx on public.market_signals(owner_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.research_reports enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.competitors enable row level security;
alter table public.evidence_sources enable row level security;
alter table public.market_signals enable row level security;

revoke all on public.profiles, public.workspaces, public.research_reports, public.watchlist_items, public.competitors, public.evidence_sources, public.market_signals from anon;
grant select, insert, update, delete on public.profiles, public.workspaces, public.research_reports, public.watchlist_items, public.competitors, public.evidence_sources, public.market_signals to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "workspaces_select_own" on public.workspaces for select to authenticated using ((select auth.uid()) = owner_id);
create policy "workspaces_insert_own" on public.workspaces for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "workspaces_update_own" on public.workspaces for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "workspaces_delete_own" on public.workspaces for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "reports_select_own" on public.research_reports for select to authenticated using ((select auth.uid()) = owner_id);
create policy "reports_insert_own" on public.research_reports for insert to authenticated with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "reports_update_own" on public.research_reports for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "reports_delete_own" on public.research_reports for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "watchlist_select_own" on public.watchlist_items for select to authenticated using ((select auth.uid()) = owner_id);
create policy "watchlist_insert_own" on public.watchlist_items for insert to authenticated with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "watchlist_update_own" on public.watchlist_items for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "watchlist_delete_own" on public.watchlist_items for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "competitors_select_own" on public.competitors for select to authenticated using ((select auth.uid()) = owner_id);
create policy "competitors_insert_own" on public.competitors for insert to authenticated with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "competitors_update_own" on public.competitors for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "competitors_delete_own" on public.competitors for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "evidence_select_own" on public.evidence_sources for select to authenticated using ((select auth.uid()) = owner_id);
create policy "evidence_insert_own" on public.evidence_sources for insert to authenticated with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "evidence_update_own" on public.evidence_sources for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "evidence_delete_own" on public.evidence_sources for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "signals_select_own" on public.market_signals for select to authenticated using ((select auth.uid()) = owner_id);
create policy "signals_insert_own" on public.market_signals for insert to authenticated with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "signals_update_own" on public.market_signals for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id and (workspace_id is null or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = (select auth.uid()))));
create policy "signals_delete_own" on public.market_signals for delete to authenticated using ((select auth.uid()) = owner_id);
