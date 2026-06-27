# Security Roadmap — Track 6

Status snapshot for FundingPro security & compliance work (Colossal Roadmap Track 6).

Last updated: 2026-06-27

## Finding status

| ID | Title | Severity | Status | Notes |
|----|-------|----------|--------|-------|
| M-02 | Custom scheme without Universal/App Links (deep link hijack) | Medium | **Open** | `.well-known` routes exist; real Apple Team ID + Android SHA256 still required. Pen-test after App Links go live. |
| M-03 | No certificate pinning for mobile API | Medium | **Open (accepted risk ADR pending)** | Trade-off: pinning vs cert rotation. Document decision in release checklist before v1.0. |
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

1. **M-02** — Deploy verified App Links; re-run deep-link hijack test case.
2. **M-03** — Write ADR: pin vs no-pin; implement or formally accept risk for v1.0.
3. **L-02** — Complete erasure cron + Clerk automation; close finding after store review.
4. **6.4** — Regenerate `security-audit-orchestrator.mjs` report (drop stale Supabase findings).
5. **6.6** — External pen-test after payments + App Links live.
6. **6.7** — Enforce `CORS_ALLOWED_ORIGINS` on public API routes.

## References

- Mobile security doc: [`mobile/docs/SECURITY.md`](../../mobile/docs/SECURITY.md)
- Audit report: [`docs/SECURITY_AUDIT_REPORT.md`](./SECURITY_AUDIT_REPORT.md)
- Rate limit env: [`/.env.example`](../.env.example) — `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_MAX`
