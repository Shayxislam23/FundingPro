# Payments Overview — Uzum, Payme, Click

FundingPro поддерживает три платёжных провайдера в Узбекистане. Пользователь выбирает провайдера на экране подписки (web + mobile).

## Architecture

```
Client → POST /payments/intent?provider=
       → ProviderRegistry → adapter (uzum | payme | click)
Inbound:
  Uzum  → /api/v1/payments/uzum/*
  Payme → /api/v1/payments/payme (JSON-RPC)
  Click → /api/v1/payments/click/prepare|complete
Convex:
  payments + paymentEvents
  uzumTransactions | paymeTransactions | clickTransactions
Activation: activateSubscriptionFromPayment (single path)
```

## Provider comparison

| | Uzum | Payme | Click |
|---|------|-------|-------|
| Protocol | Merchant REST | JSON-RPC 2.0 | SHOP Prepare/Complete |
| Mobile | App deep link + card checkout | Payme checkout URL | Click SuperApp URL |
| Env prefix | `UZUM_*` | `PAYME_*` | `CLICK_*` |
| Go-live doc | [UZUM-GO-LIVE.md](./UZUM-GO-LIVE.md) | [PAYME-GO-LIVE.md](./PAYME-GO-LIVE.md) | [CLICK-GO-LIVE.md](./CLICK-GO-LIVE.md) |
| Sandbox | `npm run uzum:sandbox` | `npm run payme:sandbox` | `npm run click:sandbox` |

## Configuration

```bash
PAYMENTS_ENABLED=false          # keep false until sandbox E2E passes
PAYMENT_PROVIDERS=uzum,payme,click
CONVEX_SYSTEM_SECRET=…          # required when PAYMENTS_ENABLED=true (webhooks → Convex)
```

`GET /api/v1/payments/status` → `providers[]` with `{ id, enabled, configured, label, methods[] }`.

## Health checks

```bash
npm run payments:check          # env + /payments/status (all 3 providers)
npm run payments:golive-check   # go-live gate + Vercel checklist
PAYMENTS_ENABLED=true npm run payments:golive-check -- --sandbox   # run sandbox E2E in order
npm run pilot:check             # typecheck + deploy + payments + per-provider sandbox
npm run deploy:check            # warns if PAYMENTS_ENABLED or App Links vars missing
```

## GO-LIVE checklist (Vercel + sandbox order)

**Do not set real merchant secrets in git.** Copy from PSP cabinets into Vercel Dashboard → Settings → Environment Variables (Production + Preview as needed).

### Phase 0 — Prerequisites

1. Production Convex seeded — [`PROD-SEED.md`](./PROD-SEED.md) (`npm run convex:seed:prod` with `CONVEX_DEPLOY_KEY`).
2. `CONVEX_SYSTEM_SECRET` on Vercel **and** Convex production env (payment webhooks).
3. Legal pages live: `/legal/offer`, `/legal/privacy`, `/legal/refunds`.
4. Keep **`PAYMENTS_ENABLED=false`** on production until Phase 3 passes on preview.

### Phase 1 — Vercel env (all providers, payments still disabled)

Set in Vercel (see `fundingpro/.env.production.example`):

| Variable | Uzum | Payme | Click |
|----------|------|-------|-------|
| Merchant IDs / keys | `UZUM_MERCHANT_*`, optional `UZUM_CHECKOUT_*` | `PAYME_MERCHANT_ID`, `PAYME_MERCHANT_KEY` | `CLICK_MERCHANT_ID`, `CLICK_SERVICE_ID`, `CLICK_SECRET_KEY` |
| Shared | `PAYMENT_PROVIDERS=uzum,payme,click`, `USD_UZS_RATE`, `NEXT_PUBLIC_APP_URL` | `PAYME_TEST_MODE=true` on preview | optional `CLICK_MERCHANT_USER_ID` |

Push env locally for review:

```bash
cd fundingpro
npm run deploy:env          # from .env.production.local — never commit secrets
npm run deploy:check
npm run payments:golive-check
```

### Phase 2 — Sandbox E2E (local or preview, order: **uzum → payme → click**)

In `fundingpro/.env.local` (or preview env):

```bash
PAYMENTS_ENABLED=true
PAYMENT_PROVIDERS=uzum,payme,click
# … all PSP credentials …
```

Run in order (each must exit 0):

```bash
npm run uzum:sandbox
npm run payme:sandbox
npm run click:sandbox
npm run payments:golive-check -- --sandbox
npm run pilot:check
```

Register inbound URLs with each PSP (production host `https://www.fundingpro.uz`):

- **Uzum:** `npm run uzum:webhooks` — see [UZUM-GO-LIVE.md](./UZUM-GO-LIVE.md)
- **Payme:** `POST /api/v1/payments/payme` — see [PAYME-GO-LIVE.md](./PAYME-GO-LIVE.md)
- **Click:** `/api/v1/payments/click/prepare|complete` — see [CLICK-GO-LIVE.md](./CLICK-GO-LIVE.md)

### Phase 3 — Enable production payments

Only after preview smoke with sandbox credentials:

1. Set **`PAYMENTS_ENABLED=true`** on Vercel production.
2. Set `PAYME_TEST_MODE=false` for live Payme.
3. Set `PAYMENT_INTEGRATION_STATUS=active` (optional fallback).
4. Re-run `npm run payments:check` against production (`SMOKE_BASE_URL=https://www.fundingpro.uz`).
5. Smoke one subscription per provider on preview/production build.

### Phase 4 — Monitoring

| Check | Command |
|-------|---------|
| Provider status | `SMOKE_BASE_URL=https://www.fundingpro.uz npm run payments:check` |
| Admin ledger | `/admin/payments` |
| Idempotency | duplicate webhook must not double-activate |

## Legal

Оферта и политика возвратов упоминают Uzum Bank, Payme и Click как PSP. FundingPro не хранит данные карт.
