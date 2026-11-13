# ATSFY MarketLens

India-first product and market intelligence for founders, businesses, investors, researchers and consumers.

## MVP status

The current frontend is an interactive research workspace with product brief capture, category and geography selection, price and source URL capture, and an evidence-readiness checklist. Empty states are intentional: no live launch feed, competitor counts, demand metrics, market-size figures or product coverage are claimed yet.

## Stack

- React + TypeScript + Vite
- Supabase Auth + PostgreSQL + Row Level Security (integration pending)
- Evidence-first research pipeline: source adapters → normalized records → deterministic metrics → AI interpretation
- Free and Premium plans are planned; server-side entitlement enforcement and billing are not implemented yet.

## Local development

```bash
npm install
npm run dev
```

Build and typecheck:

```bash
npm run typecheck
npm run build
```

## Environment

Create `.env.local` only when wiring the dedicated Supabase project:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never expose service-role keys or provider credentials in Vite variables. Privileged writes and ingestion belong in trusted server-side code.

## Evidence states

- **Verified:** checked against a first-party or authoritative source.
- **Observed:** found in a source but not independently verified.
- **Estimated:** calculated from explicit inputs and a disclosed methodology.
- **AI interpretation:** model-generated explanation linked to supporting evidence.
- **Unavailable:** not found or not accessible.

## Data-source policy

Prioritize permitted public sources, official feeds, approved APIs, licensed providers and direct first-party announcements. Respect terms, attribution, rate limits and robots policies. Do not bypass login walls or access controls.

## Roadmap

1. Connect a dedicated Supabase project and review/apply the migration in `supabase/migrations`.
2. Implement authentication, workspace ownership and server-enforced Free/Premium entitlements.
3. Build a source registry and ingestion adapters with attribution, rate limits and deduplication.
4. Add India-wide product discovery, evidence timelines and competitor observations.
5. Add evidence-grounded analysis, comparisons, alerts and report exports.
6. Add billing after usage limits and plans are validated.

## Important limitation

This MVP does not yet discover every product launched in India and does not provide live market coverage. Nationwide discovery requires source integrations, permissions, scheduled ingestion, monitoring and quality review.
