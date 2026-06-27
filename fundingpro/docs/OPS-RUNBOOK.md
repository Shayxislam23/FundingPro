# Operations Runbook

Operator checklist for production go-live tasks that require Vercel/Convex/PSP dashboard access. Code and scripts live in-repo; **live verification is required** before closing security findings.

Last updated: 2026-06-27

## Quick reference

| Area | Script / command | Doc section |
|------|------------------|-------------|
| App Links (M-02) | `npm run app-links:check` · `-- --live` | [M-02 App Links](#m-02-app-links-vercel-env--live-check) |
| Convex deploy | `npx convex deploy` | [Convex production deploy](#convex-production-deploy) |
| Account erasure cron | ships in `convex/crons.ts` | [Account erasure cron](#account-erasure-cron-l-02) |
| Payments go-live | `npm run payments:golive-check` | [Payments sandbox → production](#payments-sandbox--production) |

Run all `npm` commands from **`fundingpro/`** unless noted (monorepo root for `npm run convex:seed:prod`).

---

## M-02 App Links (Vercel env + live check)

**Status:** Open — do **not** mark M-02 Resolved in [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md) until live verification passes.

Universal / App Links prevent deep-link hijack on grant URLs. Routes `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` are implemented; production needs Vercel env vars.

### Prerequisites

- Apple Developer Team ID (10 characters).
- Android release keystore SHA-256 fingerprint(s) from EAS or local release build.
- Vercel project linked to `fundingpro` (production + preview as needed).

### Step 1 — Set Vercel environment variables

Vercel Dashboard → Project → **Settings** → **Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `APPLE_TEAM_ID` | **Yes** | Apple Developer Team ID (10 chars) |
| `ANDROID_RELEASE_SHA256` | **Yes** | Release signing cert SHA-256; comma-separated if multiple |
| `IOS_BUNDLE_ID` | No | Default `uz.fundingpro.app` |
| `ANDROID_PACKAGE` | No | Default `uz.fundingpro.app` |

Apply to **Production** (and **Preview** if testing preview URLs). **Redeploy** after saving env vars.

### Step 2 — Local validation (optional, before redeploy)

```bash
cd fundingpro
export APPLE_TEAM_ID="XXXXXXXXXX"
export ANDROID_RELEASE_SHA256="AA:BB:CC:…"
npm run app-links:check
```

Script: `fundingpro/scripts/app-links-check.mjs` (wired as `app-links:check` in `fundingpro/package.json`).

### Step 3 — Live verification (required)

After Vercel redeploy:

```bash
cd fundingpro
SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live
```

**Pass criteria:**

- HTTP 200 on both `.well-known` endpoints.
- Valid JSON (AASA + assetlinks).
- **No** response header `X-App-Links-Config: incomplete`.

### Step 4 — Device smoke (required)

Follow [`mobile/docs/EAS-SMOKE.md`](../../mobile/docs/EAS-SMOKE.md): HTTPS grant link opens the native app (not browser-only).

### Step 5 — Close finding (only after Steps 3–4 pass)

1. Update M-02 status to **Resolved** in [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md).
2. Add to external pen-test scope — [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md).

### M-02 still manual (ops)

- [ ] Set `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256` on Vercel production
- [ ] Redeploy production
- [ ] `app-links:check -- --live` passes
- [ ] Device smoke on physical iOS + Android
- [ ] Mark M-02 Resolved in SECURITY-ROADMAP

---

## Convex production deploy

Deploy backend functions, schema, and crons to the **production** Convex deployment. Use `npx convex dev` for local development only — never `npx convex deploy` against dev casually.

### Prerequisites

1. Convex Dashboard → production deployment → **Settings** → **Deploy Key**.
2. Add to `fundingpro/.env.production.local` (never commit):

```bash
CONVEX_DEPLOY_KEY="prod:…your-key…"
NEXT_PUBLIC_CONVEX_URL="https://….convex.cloud"
CONVEX_DEPLOYMENT="prod:…"
```

See [`fundingpro/.env.production.example`](../.env.production.example) and [`ENV.md`](./ENV.md).

### Step 1 — Pre-deploy checks

From monorepo root (or `fundingpro/`):

```bash
npm run deploy:prep --workspace=fundingpro   # typecheck + tests + lint + deploy:check
```

Or minimum:

```bash
cd fundingpro
npm run typecheck
npm run test:convex
```

### Step 2 — Deploy Convex

```bash
cd fundingpro
export CONVEX_DEPLOY_KEY="prod:…"   # or load from .env.production.local
npx convex deploy
```

This pushes `convex/` (schema, functions, **crons**) to production. CI can use the same command with `CONVEX_DEPLOY_KEY` in GitHub Actions secrets.

Optional build hook (if Next.js build must run first):

```bash
npx convex deploy --cmd 'npm run build'
```

### Step 3 — Seed catalog (if empty prod)

From **monorepo root**:

```bash
npm run convex:seed:prod
```

Details: [`PROD-SEED.md`](./PROD-SEED.md).

### Step 4 — Verify production

```bash
curl -s https://www.fundingpro.uz/api/v1/plans | head -c 500
```

Convex Dashboard → **Logs** / **Crons** — confirm scheduled jobs after deploy.

### Convex deploy still manual (ops)

- [ ] `CONVEX_DEPLOY_KEY` in `.env.production.local` or CI secret
- [ ] `npx convex deploy` from `fundingpro/` after merge/release
- [ ] `npm run convex:seed:prod` if catalog empty
- [ ] `CONVEX_SYSTEM_SECRET` aligned on Vercel + Convex for payment webhooks

---

## Account erasure cron (L-02)

Shipped in-repo; requires **production Convex deploy** to activate on prod.

| File | Role |
|------|------|
| `convex/accountErasure.ts` | `purgeEligibleAccounts` — 30-day grace, cascades applications/documents/storage/push tokens/org memberships/identities, scrubs user PII |
| `convex/crons.ts` | Daily interval → `internal.accountErasure.purgeEligibleAccounts` |

User flow: `POST /api/v1/me/delete-request` sets `deletionRequestedAt`; cron hard-purges after grace.

**Clerk (still manual):** After Convex purge, delete Clerk user via [Clerk Backend API](https://clerk.com/docs/reference/backend-api/tag/Users#operation/DeleteUser) or Dashboard (`clerkId` from audit log).

---

## Payments sandbox → production

Full architecture and per-PSP URLs: [`PAYMENTS-OVERVIEW.md`](./PAYMENTS-OVERVIEW.md) · [Uzum](./UZUM-GO-LIVE.md) · [Payme](./PAYME-GO-LIVE.md) · [Click](./CLICK-GO-LIVE.md).

**Kill switch:** keep `PAYMENTS_ENABLED=false` on Vercel production until sandbox E2E passes on preview.

### Phase 0 — Prerequisites

1. Production Convex seeded — [`PROD-SEED.md`](./PROD-SEED.md).
2. `CONVEX_SYSTEM_SECRET` on **Vercel** and **Convex production** env.
3. Legal pages live: `/legal/offer`, `/legal/privacy`, `/legal/refunds`.

### Phase 1 — Vercel env (payments still disabled)

Set merchant credentials per provider (see `fundingpro/.env.production.example`). Never commit secrets.

```bash
cd fundingpro
npm run deploy:env          # push from .env.production.local — review first
npm run deploy:check
npm run payments:golive-check
```

### Phase 2 — Sandbox E2E (preview or local)

In `.env.local` or Vercel **Preview**:

```bash
PAYMENTS_ENABLED=true
PAYMENT_PROVIDERS=uzum,payme,click
# … UZUM_*, PAYME_*, CLICK_* credentials …
```

Run **in order** (each must exit 0):

```bash
npm run uzum:sandbox
npm run payme:sandbox
npm run click:sandbox
PAYMENTS_ENABLED=true npm run payments:golive-check -- --sandbox
npm run pilot:check
```

Register inbound webhook URLs with each PSP (host `https://www.fundingpro.uz`) — see provider go-live docs.

### Phase 3 — Enable production payments

Only after preview sandbox passes:

1. Set **`PAYMENTS_ENABLED=true`** on Vercel **Production**.
2. Set `PAYME_TEST_MODE=false` for live Payme.
3. Optional: `PAYMENT_INTEGRATION_STATUS=active`.
4. Redeploy.
5. Verify: `SMOKE_BASE_URL=https://www.fundingpro.uz npm run payments:check`.
6. Smoke one subscription per provider on production build.

### Phase 4 — Rollback

1. Set **`PAYMENTS_ENABLED=false`** on Vercel production → redeploy.
2. Verify: `SMOKE_BASE_URL=https://www.fundingpro.uz npm run payments:check` — providers show `enabled: false`.
3. Re-enable only after preview re-run: `PAYMENTS_ENABLED=true npm run payments:golive-check -- --sandbox`.

### Payments still manual (ops)

- [ ] PSP merchant accounts + webhook URLs registered
- [ ] Vercel env for all three providers
- [ ] Sandbox E2E on preview (`payments:golive-check -- --sandbox`)
- [ ] Flip `PAYMENTS_ENABLED=true` on production
- [ ] Production smoke + `/admin/payments` ledger check

---

## Related docs

- [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md) — M-02, L-02 finding status
- [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md)
- [`PROD-SEED.md`](./PROD-SEED.md)
- [`mobile/docs/EAS-SMOKE.md`](../../mobile/docs/EAS-SMOKE.md)
