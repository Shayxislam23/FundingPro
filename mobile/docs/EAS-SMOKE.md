# EAS Preview smoke checklist

Manual gate before TestFlight / Play internal testing. **Do not run cloud `eas build` in CI for this doc** — execute locally when credentials are ready.

See also: [`EAS-PREVIEW.md`](./EAS-PREVIEW.md), [`RELEASE.md`](./RELEASE.md), [`CLAY-VERIFY.md`](./CLAY-VERIFY.md).

## Prerequisites

- [ ] `eas login` (Expo account with project access)
- [ ] `app.json` → `extra.eas.projectId` is a real UUID (linked project)
- [ ] EAS Secrets: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL` (or set in `eas.json` preview env)
- [ ] Vercel production env (see `fundingpro/.env.production.example`):

| Vercel variable | Purpose |
|-----------------|---------|
| `APPLE_TEAM_ID` | iOS AASA `appIDs` — 10-char Apple Developer Team ID |
| `ANDROID_RELEASE_SHA256` | Android `assetlinks.json` release cert fingerprint(s) |
| `IOS_BUNDLE_ID` | Optional (default `uz.fundingpro.app` from `mobile/app.json`) |
| `ANDROID_PACKAGE` | Optional (default `uz.fundingpro.app`) |

- [ ] App Links verification (from monorepo root or `fundingpro/`):

```bash
cd fundingpro
npm run app-links:check
SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live
```

Expected when configured: HTTP 200 on both `.well-known` routes, **no** `X-App-Links-Config: incomplete` header.

- [ ] Optional prod catalog: `CONVEX_DEPLOY_KEY` → `npm run convex:seed:prod` from monorepo root

## Build (local — run when ready)

```bash
cd mobile
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

Install the build on a **physical device** (push + App Links require real device for full verification).

## Smoke tests (device)

### Install & launch

- [ ] App opens without crash (check Sentry if configured)
- [ ] Guest carousel shows once; skip → public landing loads
- [ ] Clay-lite UI: canvas `#E8F0EA`, floating tab dock, hero gradient

### Auth

- [ ] Email OTP login completes
- [ ] Custom scheme: `fundingpro://auth/callback` (Clerk redirect) → lands on home
- [ ] App Link (after Vercel env + live check): open `https://www.fundingpro.uz/mobile/auth/callback` via Notes/Safari → app opens, session established
- [ ] Verify hosting first: `SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live` (from `fundingpro/`)
- [ ] Logout → login again

### Catalog (requires prod seed or dev Convex)

- [ ] Grants list loads (no persistent DemoBanner if live API has data)
- [ ] Grant detail opens
- [ ] Donors list loads

### Subscription / payments (sandbox)

- [ ] Subscription screen shows plans
- [ ] Checkout opens Uzum / browser; **do not complete real charge in smoke** unless sandbox
- [ ] Return URL: `fundingpro://subscription/return?paymentId=<test>` opens return screen
- [ ] App Link return: `https://www.fundingpro.uz/mobile/subscription/return?paymentId=<test>` → return screen

### Profile & compliance

- [ ] Profile → «Запросить удаление аккаунта» opens support flow (v0.4)
- [ ] Legal WebView pages load (`/legal/privacy`, offer)

### Push (physical device)

- [ ] After login, push token registers (no error in logs)
- [ ] Optional: send test notification from Expo dashboard

## Maestro (simulator / device with dev client)

```bash
maestro test mobile/maestro/
```

- [ ] Onboarding / login flows pass
- [ ] No flaky failures on repeat run

## Sign-off

| Check | Owner | Date |
|-------|-------|------|
| iOS preview smoke | | |
| Android preview smoke | | |
| App Links verified | | |
| Maestro green | | |

**Blockers to escalate:** missing Team ID / SHA256, empty prod catalog, Clerk redirect mismatch, crash on cold start from App Link.
