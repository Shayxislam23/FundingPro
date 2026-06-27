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

Regenerate the inventory below:

```bash
node scripts/security-audit/checks/api-routes.mjs
```

## Merchant / custom auth routes

Routes that do **not** use standard wrappers rely on **provider-specific auth** (merchant Basic auth, HMAC, or RPC credentials).

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

## Full route inventory (64 files)

Generated from `app/api/v1/**/route.ts` — **64** route modules.

| Method(s) | Path | Wrapper |
|-----------|------|---------|
| GET | `/api/v1/admin/ai-logs` | `withAdmin` |
| GET | `/api/v1/admin/applications` | `withAdmin` |
| GET | `/api/v1/admin/audit-logs` | `withAdmin` |
| GET | `/api/v1/admin/consents` | `withAdmin` |
| GET, PATCH | `/api/v1/admin/consultant-orders` | `withAdmin` |
| GET | `/api/v1/admin/dashboard` | `withAdmin` |
| GET, POST | `/api/v1/admin/donors` | `withAdmin` |
| GET | `/api/v1/admin/funnel` | `withAdmin` |
| GET, POST | `/api/v1/admin/grants` | `withAdmin` |
| PATCH | `/api/v1/admin/grants/[id]` | `withAdmin` |
| GET, POST | `/api/v1/admin/grants/[id]/requirements` | `withAdmin` |
| GET | `/api/v1/admin/organizations` | `withAdmin` |
| PATCH | `/api/v1/admin/organizations/[id]/verify` | `withAdmin` |
| GET | `/api/v1/admin/payments` | `withAdmin` |
| GET | `/api/v1/admin/settings` | `withAdmin` |
| GET | `/api/v1/admin/support-tickets` | `withAdmin` |
| PATCH | `/api/v1/admin/support-tickets/[id]` | `withAdmin` |
| GET, PATCH | `/api/v1/admin/users` | `withAdmin` |
| POST | `/api/v1/ai/match-grants` | `withActiveUser` |
| POST | `/api/v1/ai/proposal/generate` | `withActiveUser` |
| GET | `/api/v1/ai/proposals` | `withActiveUser` |
| GET, POST | `/api/v1/applications` | `withActiveUser` |
| GET, PATCH, DELETE | `/api/v1/applications/[id]` | `withActiveUser` |
| GET | `/api/v1/auth/admin-check` | `withActiveUser` |
| POST | `/api/v1/auth/audit-login` | `withActiveUser` |
| GET, POST | `/api/v1/consultant-orders` | `withActiveUser` |
| GET | `/api/v1/consultants` | `withActiveUser` |
| GET, DELETE | `/api/v1/documents` | `withActiveUser` |
| GET | `/api/v1/documents/[id]/download` | `withActiveUser` |
| POST | `/api/v1/documents/upload` | `withActiveUser` |
| GET | `/api/v1/donors` | `withPublic` |
| POST | `/api/v1/eligibility/check` | `withActiveUser` |
| GET | `/api/v1/grants` | `withPublic` |
| GET | `/api/v1/grants/[id]` | `withPublic` |
| POST, DELETE | `/api/v1/grants/[id]/save` | `withActiveUser` |
| GET | `/api/v1/health` | `withPublic` |
| POST | `/api/v1/lead-magnet` | `withPublic` |
| GET | `/api/v1/legal` | `withPublic` |
| POST | `/api/v1/legal/consent` | `withActiveUser` |
| GET | `/api/v1/legal/consent/status` | `withActiveUser` |
| GET, DELETE | `/api/v1/me` | `withActiveUser` |
| POST, DELETE | `/api/v1/me/delete-request` | `withActiveUser` |
| POST | `/api/v1/me/push-token` | `withActiveUser` |
| GET | `/api/v1/onboarding/status` | `withActiveUser` |
| GET, POST, PATCH | `/api/v1/organizations` | `withActiveUser` |
| POST | `/api/v1/payments/checkout` | `withActiveUser` |
| GET | `/api/v1/payments/checkout/return` | `withActiveUser` |
| POST | `/api/v1/payments/click/complete` | **merchant** |
| POST | `/api/v1/payments/click/prepare` | **merchant** |
| POST | `/api/v1/payments/intent` | `withActiveUser` |
| POST | `/api/v1/payments/payme` | **merchant** |
| GET | `/api/v1/payments/status` | `withPublic` |
| POST | `/api/v1/payments/uzum/check` | **merchant** |
| POST | `/api/v1/payments/uzum/confirm` | **merchant** |
| POST | `/api/v1/payments/uzum/create` | **merchant** |
| POST | `/api/v1/payments/uzum/reverse` | **merchant** |
| POST | `/api/v1/payments/uzum/status` | **merchant** |
| POST | `/api/v1/payments/webhook` | `withPaymentWebhook` |
| GET | `/api/v1/plan-usage` | `withActiveUser` |
| GET | `/api/v1/plans` | `withPublic` |
| GET | `/api/v1/stories` | `withPublic` |
| GET, POST | `/api/v1/subscription-requests` | `withActiveUser` |
| GET | `/api/v1/subscriptions/current` | `withActiveUser` |
| GET, POST | `/api/v1/support-tickets` | `withActiveUser` |

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
- [`docs/PEN-TEST-CHECKLIST.md`](PEN-TEST-CHECKLIST.md) — external pen-test scope
- [`docs/PAYMENTS-OVERVIEW.md`](PAYMENTS-OVERVIEW.md) — payment provider setup
- [`scripts/security-api-probe.mjs`](../scripts/security-api-probe.mjs) — dynamic probes
