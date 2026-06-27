# Uzum Bank: sandbox → production go-live

Checklist for enabling Uzum Merchant + Checkout on FundingPro production. Keep `PAYMENTS_ENABLED=false` until every sandbox step passes.

See also: [POST_UZUM_PILOT.md](./POST_UZUM_PILOT.md) (pilot org onboarding after go-live).

## Phase 1 — Sandbox credentials

1. Obtain from Uzum merchant cabinet:
   - `UZUM_MERCHANT_SERVICE_ID`
   - `UZUM_MERCHANT_LOGIN` / `UZUM_MERCHANT_PASSWORD` (Basic Auth for inbound webhooks)
   - Optional: `UZUM_CHECKOUT_TERMINAL_ID` / `UZUM_CHECKOUT_SECRET` (card checkout)
2. Copy `fundingpro/.env.example` → `.env.local` and fill `UZUM_*` values.
3. Run Convex locally and seed catalog:

```bash
cd fundingpro
npx convex dev          # separate terminal
npm run convex:seed
```

4. Enable payments **only in local/dev** for sandbox:

```bash
PAYMENTS_ENABLED=true npm run uzum:check
PAYMENTS_ENABLED=true npm run uzum:sandbox
PAYMENTS_ENABLED=true npm run uzum:checkout-mock
```

All three must exit 0.

## Phase 2 — Webhook registration

Merchant API endpoints (POST, Basic Auth):

```bash
npm run uzum:webhooks
```

Register each URL in the Uzum merchant cabinet:

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/payments/uzum/check` | Validate order before payment |
| `/api/v1/payments/uzum/create` | Create transaction |
| `/api/v1/payments/uzum/confirm` | Confirm payment → activate subscription |
| `/api/v1/payments/uzum/reverse` | Refund / cancel |
| `/api/v1/payments/uzum/status` | Transaction status |

Production base URL example: `https://www.fundingpro.uz`

Set `UZUM_WEBHOOK_BASE_URL` when printing webhook URLs for a non-default host.

### Optional HMAC hardening

When `UZUM_WEBHOOK_SECRET` is set in Vercel/Convex env:

- Requests must still pass **Basic Auth** (`UZUM_MERCHANT_LOGIN` / `PASSWORD`).
- Requests must include header **`x-uzum-signature`**: hex-encoded HMAC-SHA256 of the **raw JSON body** using the secret.
- Generate secret: `openssl rand -hex 32`
- Leave unset during initial sandbox if Uzum does not send signatures yet.

Also set `CONVEX_DEPLOY_KEY` and `CONVEX_SYSTEM_SECRET` so webhook handlers can write to Convex.

## Phase 3 — Production env (do not enable payments yet)

```bash
npm run deploy:env          # push env to Vercel (keep PAYMENTS_ENABLED=false)
npm run deploy:check
npm run production:readiness
```

Verify on production:

- `GET /api/v1/health` → `payments.enabled: false`
- Legal pages live (`/legal/offer`, `/legal/privacy`, `/legal/refunds`)
- Convex prod seeded (`npm run convex:seed:prod` with `CONVEX_DEPLOY_KEY`)

## Phase 4 — Enable production payments

Only after sandbox E2E is green on a **preview** deployment with real Uzum sandbox credentials:

1. Set `PAYMENTS_ENABLED=true` in Vercel production env.
2. Update Convex `settings.paymentIntegrationStatus` → `active` (admin or seed migration).
3. Set `PAYMENT_INTEGRATION_STATUS=active` in Vercel if used as fallback.
4. Re-run on preview/staging:

```bash
npm run uzum:sandbox
npm run pilot:check
```

5. Smoke one real subscription on preview build (mobile + web checkout return).

## Phase 5 — Post go-live monitoring

| Check | Command / signal |
|-------|------------------|
| Webhook idempotency | Duplicate `confirm` returns success without double activation |
| Payment events | `paymentEvents` table has one row per `transId` + event type |
| Admin report | `/admin/payments` shows enabled status |
| Rollback | Set `PAYMENTS_ENABLED=false`; users see request-subscription fallback |

## Rollback

1. `PAYMENTS_ENABLED=false` in Vercel production.
2. Set Convex `paymentIntegrationStatus` → `pending_integration`.
3. Notify Uzum to pause merchant service if needed.

## Related scripts

| Script | Purpose |
|--------|---------|
| `npm run uzum:check` | Credential + env validation |
| `npm run uzum:sandbox` | Full merchant webhook E2E |
| `npm run uzum:checkout-mock` | Checkout return flow (mock) |
| `npm run uzum:enable` | Local helper to flip PAYMENTS_ENABLED (not for prod files) |
| `npm run pilot:check` | Pilot readiness summary |
