# Security Roadmap — Track 6

Status snapshot for FundingPro security & compliance work (Colossal Roadmap Track 6).

Last updated: 2026-06-27

## Finding status

| ID | Title | Severity | Status | Notes |
|----|-------|----------|--------|-------|
| M-02 | Custom scheme without Universal/App Links (deep link hijack) | Medium | **Open** | `.well-known` routes + env wiring done; set `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256` on Vercel, then verify with `npm run app-links:check -- --live`. Pen-test after App Links go live. |
| M-03 | No certificate pinning for mobile API | Medium | **Open (accepted v1)** | ADR: [`mobile/docs/ADR-certificate-pinning.md`](../../mobile/docs/ADR-certificate-pinning.md) — no pinning for v1.0; revisit after pen-test. |
| L-02 | No in-app account deletion | Low | **In progress → API shipped** | `POST /api/v1/me/delete-request` + `DELETE /api/v1/me` mark user for deletion in Convex; mobile profile calls API with support-ticket fallback. Clerk user purge is ops/manual (see below). |

## Track 6 deliverables (this sprint)

### 6.2 Rate limiting — **Resolved (Convex-backed)**

- Middleware IP buckets on `/api/v1/ai/*` and `/api/v1/auth/*` via `lib/api-rate-limit.ts` (`X-RateLimit-*` + `Retry-After` on 429).
- Per-user AI limits on AI route handlers (`lib/ai-rate-limit.ts`).
- **Production:** `rateLimitBuckets` Convex table + `convex/rateLimits.ts` internal mutations; Next.js routes call Convex via `CONVEX_DEPLOY_KEY`. Dev falls back to in-memory buckets when deploy key is unset.

### 6.3 Account erasure API — **Partial**

- Convex: `users.requestAccountDeletion` sets `deletionRequestedAt`, `isActive: false`, soft-deletes user organizations.
- API: `POST /api/v1/me/delete-request`, `DELETE /api/v1/me` (alias).
- Mobile: `profile.tsx` → `api.requestAccountDeletion()` with support-ticket fallback.
- **Clerk (manual / ops):** After Convex data purge, delete the Clerk user via [Clerk Backend API](https://clerk.com/docs/reference/backend-api/tag/Users#operation/DeleteUser) (`DELETE /users/{user_id}`) or Dashboard. Store `clerkUserId` from audit log `account_deletion_requested`.
- **Remaining:** Scheduled internal job to cascade-delete applications, documents, push tokens; automated Clerk delete via server action.

## Related audit IDs

| Audit ID | Remediation status |
|----------|-------------------|
| EDGE-API-BYPASS | Mitigated for AI/auth paths via middleware rate limit; full edge auth pre-check still optional |
| AI-RATE-LIMIT-MEMORY | **Resolved** — Convex `rateLimitBuckets` + internal `rateLimits.checkRateLimit`; memory fallback dev-only |

## Next steps (Track 6 backlog)

1. **M-02** — Set Vercel env (`APPLE_TEAM_ID`, `ANDROID_RELEASE_SHA256`); run `npm run app-links:check -- --live`; device smoke per `mobile/docs/EAS-SMOKE.md`; re-run deep-link hijack test case.
2. **M-03** — **Done (accepted v1)** — [`mobile/docs/ADR-certificate-pinning.md`](../../mobile/docs/ADR-certificate-pinning.md).
3. **L-02** — Complete erasure cron + Clerk automation; close finding after store review.
4. **6.4** — Regenerate `security-audit-orchestrator.mjs` report (drop stale Supabase findings).
5. **6.6** — External pen-test after payments + App Links live.
6. **6.7** — Enforce `CORS_ALLOWED_ORIGINS` on public API routes.

## Dependency baseline (Codex audit P1 — 2026-06-27)

Patch-level bumps within **Next 14.x** and **Clerk 5.x** (no `npm audit fix --force`):

| Package | Version | Notes |
|---------|---------|-------|
| `next` | 14.2.35 | Latest 14.2.x patch; pairs with `@next/swc-*@14.2.33` (no 14.2.35 SWC publish on npm) |
| `@clerk/nextjs` | 5.7.6 | Latest 5.x; pinned exact in `fundingpro/package.json` |
| `eslint-config-next` | 14.2.35 | Aligned with `next` |
| `postcss` (dev) | ^8.5.10 | Root override + devDep bump for GHSA-qx2v-qp2m-jg93 |

**Regression (2026-06-27):** `npm run typecheck --workspace=fundingpro`, `npm test --workspace=fundingpro` (81 tests), `NEXT_PUBLIC_CONVEX_URL=https://placeholder.convex.cloud npm run build --workspace=fundingpro`.

**Remaining npm audit (high):** Clerk auth bypass chain (GHSA-w24r-5266-9c3c) and Next 14 advisories require **Next 15+ / Clerk 7+** — deferred; tracked for major upgrade sprint.

## References

- Mobile security doc: [`mobile/docs/SECURITY.md`](../../mobile/docs/SECURITY.md)
- Audit report: [`docs/SECURITY_AUDIT_REPORT.md`](./SECURITY_AUDIT_REPORT.md)
- Rate limit env: [`/.env.example`](../.env.example) — `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_MAX`
