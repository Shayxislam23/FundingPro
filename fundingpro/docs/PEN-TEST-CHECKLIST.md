# Penetration Test Checklist — FundingPro

Use this checklist before external pen-test engagement or to self-assess production readiness. Run after App Links and PSP sandbox are live.

Last updated: 2026-06-27

## Prerequisites

- [ ] Production or staging URL: `https://www.fundingpro.uz`
- [ ] `npm run app-links:check -- --live` passes (see M-02 below)
- [ ] `PAYMENTS_ENABLED=true` only after sandbox E2E — see [`PAYMENTS-OVERVIEW.md`](./PAYMENTS-OVERVIEW.md)
- [ ] `npm run security:probe:prod` — no unexpected 5xx on public routes

---

## 1. Authentication & session

| Test | Expected | Command / notes |
|------|----------|-----------------|
| Unauthenticated API access | 401 on protected `/api/v1/*` | `npm run security:probe` |
| Clerk JWT tampering | Rejected | Modify `Authorization` bearer token |
| Expired session | 401, no data leak | Use revoked session cookie |
| Admin routes | 403 for non-admin | `GET /api/v1/admin/*` as regular user |
| Account deletion | Marks inactive; no immediate PII in responses | `DELETE /api/v1/me` |
| Rate limit on auth | 429 with `Retry-After` | Burst `POST /api/v1/auth/*` |

## 2. Payments (Uzum, Payme, Click)

| Test | Expected | Notes |
|------|----------|-------|
| Webhook without signature | 401/403 | Each provider HMAC/MD5/JSON-RPC auth |
| Replay webhook | Idempotent — no double activation | Resend same `confirm` payload |
| Amount tampering | Rejected | Modify `amount` in callback |
| `PAYMENTS_ENABLED=false` | Checkout blocked | Status endpoint reflects disabled |
| Provider env isolation | Missing keys → `configured: false` | `npm run payments:check` |

## 3. File upload & documents

| Test | Expected |
|------|----------|
| Upload without auth | 401 |
| Cross-user document access | 404 / 403 |
| Oversized file | Rejected at API or storage |
| MIME type spoofing | Validated server-side |

## 4. Rate limiting & abuse

| Test | Expected |
|------|----------|
| AI endpoints `/api/v1/ai/*` | IP + per-user limits; 429 headers |
| Auth endpoints | Middleware bucket limits |
| Convex `rateLimitBuckets` | Persists across serverless instances (prod) |

## 5. Deep links & mobile (M-02)

| Test | Expected | Command |
|------|----------|---------|
| AASA served | 200, valid JSON, no `X-App-Links-Config: incomplete` | `npm run app-links:check -- --live` |
| assetlinks.json | SHA256 matches release keystore | Vercel: `ANDROID_RELEASE_SHA256` |
| Custom scheme hijack | Universal/App Link opens app, not browser trap | Device smoke — [`mobile/docs/EAS-SMOKE.md`](../../mobile/docs/EAS-SMOKE.md) |
| Certificate pinning | **Out of scope v1** — see [`mobile/docs/ADR-certificate-pinning.md`](../../mobile/docs/ADR-certificate-pinning.md) |

### M-02 verification checklist (Vercel — ops)

1. **Vercel → Settings → Environment Variables (Production):**
   - `APPLE_TEAM_ID` — 10-character Apple Team ID (not `TEAM_ID` placeholder)
   - `ANDROID_RELEASE_SHA256` — release keystore SHA-256 fingerprint(s), comma-separated
   - Optional: `IOS_BUNDLE_ID` (`uz.fundingpro.app`), `ANDROID_PACKAGE` (`uz.fundingpro.app`)
2. Redeploy production after env change.
3. Run locally with production URL:
   ```bash
   cd fundingpro
   SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live
   ```
4. Device smoke: tap `https://www.fundingpro.uz/grants/...` — opens native app (not browser-only).
5. Mark M-02 **Resolved** in [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md).

## 6. Data privacy & erasure (L-02)

| Test | Expected |
|------|----------|
| Deletion request | `deletionRequestedAt` set; `isActive: false` |
| Grace period (30 days) | Data retained until cron purge |
| Post-purge | Applications, documents, push tokens removed; user PII scrubbed |
| Clerk user | Manual delete via Backend API after Convex purge (ops) |

Cron: `purge accounts pending erasure` — daily via `convex/crons.ts` → `accountErasure.purgeEligibleAccounts`.

## 7. Headers & transport

| Test | Expected |
|------|----------|
| HSTS | `Strict-Transport-Security` on all pages |
| CSP | No `unsafe-eval` in production |
| `X-Frame-Options` | `DENY` |
| CORS | Restricted origins on sensitive routes (see 6.7 backlog) |

## 8. Reporting

- Log findings with severity (Critical / High / Medium / Low).
- Map to roadmap IDs: M-02, M-03, L-02 in [`SECURITY-ROADMAP.md`](./SECURITY-ROADMAP.md).
- Re-run `npm run security:audit` after remediation.

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Engineering | | | |
| External tester | | | |
| Product / Legal | | | |
