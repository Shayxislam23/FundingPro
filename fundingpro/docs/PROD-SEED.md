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
| Plan limits mismatch for Consulting | Seed slug is `plan-ngo-consulting` (aligned with `lib/plan-limits.ts`); re-seed or patch slug in Convex if an older `plan-consulting` row exists |

## App Links (web)

Set on **Vercel production** (bundle id defaults from `mobile/app.json`):

| Variable | Purpose |
|----------|---------|
| `APPLE_TEAM_ID` | iOS Universal Links — AASA `appIDs` (10-char Apple Developer Team ID) |
| `ANDROID_RELEASE_SHA256` | Android App Links — release signing cert fingerprint(s), comma-separated |
| `IOS_BUNDLE_ID` | Optional override (default `uz.fundingpro.app`) |
| `ANDROID_PACKAGE` | Optional override (default `uz.fundingpro.app`) |

Routes: `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` read these env vars at runtime. Until set, responses include header `X-App-Links-Config: incomplete`.

Validate locally before Vercel deploy:

```bash
cd fundingpro
npm run app-links:check
SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live
```

See also: [`mobile/docs/EAS-SMOKE.md`](../../mobile/docs/EAS-SMOKE.md), [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md) (M-02).

## Payments gate (before enabling checkout)

Keep **`PAYMENTS_ENABLED=false`** on Vercel until PSP sandbox E2E passes. Full checklist: [`PAYMENTS-OVERVIEW.md`](./PAYMENTS-OVERVIEW.md).

After prod seed succeeds:

```bash
cd fundingpro
npm run payments:golive-check    # env only
npm run deploy:check             # warns on missing PSP / App Links vars
```

Only then set `PAYMENTS_ENABLED=true` on production (see PAYMENTS-OVERVIEW Phase 3).
