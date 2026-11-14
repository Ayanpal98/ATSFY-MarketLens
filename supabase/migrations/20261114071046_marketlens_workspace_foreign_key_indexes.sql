-- Index workspace foreign keys for joins and RLS checks.
create index if not exists watchlist_items_workspace_id_idx on public.watchlist_items(workspace_id);
create index if not exists competitors_workspace_id_idx on public.competitors(workspace_id);
create index if not exists evidence_sources_workspace_id_idx on public.evidence_sources(workspace_id);
create index if not exists market_signals_workspace_id_idx on public.market_signals(workspace_id);
