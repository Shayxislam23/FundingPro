# Council next steps — FundingPro (2026-07)

Query: *What should we do next after Expo/Clerk auto-stack work on `cursor/mobile-expo-skill-64e0`?*

Method: Karpathy LLM Council (Stage 1 → anonymized Stage 2 → Chairman). Skill: [`.cursor/skills/llm-council/SKILL.md`](../../.cursor/skills/llm-council/SKILL.md).

## Stage 1 — Independent perspectives

### Response A (Product / Go-live)

- Prod catalog still empty without `CONVEX_DEPLOY_KEY` + seed → `go-live:check` P1 fails.
- App Links incomplete (`APPLE_TEAM_ID` / `ANDROID_RELEASE_SHA256` missing on Vercel).
- GitHub billing lock blocks CI/release-gate on merges.
- Payments must stay off until sandbox E2E.
- **Actions:** unlock billing; paste App Links secrets; run prod seed; keep payments disabled.

### Response B (Mobile / client)

- Metro + iOS/Android/web JS bundles green; `@clerk/expo` migration typechecks.
- OTP still on `@clerk/expo/legacy` (intentional until signal API migration).
- Lab home/card calls `GET /lab/journey` + `PATCH /lab/profile` → **404** vs current onboarding routes.
- Maestro covers auth/onboarding slice only; no device EAS smoke in CI.
- Unused Supabase-era `parseAuthCallbackUrl` remains in callback-validation.
- **Actions:** fix Lab REST contract; quarantine dead auth parse; EAS device smoke (human).

### Response C (API / Convex)

- Spec (`LAB_ONBOARDING_SPEC.md`) already defines `/api/v1/lab/journey` + `/lab/profile`.
- Backend has Convex `onboarding.getStatus` / `getLabProfile` / `updateLabProfile` and REST under `/onboarding/*` only.
- Mobile schema (`labJourneySchema`) differs in field names/step ids from onboarding DTOs — needs a mapper.
- `onboarding/status` route currently passes `userId` where `accessToken` is required (bug).
- **Actions:** add lab journey/profile routes + mapper; fix status token; extend mobile-api-contract 401 checks.

### Response D (DX / tooling)

- `npm run stack:auto` / `mobile:auto` already start Metro/Next/Convex and smoke bundles.
- Council/create-skill inventory exists under `.cursor/skills/`.
- Cloud agent cannot replace physical device or store credentials.
- **Actions:** document council method; keep auto scripts; do not expand Maestro without a device farm.

## Stage 2 — Anonymized peer rank

Ranked by impact × feasibility **in this cloud agent** (no secrets/device):

| Rank | Response | Why |
|------|----------|-----|
| 1 | **C** | Highest user-visible fix fully agent-executable (Lab 404 → journey). |
| 2 | **B** | Same theme + auth hygiene; pairs with C. |
| 3 | **D** | Cheap leverage (docs/skills); does not unblock users alone. |
| 4 | **A** | Highest prod impact but blocked on human secrets/billing. |

Aggregate: **C > B > D > A** for *this* turn; A remains P0 for humans.

## Stage 3 — Chairman synthesis

### Do now (this branch)

1. Ship `GET /api/v1/lab/journey` + `PATCH /api/v1/lab/profile` mapping onboarding → `labJourneySchema`.
2. Fix `GET /api/v1/onboarding/status` to use `accessToken`.
3. Extend `mobile-api-contract` to assert Lab routes require auth (401).
4. Quarantine unused `parseAuthCallbackUrl`; note `@clerk/expo/legacy` on OTP screens.
5. Land `llm-council` skill + this doc; link from `AGENTS.md`.

### Human Stage-0 (out of agent reach)

1. GitHub billing unlock → CI green on merge.
2. `CONVEX_DEPLOY_KEY` + `npm run convex:seed:prod`.
3. Vercel `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256` → App Links complete.
4. EAS preview/dev client on physical device + Clerk OTP smoke.

### Out of scope this turn

- Migrating OTP off `@clerk/expo/legacy`
- Payments enablement / PSP sandbox
- Store submit IDs / screenshots
- Expanding Maestro to full P0 paths without a device

### Strongest dissent

Response A argues seed/App Links outrank Lab API because prod marketing gates fail without catalog. Chairman accepts that for **humans**, but ranks Lab API first for **agent work** because catalog/App Links cannot proceed without credentials the agent does not have.

## Status after implementation

See PR `cursor/mobile-expo-skill-64e0` / #23 — Lab aliases + auth cleanup land with this doc.
