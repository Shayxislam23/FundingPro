# API Security — FundingPro

Reference for engineers and pen-testers. Describes how Next.js `/api/v1/*` routes and Convex functions enforce authentication, authorization, and input validation.

Last updated: 2026-06-27  
Machine-readable findings: [`security-audit/findings.json`](./security-audit/findings.json)

---

## Architecture

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Edge | Next.js `middleware.ts` | Clerk session, rate limits on `/api/v1/ai/*` and `/api/v1/auth/*` |
| API routes | App Router `app/api/v1/**/route.ts` | HTTP handlers, Clerk JWT validation, response shaping |
| Backend | Convex | Database, business logic, cron, internal mutations |
| Auth provider | Clerk | Sign-in, JWT for Convex, admin email allowlist |

**Important:** Middleware intentionally skips most `/api/*` routes (see `EDGE-API-BYPASS`). Each route must enforce auth via wrappers or explicit merchant/signature checks.

---

## Route wrappers (`lib/api-route.ts`)

All new routes should use one of:

| Wrapper | Use when | Validates |
|---------|----------|-----------|
| `withPublic` | No login required (health, plans, legal, status) | Nothing — still validate input |
| `withActiveUser` | Logged-in user, account active | Clerk session + Convex user + `isActive` |
| `withAdmin` | Admin dashboard / ops | Above + email in `ADMIN_EMAILS` |

```typescript
export const GET = withActiveUser(async (req, user, ctx) => {
  // user.id, user.email available
});
```

### Route inventory (orchestrator scan)

Regenerate with `npm run security:audit`. Latest counts live in `findings.json` → `routeStats`.

| Pattern | Typical routes |
|---------|----------------|
| `withActiveUser` | `/me`, applications, documents, AI (user-scoped) |
| `withAdmin` | `/admin/*`, catalog management |
| `withPublic` | `/health`, `/plans`, `/legal/*`, public grant reads |
| **Custom** | Payments PSP callbacks, `admin-check`, `lead-magnet` |

---

## Custom routes — audit matrix

These 12 routes bypass standard wrappers **by design**. Each must document why.

| Route | Auth mechanism | Public intent |
|-------|----------------|---------------|
| `auth/admin-check` | Clerk session + admin email | Pre-flight admin UI |
| `lead-magnet` | Optional email + rate limit | Marketing capture |
| `payments/status` | None (read-only config) | Client checkout gating |
| `payments/webhook` | Deprecated → 410 | Legacy redirect |
| `payments/uzum/*` | Uzum Basic auth + merchant credentials | PSP server-to-server |
| `payments/payme` | Payme JSON-RPC + `Authorization` | PSP callback |
| `payments/click/prepare`, `click/complete` | Click MD5 signature | PSP callback |

**Remediation backlog:** Prefer `withPublic` for truly public routes; keep PSP routes custom but centralize signature verification in `lib/payments/*`.

---

## Clerk authentication

- **API routes:** `requireActiveUser` / `requireAdmin` in [`lib/auth-helpers.ts`](../lib/auth-helpers.ts).
- **Admin model:** `ADMIN_EMAILS` env (comma-separated); never set `ADMIN_BYPASS_DEV` in production.
- **Banned/disabled:** `admin-check` does not yet verify banned status — see `ADMIN-CHECK-NO-STATUS` in findings.

---

## Convex authentication

Public Convex functions use `ctx.auth.getUserIdentity()` or custom wrappers in `convex/lib/customFunctions.ts`:

- `authedQuery` / `authedMutation` — require Clerk identity mapped to `users` table.
- Internal functions (`internalMutation`, etc.) — callable only from backend; use for crons, webhooks via `CONVEX_SYSTEM_SECRET`.

**System actions:** Next.js payment paths call Convex with `CONVEX_DEPLOY_KEY` + `CONVEX_SYSTEM_SECRET`. Both must be set on Vercel and Convex production env before `PAYMENTS_ENABLED=true`.

### Argument validation

All public Convex queries/mutations must define `args` and `returns` validators (`v.*`). ESLint rule `@convex-dev/require-argument-validators` is enabled.

**Known gap:** `convex/matchGrants.ts` uses `v.any()` for `profile` — narrow to a typed object when profile schema stabilizes.

---

## Rate limiting

| Surface | Implementation | Production |
|---------|----------------|------------|
| `/api/v1/ai/*` | IP bucket in middleware + per-user in handler | Convex `rateLimitBuckets` |
| `/api/v1/auth/*` | IP bucket in middleware | Convex `rateLimitBuckets` |
| Dev fallback | In-memory (`lib/ai-rate-limit.ts`) | Disabled when deploy key set |

Finding `AI-RATE-LIMIT-MEMORY`: ensure `CONVEX_DEPLOY_KEY` is set in production so in-memory fallback is never used.

---

## Payments security

- **Kill switch:** `PAYMENTS_ENABLED=false` on Vercel production until sandbox E2E passes.
- **Provider auth:** Each PSP route validates merchant credentials or HMAC/MD5 signatures before mutating subscriptions.
- **Idempotency:** Webhook handlers must tolerate replay (documented in provider go-live guides).
- **Checklist:** `npm run payments:golive` · [`PAYMENTS-OVERVIEW.md`](./PAYMENTS-OVERVIEW.md)

---

## Security headers

Configured in [`next.config.mjs`](../next.config.mjs): CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

Verify after deploy:

```bash
curl -sI https://www.fundingpro.uz/ | grep -iE 'strict-transport|frame-options|content-security'
```

---

## CORS

`CORS_ALLOWED_ORIGINS` is defined in env but **not yet enforced** at the edge (`CORS-UNENFORCED`). Sensitive routes should validate `Origin` header until middleware enforcement ships (Track 6.7).

---

## Dynamic testing

```bash
cd fundingpro
npm run security:audit       # static + domain findings → findings.json
npm run security:probe       # local auth/BOLA probes
npm run security:probe:prod  # read-only production probes
```

---

## Related documents

- [`SECURITY_AUDIT_REPORT.md`](./SECURITY_AUDIT_REPORT.md) — executive summary
- [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md) — M-02, L-02 tracking
- [`OPS-RUNBOOK.md`](./OPS-RUNBOOK.md) — go-live and incident response
- [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md) — external pen-test scope
