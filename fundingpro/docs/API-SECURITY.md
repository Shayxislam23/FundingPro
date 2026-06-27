# API Security

Route-level auth wrappers, CORS, rate limits, and payment merchant boundaries for FundingPro custom API routes.

## Auth wrappers (`lib/api-route.ts`)

| Wrapper | Auth | Account status | Use when |
|---------|------|----------------|----------|
| `withPublic` | None | N/A | Public read/write endpoints (health, legal, lead capture) |
| `withActiveUser` | Clerk / Bearer JWT | Active, not banned | User-scoped resources |
| `withAdmin` | Clerk / Bearer JWT | Active + admin allowlist | Admin dashboard APIs |
| `withPaymentWebhook` | None (alias of `withPublic`) | N/A | Deprecated or provider callback stubs |

All wrappers apply CORS from `CORS_ALLOWED_ORIGINS` (`lib/api-cors.ts`) and handle `OPTIONS` preflight.

## Custom route matrix

Routes that do **not** use standard wrappers rely on **provider-specific auth** (merchant Basic auth, HMAC, or RPC credentials). Document and review these separately.

| Route | Wrapper / auth model | Notes |
|-------|----------------------|-------|
| `GET /api/v1/health` | `withPublic` | Production omits `database.error`, AI provider, payment integration details |
| `GET /api/v1/auth/admin-check` | `withActiveUser` | Banned/disabled accounts rejected; returns `{ isAdmin }` for active users |
| `POST /api/v1/lead-magnet` | `withPublic` | IP rate limit (edge + Convex `rate_limit_buckets`) |
| `GET /api/v1/payments/status` | `withPublic` | Public UI flags only; edge rate limited |
| `POST /api/v1/payments/webhook` | `withPaymentWebhook` | Deprecated (410); edge rate limited |
| `POST /api/v1/payments/payme` | **Merchant** — Payme Basic auth | `validatePaymeBasicAuth` in route |
| `POST /api/v1/payments/click/prepare` | **Merchant** — Click signature | Provider auth in `lib/payments/providers/click/` |
| `POST /api/v1/payments/click/complete` | **Merchant** — Click signature | Provider auth in `lib/payments/providers/click/` |
| `POST /api/v1/payments/uzum/check` | **Merchant** — Uzum Basic auth | `lib/payments/uzum-auth.ts` |
| `POST /api/v1/payments/uzum/create` | **Merchant** — Uzum Basic auth | Same |
| `POST /api/v1/payments/uzum/confirm` | **Merchant** — Uzum Basic auth | Same |
| `POST /api/v1/payments/uzum/reverse` | **Merchant** — Uzum Basic auth | Same |
| `POST /api/v1/payments/uzum/status` | **Merchant** — Uzum Basic auth | Same |

All other `/api/v1/*` routes use `withPublic`, `withActiveUser`, or `withAdmin` — see `scripts/security-audit/checks/api-routes.mjs`.

## Edge rate limiting (`middleware.ts`)

Selected API paths are rate limited at the edge before route handlers:

- `/api/v1/ai/*` — IP bucket (`ai-ip:`)
- `/api/v1/auth/*` — IP bucket (`auth:`)
- `/api/v1/lead-magnet` — IP bucket (`lead-magnet:`)
- `/api/v1/payments/status` — IP bucket (`payments-status:`)
- `/api/v1/payments/webhook` — IP bucket (`payments-webhook:`)
- `/api/v1/payments/payme`, `/click/*`, `/uzum/*` — existing payment merchant limits

Production rate limits use Convex `rate_limit_buckets` only (`lib/ai-rate-limit.ts`); in-memory fallback is development-only.

## CORS

Set `CORS_ALLOWED_ORIGINS` (comma-separated) in Vercel env. Wrappers attach `Access-Control-*` headers when `Origin` matches the allowlist.

## Related docs

- [`docs/security-audit/findings.json`](security-audit/findings.json) — audit findings tracker
- [`docs/PAYMENTS-OVERVIEW.md`](PAYMENTS-OVERVIEW.md) — payment provider setup
- [`scripts/security-api-probe.mjs`](../scripts/security-api-probe.mjs) — dynamic probes
