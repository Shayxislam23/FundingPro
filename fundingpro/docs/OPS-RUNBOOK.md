# Operations Runbook

Operator checklist for production go-live tasks that require Vercel/Convex/PSP dashboard access. Code and scripts live in-repo; **live verification is required** before closing security findings.

Last updated: 2026-07-10

## CI and production deploy gate

| Workflow | File | When it runs |
|----------|------|--------------|
| CI | `.github/workflows/main-ci.yml` | push/PR main; `production-deploy-check` only on push to main |
| Release Gate | `.github/workflows/release-gate.yml` | push main, every 6h schedule, manual dispatch |

**Production gate checks (live):** health, AASA 200/json, individuals-first landing copy, API smoke, App Links (warning-only until env complete).

**Blockers (human):**
1. GitHub billing lock — [github.com/settings/billing](https://github.com/settings/billing)
2. Vercel Git reconnect — see [ACCESS_NEEDED.md](../../ACCESS_NEEDED.md) §3b and [DOMAIN-STRATEGY.md](./DOMAIN-STRATEGY.md)
3. App Links env — `bash paste-secrets.sh` from repo root

**Canonical domain:** [DOMAIN-STRATEGY.md](./DOMAIN-STRATEGY.md) — always use `https://www.fundingpro.uz` for smoke / App Links / content-check.

**After billing unblock:**
```bash
gh workflow run main-ci.yml --ref main
gh workflow run release-gate.yml --ref main
gh run watch
cd fundingpro
PROD_BASE_URL=https://www.fundingpro.uz npm run prod:content-check
SMOKE_BASE_URL=https://www.fundingpro.uz npm run test:smoke
SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live
```

**Ghost workflow:** `BuildFailed` (deleted) may still send empty-name failure emails — disable in GitHub Notifications.

---

```bash
cd fundingpro
npm run ops:readiness          # deploy:check + app-links (local) + payments:golive (dry)
npm run ops:readiness -- --strict   # fail on app-links warnings too
```

Prints manual O1–O4 steps you must complete in Vercel / Convex / PSP dashboards.

## Quick reference

| Area | Script / command | Doc section |
|------|------------------|-------------|
| **Ops gate** | `npm run ops:readiness` | [One-command gate](#one-command-in-repo-gate) |
| App Links (M-02) | `npm run app-links:check` · `-- --live` | [M-02 App Links](#m-02-app-links-vercel-env--live-check) |
| Convex deploy | `npx convex deploy` | [Convex production deploy](#convex-production-deploy) |
| Account erasure cron | ships in `convex/crons.ts` | [Account erasure cron](#account-erasure-cron-l-02) |
| Payments go-live | `npm run payments:golive` (alias: `payments:golive-check`) | [Payments sandbox → production](#payments-sandbox--production) |
| Incident response | — | [Incident response](#incident-response) |
| Pen-test | [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md) | [Monitoring & pen-test](#monitoring--pen-test-s4) |

Run all `npm` commands from **`fundingpro/`** unless noted (monorepo root for `npm run convex:seed:prod`).

---

## O1 — Vercel environment (checklist)

Use this when onboarding production or after rotating secrets.

- [ ] **1.** Copy `fundingpro/.env.production.example` → `.env.production.local` (never commit)
- [ ] **2.** Set **required** vars: `NEXT_PUBLIC_CONVEX_URL`, Clerk keys, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- [ ] **3.** Set **recommended**: `ADMIN_EMAILS`, `NEXT_PUBLIC_APP_URL`, `CLERK_JWT_ISSUER_DOMAIN`, `CONVEX_DEPLOY_KEY`, `CONVEX_SYSTEM_SECRET`
- [ ] **4.** App Links (M-02): `APPLE_TEAM_ID`, `ANDROID_RELEASE_SHA256` on **Production** (+ Preview if testing)
- [ ] **4b.** Vercel monorepo: Root Directory **`.`** + root `vercel.json` (`npm ci`) **or** Root Directory `fundingpro` + `fundingpro/vercel.json` (`npm install`) — see [ACCESS_NEEDED.md](../../ACCESS_NEEDED.md) §3b
- [ ] **5.** Payments: set PSP credentials; keep **`PAYMENTS_ENABLED=false`** until O4 sandbox passes
- [ ] **6.** Run `npm run deploy:check` — fix any `MISSING` lines
- [ ] **7.** Run `npm run deploy:env` — review diff before pushing to Vercel
- [ ] **8.** Redeploy production (or `vercel --prod`)

Verify:

```bash
cd fundingpro
npm run deploy:check
npm run ops:readiness
```

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

## O2 — Convex production deploy (checklist)

- [ ] **1.** Convex Dashboard → production deployment → **Deploy Key** → save as `CONVEX_DEPLOY_KEY`
- [ ] **2.** Align `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` in `.env.production.local`
- [ ] **3.** Set `CONVEX_SYSTEM_SECRET` on **both** Convex production env and Vercel (payment webhooks)
- [ ] **4.** `npm run deploy:prep --workspace=fundingpro` or minimum: `typecheck` + `test:convex`
- [ ] **5.** `cd fundingpro && npx convex deploy` (never use `deploy` for local dev iteration)
- [ ] **6.** `npm run convex:seed:prod` from monorepo root if catalog empty — [`PROD-SEED.md`](./PROD-SEED.md)
- [ ] **7.** Convex Dashboard → **Logs** / **Crons** — confirm daily account erasure cron registered
- [ ] **8.** Smoke: `curl -s https://www.fundingpro.uz/api/v1/plans | head -c 500`

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

## O4 — PSP sandbox → production (checklist)

- [ ] **1.** Production Convex seeded — [`PROD-SEED.md`](./PROD-SEED.md)
- [ ] **2.** `CONVEX_SYSTEM_SECRET` on Vercel + Convex production
- [ ] **3.** Legal pages live: `/legal/offer`, `/legal/privacy`, `/legal/refunds`
- [ ] **4.** Register inbound webhook URLs with Uzum, Payme, Click (host `https://www.fundingpro.uz`)
- [ ] **5.** Vercel **Preview**: `PAYMENTS_ENABLED=true`, provider credentials
- [ ] **6.** `PAYMENTS_ENABLED=true npm run payments:golive -- --sandbox` (exit 0)
- [ ] **7.** In order: `uzum:sandbox` → `payme:sandbox` → `click:sandbox` (each exit 0)
- [ ] **8.** `npm run pilot:check`
- [ ] **9.** Flip **`PAYMENTS_ENABLED=true`** on Vercel **Production** only after step 6–7 pass
- [ ] **10.** Redeploy → `SMOKE_BASE_URL=https://www.fundingpro.uz npm run payments:check`
- [ ] **11.** Smoke one subscription per provider; verify `/admin/payments` ledger

Provider docs: [`UZUM-GO-LIVE.md`](./UZUM-GO-LIVE.md) · [`PAYME-GO-LIVE.md`](./PAYME-GO-LIVE.md) · [`CLICK-GO-LIVE.md`](./CLICK-GO-LIVE.md)

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

## Incident response

Use when production is degraded, payments misbehave, or a security event is suspected.

### Severity guide

| Level | Examples | First action |
|-------|----------|--------------|
| **SEV-1** | Payment double-charge, data leak, auth bypass | Kill payments + page on-call |
| **SEV-2** | 5xx spike, webhook failures, Convex deploy bad | Rollback deploy / disable payments |
| **SEV-3** | Single provider down, rate limit noise | Provider-specific disable |

### 1. Payments kill switch (fastest mitigation)

When checkout or webhooks behave incorrectly:

1. Vercel Dashboard → **Environment Variables** → set **`PAYMENTS_ENABLED=false`** on Production.
2. **Redeploy** production (env change alone may not apply until redeploy).
3. Verify:

```bash
cd fundingpro
SMOKE_BASE_URL=https://www.fundingpro.uz npm run payments:check
# Each provider should show enabled: false
```

4. Communicate to support: subscriptions paused; no new checkouts until re-enabled.
5. Root-cause on **Preview** with `PAYMENTS_ENABLED=true npm run payments:golive -- --sandbox`.

See [Phase 4 — Rollback](#phase-4--rollback) under Payments.

### 2. Vercel / Next.js rollback

1. Vercel Dashboard → **Deployments** → select last known-good deployment → **Promote to Production**.
2. Or redeploy previous git tag: `git checkout <tag> && vercel --prod` (from `fundingpro/`).
3. Confirm headers and API: `npm run security:probe:prod`.
4. If bad env var caused incident, revert in Vercel env **before** promote.

### 3. Convex rollback

Convex does not auto-rollback schema. Options:

1. **Revert code** — `git revert` the bad commit, then `npx convex deploy` from `fundingpro/` with production `CONVEX_DEPLOY_KEY`.
2. **Dashboard** — Convex → **Functions** → compare deployment history; redeploy prior bundle if available.
3. **Data** — if migration corrupted data, restore from Convex backup/export (Dashboard → **Backups**) — contact Convex support for P0.

After rollback:

- [ ] `curl -s https://www.fundingpro.uz/api/v1/health`
- [ ] Convex Dashboard → **Logs** — error rate normal
- [ ] Crons still scheduled (`accountErasure`, etc.)

### 4. Clerk / auth incidents

- Mass lockout: check Clerk status page; verify `CLERK_SECRET_KEY` / JWT issuer not rotated without Convex sync.
- Compromised admin: rotate `CLERK_SECRET_KEY`, audit `ADMIN_EMAILS`, review Clerk Dashboard → **Sessions** → revoke.

### 5. Communication template

```
Incident: [summary]
Impact: [checkout down / API errors / …]
Mitigation: PAYMENTS_ENABLED=false | Vercel rollback | Convex redeploy
ETA: [investigating / fix in deploy XYZ]
```

### 6. Post-incident

- [ ] Update [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md) if new finding
- [ ] Re-run `npm run security:audit` and `npm run security:probe:prod`
- [ ] Add regression test or runbook note if gap found

---

## Monitoring & pen-test (S4)

### Ongoing monitoring

| Signal | Where | Action |
|--------|-------|--------|
| API 5xx | Vercel Analytics / Logs | Rollback or Convex redeploy |
| Convex errors | Convex Dashboard → Logs | Function-level fix + deploy |
| Payment webhooks | `/admin/payments`, PSP dashboards | Kill switch if duplicate charges |
| Rate limits | 429 on `/api/v1/ai/*` | Expected under abuse; tune buckets |
| Crons | Convex → Crons | Account erasure must run daily |

Weekly (automated in CI):

```bash
cd fundingpro
npm run security:audit
npm audit
```

Production probes (read-only):

```bash
npm run security:probe:prod
```

### External pen-test

Run **after** M-02 App Links live and PSP sandbox E2E pass.

Full scope: [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md)

Minimum sign-off before launch:

- [ ] `npm run app-links:check -- --live` passes
- [ ] `npm run security:probe:prod` — no unexpected 5xx on public routes
- [ ] Payments webhook replay + signature tests (checklist §2)
- [ ] API auth matrix (checklist §1) — see [`API-SECURITY.md`](./API-SECURITY.md)

---

## Related docs

- [`API-SECURITY.md`](./API-SECURITY.md) — route wrappers, custom auth, Convex patterns
- [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md) — M-02, L-02 finding status
- [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md)
- [`PROD-SEED.md`](./PROD-SEED.md)
- [`mobile/docs/EAS-SMOKE.md`](../../mobile/docs/EAS-SMOKE.md)
