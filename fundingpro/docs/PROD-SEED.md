# Production Convex seed

Fill the live catalog on `fundingpro.uz` (plans, donors, grants). Until seed succeeds, mobile uses demo fallbacks from `mobile/lib/public-fallback.ts`.

## Prerequisites

1. Convex Dashboard → **production** deployment → **Settings** → **Deploy Key** → create or copy key.
2. Add to `fundingpro/.env.production.local` (never commit this file):

```bash
CONVEX_DEPLOY_KEY="prod:…your-key…"
```

Optionally align with the same deployment:

```bash
NEXT_PUBLIC_CONVEX_URL="https://….convex.cloud"
CONVEX_DEPLOYMENT="prod:…"
```

See also `fundingpro/.env.production.example`.

## Run seed

From **monorepo root**:

```bash
npm run convex:seed:prod
```

This runs `npm run convex:seed` in `fundingpro/` (idempotent — skips if donors already exist) and verifies the plans API.

## Verify

```bash
curl -s https://www.fundingpro.uz/api/v1/plans | head -c 500
curl -s https://www.fundingpro.uz/api/v1/donors | head -c 200
curl -s https://www.fundingpro.uz/api/v1/grants | head -c 200
```

Expected after seed:

| Endpoint | Minimum |
|----------|---------|
| `/api/v1/plans` | **6** plans |
| `/api/v1/donors` | **5** donors |
| `/api/v1/grants` | **30** active grants |

Reload the mobile app — DemoBanner «Примеры из каталога» should disappear where live data is returned.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `CONVEX_DEPLOY_KEY is required` | Add key to `.env.production.local` or `export CONVEX_DEPLOY_KEY=…` |
| Plans API still empty after seed | Confirm deploy key targets **production** deployment, not dev |
| Seed skipped | Donors already exist — check Convex dashboard data |
