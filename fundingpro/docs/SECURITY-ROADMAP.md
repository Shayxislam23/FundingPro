# Security Roadmap — Track 6

Status snapshot for FundingPro security & compliance work (Colossal Roadmap Track 6).

Last updated: 2026-06-27

## Finding status

| ID | Title | Severity | Status | Notes |
|----|-------|----------|--------|-------|
| M-02 | Custom scheme without Universal/App Links (deep link hijack) | Medium | **Open** | `.well-known` routes + env wiring done. **Ops:** set Vercel env, verify live, then mark Resolved — see [M-02 checklist](#m-02-app-links-verification-checklist) below. |
| M-03 | No certificate pinning for mobile API | Medium | **Open (accepted v1)** | ADR: [`mobile/docs/ADR-certificate-pinning.md`](../../mobile/docs/ADR-certificate-pinning.md) — no pinning for v1.0; revisit after pen-test. |
| L-02 | No in-app account deletion | Low | **In progress** | API shipped; daily Convex cron purges applications, documents, push tokens after 30-day grace. Clerk purge remains ops/manual. |

## Track 6 deliverables (this sprint)

### 6.2 Rate limiting — **Resolved (Convex-backed)**

- Middleware IP buckets on `/api/v1/ai/*` and `/api/v1/auth/*` via `lib/api-rate-limit.ts` (`X-RateLimit-*` + `Retry-After` on 429).
- Per-user AI limits on AI route handlers (`lib/ai-rate-limit.ts`).
- **Production:** `rateLimitBuckets` Convex table + `convex/rateLimits.ts` internal mutations; Next.js routes call Convex via `CONVEX_DEPLOY_KEY`. Dev falls back to in-memory buckets when deploy key is unset.

### 6.3 Account erasure API — **Partial (cron shipped)**

- Convex: `users.requestAccountDeletion` sets `deletionRequestedAt`, `isActive: false`, soft-deletes user organizations.
- API: `POST /api/v1/me/delete-request`, `DELETE /api/v1/me` (alias).
- Mobile: `profile.tsx` → `api.requestAccountDeletion()` with support-ticket fallback.
- **Cron:** `convex/crons.ts` runs `accountErasure.purgeEligibleAccounts` daily — hard-deletes applications, documents (incl. storage), push tokens, org memberships, identities; scrubs user PII after **30-day** grace (`deletionRequestedAt`).
- **Clerk (manual / ops):** After Convex purge, delete the Clerk user via [Clerk Backend API](https://clerk.com/docs/reference/backend-api/tag/Users#operation/DeleteUser) (`DELETE /users/{user_id}`) or Dashboard. Store `clerkUserId` from audit log `account_deletion_requested`.
- **Remaining:** Automated Clerk delete via server action (optional).

### M-02 App Links verification checklist

**Script:** `npm run app-links:check` (local env validation) · `SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live` (production `.well-known`).

**You must set on Vercel (Production + Preview as needed):**

| Variable | Required | Description |
|----------|----------|-------------|
| `APPLE_TEAM_ID` | Yes | 10-character Apple Developer Team ID |
| `ANDROID_RELEASE_SHA256` | Yes | Release keystore SHA-256 fingerprint(s), comma-separated |
| `IOS_BUNDLE_ID` | No | Default `uz.fundingpro.app` |
| `ANDROID_PACKAGE` | No | Default `uz.fundingpro.app` |

**Steps:**

1. Add env vars in Vercel Dashboard → redeploy.
2. Run live check: `SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live` — all checks must pass (no `X-App-Links-Config: incomplete`).
3. Device smoke per [`mobile/docs/EAS-SMOKE.md`](../../mobile/docs/EAS-SMOKE.md) — HTTPS grant link opens native app.
4. Update M-02 status to **Resolved** in this doc.
5. Include in external pen-test scope — [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md).

**CI / local:** Run `npm ci` from monorepo root (not `npm install` inside `fundingpro/` alone) to avoid `ENOWORKSPACES` and SWC lockfile warnings. Root `overrides` pin `next@15.5.19`, `@clerk/nextjs@7.5.9`, and `@next/swc-*@15.5.19` optional deps in `fundingpro/package.json`.

## Related audit IDs

| Audit ID | Remediation status |
|----------|-------------------|
| EDGE-API-BYPASS | Mitigated for AI/auth paths via middleware rate limit; full edge auth pre-check still optional |
| AI-RATE-LIMIT-MEMORY | **Resolved** — Convex `rateLimitBuckets` + internal `rateLimits.checkRateLimit`; memory fallback dev-only |

## Next steps (Track 6 backlog)

1. **M-02** — Follow [M-02 App Links verification checklist](#m-02-app-links-verification-checklist); run `app-links:check -- --live`; device smoke; mark Resolved.
2. **M-03** — **Done (accepted v1)** — [`mobile/docs/ADR-certificate-pinning.md`](../../mobile/docs/ADR-certificate-pinning.md).
3. **L-02** — Cron cascade shipped; complete Clerk automation + store review to close finding.
4. **6.4** — Regenerate `security-audit-orchestrator.mjs` report (drop stale Supabase findings).
5. **6.6** — External pen-test after payments + App Links live — [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md).
6. **6.7** — Enforce `CORS_ALLOWED_ORIGINS` on public API routes.

## Dependency baseline (Codex audit P1 — 2026-06-27)

**S3 decision:** Next 15.5.19 + Clerk 7.5.9 merged to `main` (2026-06-27). Prod audit gate: **0 high** (`fundingpro` + `@fundingpro/mobile`).

| Package | Version | Notes |
|---------|---------|-------|
| `next` | 15.5.19 | App Router async `params`/`searchParams`; `outputFileTracingRoot` in `next.config.mjs` |
| `@clerk/nextjs` | 7.5.9 | Stricter publishable-key validation — CI uses `pk_test_Y2xlcmsuZGV2JHRlc3Qk` |
| `eslint-config-next` | 15.5.19 | Aligned with `next` |
| `postcss` | ^8.5.10 | Root override + nested `next` override for GHSA-qx2v-qp2m-jg93 |
| `@clerk/clerk-expo` | 2.19.41 | Mobile override; clears GHSA-w24r-5266-9c3c chain |
| `ws` | 8.21.0 | Root + `viem` nested override |
| `@next/swc-*` | 15.5.19 | Optional deps in `fundingpro/package.json` for monorepo hoisting |

**Regression (2026-06-27, post-merge):** `npm run build`, `npm run typecheck --workspace=fundingpro`, `npm test` (81), `npm run test:convex` (8), lint both workspaces.

**npm audit (high, prod deps):** 0 in `fundingpro` and `@fundingpro/mobile` (verified 2026-06-27).

## References

- Mobile security doc: [`mobile/docs/SECURITY.md`](../../mobile/docs/SECURITY.md)
- Audit report: [`docs/SECURITY_AUDIT_REPORT.md`](./SECURITY_AUDIT_REPORT.md)
- Rate limit env: [`/.env.example`](../.env.example) — `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_MAX`
