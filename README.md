# ATSFY MarketLens

India-first product and market intelligence for founders, businesses, investors, researchers and consumers.

## MVP status

The React + TypeScript workspace now includes email/password authentication, a dedicated Supabase backend, persistent research report scaffolds, a private watchlist, manual competitor entry and user-provided evidence URL capture. Workspace records are protected by PostgreSQL Row Level Security.

The frontend includes illustrative launch examples and opportunity hypotheses only. There is no live launch feed, competitor discovery feed, independently verified demand data, market-size dataset or production ingestion pipeline yet.

## Stack

- React + TypeScript + Vite
- Supabase Auth + PostgreSQL + Row Level Security
- Evidence-first research pipeline: source adapters → normalized records → deterministic metrics → AI interpretation (pipeline planned; no live ingestion yet)
- Free and Premium plans are planned; billing and server-side entitlement enforcement are not implemented.

## Local development

\`\`\`bash
npm install
npm run dev
\`\`\`

Build and typecheck:

\`\`\`bash
npm run typecheck
npm run build
\`\`\`

## Environment

Configure the dedicated MarketLens Supabase project in Vercel or .env.local:

\`\`\`bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
\`\`\`

The browser uses the Supabase publishable key. Never expose service-role keys or provider credentials in Vite variables. Privileged writes and ingestion belong in trusted server-side code.

## Database migrations

Applied migrations are tracked in supabase/migrations:

- 20261114071038_marketlens_core_workspace_research_rls.sql — profiles, workspaces, reports, watchlist, competitors, evidence sources, market signals, ownership policies and indexes.
- 20261114071046_marketlens_workspace_foreign_key_indexes.sql — workspace relationship indexes.
- 20261114071534_marketlens_least_privilege_table_grants.sql — least-privilege API grants.

All seven public tables have RLS enabled. Anonymous table privileges are revoked; authenticated users receive only the required CRUD permissions, with row-level ownership checks. Security advisor currently reports no findings.

## Evidence states

- **Verified:** checked against a first-party or authoritative source.
- **Observed:** found in a source but not independently verified.
- **Estimated:** calculated from explicit inputs and a disclosed methodology.
- **AI interpretation:** model-generated explanation linked to supporting evidence.
- **Unavailable:** not found or not accessible.

## Data-source policy

Prioritize permitted public sources, official feeds, approved APIs, licensed providers and direct first-party announcements. Respect terms, attribution, rate limits and robots policies. Do not bypass login walls or access controls.

## Roadmap

1. Complete end-to-end authentication and account workflow testing.
2. Add saved competitor and evidence-source browsing/editing screens.
3. Build a source registry and ingestion adapters with attribution, rate limits and deduplication.
4. Add India-wide product discovery, evidence timelines and competitor observations.
5. Add evidence-grounded analysis, comparisons, alerts and report exports.
6. Add billing after usage limits and plans are validated.

## Important limitation

This MVP does not yet discover every product launched in India and does not provide live market coverage. Nationwide discovery requires source integrations, permissions, scheduled ingestion, monitoring and quality review. Reports generated from the current research form are structured scaffolds, not independently verified market research.
