-- ATSFY MarketLens core schema
-- Apply only to the dedicated MarketLens Supabase project after review.
create extension if not exists pgcrypto;

create table if not exists public.ml_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','premium')),
  created_at timestamptz not null default now()
);

create table if not exists public.ml_workspace_members (
  workspace_id uuid not null references public.ml_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','analyst','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table if not exists public.ml_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.ml_workspaces(id) on delete cascade,
  name text not null,
  brand text,
  category text,
  description text,
  country_code char(2) not null default 'IN',
  product_url text,
  price_amount numeric(14,2),
  price_currency char(3) not null default 'INR',
  launch_date date,
  record_status text not null default 'user_submitted' check (record_status in ('user_submitted','observed','verified','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ml_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.ml_products(id) on delete cascade,
  source_url text not null,
  publisher text,
  source_type text not null default 'web',
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  verification_status text not null default 'observed' check (verification_status in ('verified','observed','rejected')),
  evidence_note text,
  created_at timestamptz not null default now(),
  unique(product_id,source_url)
);

create table if not exists public.ml_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.ml_products(id) on delete cascade,
  source_id uuid references public.ml_sources(id) on delete set null,
  metric_key text not null,
  metric_value numeric(18,4),
  metric_unit text,
  geography text not null default 'India',
  observed_at timestamptz not null default now(),
  methodology text,
  confidence text not null default 'low' check (confidence in ('low','medium','high')),
  created_at timestamptz not null default now()
);

create table if not exists public.ml_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.ml_workspaces(id) on delete cascade,
  product_id uuid references public.ml_products(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  analysis_version text not null default 'v1',
  facts jsonb not null default '[]'::jsonb,
  estimates jsonb not null default '[]'::jsonb,
  interpretations jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ml_watchlists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.ml_workspaces(id) on delete cascade,
  product_id uuid not null references public.ml_products(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(workspace_id,product_id,created_by)
);

create index if not exists ml_products_name_idx on public.ml_products using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(brand,'')));
create index if not exists ml_products_category_idx on public.ml_products(category,country_code);
create index if not exists ml_sources_product_idx on public.ml_sources(product_id,retrieved_at desc);
create index if not exists ml_observations_product_metric_idx on public.ml_observations(product_id,metric_key,observed_at desc);
create index if not exists ml_analysis_workspace_idx on public.ml_analysis_runs(workspace_id,created_at desc);

alter table public.ml_workspaces enable row level security;
alter table public.ml_workspace_members enable row level security;
alter table public.ml_products enable row level security;
alter table public.ml_sources enable row level security;
alter table public.ml_observations enable row level security;
alter table public.ml_analysis_runs enable row level security;
alter table public.ml_watchlists enable row level security;

-- Workspace members can read their own workspace; creation is owner-only.
create policy "workspace members can read workspace" on public.ml_workspaces
for select to authenticated using (
  exists (select 1 from public.ml_workspace_members m where m.workspace_id = id and m.user_id = auth.uid())
);
create policy "users can create own workspace" on public.ml_workspaces
for insert to authenticated with check (owner_id = auth.uid());
create policy "members can read membership" on public.ml_workspace_members
for select to authenticated using (user_id = auth.uid());
create policy "users can join own membership" on public.ml_workspace_members
for insert to authenticated with check (user_id = auth.uid() and exists (
  select 1 from public.ml_workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
));

create policy "members can read workspace products" on public.ml_products
for select to authenticated using (
  workspace_id is not null and exists (select 1 from public.ml_workspace_members m where m.workspace_id = ml_products.workspace_id and m.user_id = auth.uid())
);
create policy "members can create workspace products" on public.ml_products
for insert to authenticated with check (
  created_by = auth.uid() and workspace_id is not null and exists (select 1 from public.ml_workspace_members m where m.workspace_id = ml_products.workspace_id and m.user_id = auth.uid() and m.role in ('owner','admin','analyst','member'))
);
create policy "members can update workspace products" on public.ml_products
for update to authenticated using (
  workspace_id is not null and exists (select 1 from public.ml_workspace_members m where m.workspace_id = ml_products.workspace_id and m.user_id = auth.uid() and m.role in ('owner','admin','analyst','member'))
) with check (
  workspace_id is not null and exists (select 1 from public.ml_workspace_members m where m.workspace_id = ml_products.workspace_id and m.user_id = auth.uid() and m.role in ('owner','admin','analyst','member'))
);

create policy "members can read product sources" on public.ml_sources
for select to authenticated using (exists (
  select 1 from public.ml_products p join public.ml_workspace_members m on m.workspace_id = p.workspace_id
  where p.id = ml_sources.product_id and m.user_id = auth.uid()
));
create policy "members can read observations" on public.ml_observations
for select to authenticated using (exists (
  select 1 from public.ml_products p join public.ml_workspace_members m on m.workspace_id = p.workspace_id
  where p.id = ml_observations.product_id and m.user_id = auth.uid()
));
create policy "members can read analysis runs" on public.ml_analysis_runs
for select to authenticated using (exists (
  select 1 from public.ml_workspace_members m where m.workspace_id = ml_analysis_runs.workspace_id and m.user_id = auth.uid()
));
create policy "members can create analysis runs" on public.ml_analysis_runs
for insert to authenticated with check (
  requested_by = auth.uid() and exists (select 1 from public.ml_workspace_members m where m.workspace_id = ml_analysis_runs.workspace_id and m.user_id = auth.uid())
);
create policy "members can read watchlists" on public.ml_watchlists
for select to authenticated using (exists (
  select 1 from public.ml_workspace_members m where m.workspace_id = ml_watchlists.workspace_id and m.user_id = auth.uid()
));
create policy "members can manage own watchlist" on public.ml_watchlists
for all to authenticated using (
  created_by = auth.uid() and exists (select 1 from public.ml_workspace_members m where m.workspace_id = ml_watchlists.workspace_id and m.user_id = auth.uid())
) with check (
  created_by = auth.uid() and exists (select 1 from public.ml_workspace_members m where m.workspace_id = ml_watchlists.workspace_id and m.user_id = auth.uid())
);

-- Source and observation writes are intentionally reserved for trusted ingestion services.
revoke insert, update, delete on public.ml_sources from anon, authenticated;
revoke insert, update, delete on public.ml_observations from anon, authenticated;
