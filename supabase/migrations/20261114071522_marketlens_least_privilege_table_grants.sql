-- Restrict API roles to only the operations required by the application.
revoke all privileges on public.profiles, public.workspaces, public.research_reports, public.watchlist_items, public.competitors, public.evidence_sources, public.market_signals from public, anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces, public.research_reports, public.watchlist_items, public.competitors, public.evidence_sources, public.market_signals to authenticated;
