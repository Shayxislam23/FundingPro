# FundingPro Mobile → App Store + Play Market: submission plan

Executable plan for App Store + Google Play submission. **End results** are fixed; how you get there is up to the executor.

**Current product positioning (v1):** физические лица — поиск грантов/стипендий/программ, проверка соответствия, AI-черновик, «Мой путь» (онбординг). Не NGO-only; сегменты «бизнес / НКО» — позже.

**App version gate:** stay on `0.4.0` until Phase 8 passes; bump to `1.0.0` only after device QA sign-off (`STORE-LAUNCH.md`).

Related local docs:
- [`STORE-LAUNCH.md`](./STORE-LAUNCH.md) — screenshots, review notes, Maestro
- [`STORE-LISTING-COPY.md`](./STORE-LISTING-COPY.md) — RU/EN listing text ready to paste
- [`APP-PRIVACY-DATA-SAFETY.md`](./APP-PRIVACY-DATA-SAFETY.md) — App Privacy / Data Safety answers
- [`EAS-SUBMIT-CREDENTIALS.md`](./EAS-SUBMIT-CREDENTIALS.md) — what to put in `eas.json → submit`
- [`RELEASE.md`](./RELEASE.md) — build commands, deep links

External:
- https://docs.expo.dev/submit/introduction/
- https://expo.dev/accounts/shayxislam/projects/fundingpro/submissions

---

## Status board (update as you go)

Last code pass: **2026-07-08** · Last analysis: **2026-07-09 00:17 +05**

| Phase | Owner | Status | Blocker |
|------:|-------|--------|---------|
| 0 Developer accounts | Human / billing | ⬜ | $99 Apple + $25 Google |
| 1 Draft listings | Human | ⬜ | Needs Phase 0 |
| 2 EAS submit credentials | Human | ⬜ | Needs Phase 1 IDs; `eas.json` skeleton ✅ code-complete |
| 3 App Links (code) | Dev | ⚠️ env vars missing | Code ✅ live. Both `.well-known/*` → **200 OK** ✅ (confirmed 2026-07-09). **`X-App-Links-Config: incomplete`** — needs `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256` on Vercel Production, then `npx vercel --prod`. Run `bash paste-secrets.sh` from repo root. |
| 4 Store listing copy | Done in repo | ✅ draft | Paste into consoles (`STORE-LISTING-COPY.md`) |
| 5 Screenshots / feature graphic | Human / design | ⬜ | After Clay verify; «Мой путь» screen now titled correctly |
| 6 Privacy / Data Safety forms | Human | ✅ answers ready | Fill from `APP-PRIVACY-DATA-SAFETY.md` |
| 7 Production builds + first Android manual upload | Dev | ⬜ | Needs Phase 0–2 |
| 8 Device QA + version bump to 1.0.0 | QA | ⬜ | Gate before bump |
| 9 `eas submit` both platforms | Dev | ⬜ | Waiting for Review |
| 10 Review outcome | Dev + product | ⬜ | Fix + resubmit if rejected |

### Code-complete checklist (as of 2026-07-08)

- [x] `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` route handlers (`fundingpro/app/api/well-known/*/route.ts`)
- [x] `next.config.mjs` rewrites routing `/.well-known/*` → API routes (survives Next.js App Router quirks)
- [x] Android SHA-256 fingerprint normalised to `AA:BB:CC:…` colon format in `lib/mobile-app-links.ts`
- [x] `X-App-Links-Config: incomplete` diagnostic header when env vars missing
- [x] `eas.json` submit skeleton with placeholder `ascAppId` / `appleTeamId` (no invented values)
- [x] `mobile/.gitignore` covers `secrets/`, `*service-account*.json`, `*.p8`
- [x] Onboarding screen title → **«Мой путь»** (was «Онбординг»)
- [x] More menu + Home quick actions already link to «Мой путь» (`/(app)/onboarding`)
- [x] Maestro `onboarding-checklist.yaml` NGO assertion fixed → `assertVisible: "Заполнить личный профиль"`
- [x] `public-fallback.ts` plan groups include `individual` tier; no individuals-first regression
- [x] Store listing copy: физлица framing, not NGO-only (`STORE-LISTING-COPY.md`)
- [x] App review notes include «Мой путь» path (`STORE-LAUNCH.md`)
- [x] Account deletion: in-app button → `api.requestAccountDeletion()` with support-ticket fallback; copy policy-aligned

### Human-blocked items (no code can unblock)

- [ ] **Phase 0:** Pay Apple ($99) + Google ($25) developer accounts
- [ ] **Phase 1:** Create draft app listings → get numeric `ascAppId`
- [ ] **Phase 2:** Copy `appleTeamId` from Apple Membership → update `eas.json` + Vercel `APPLE_TEAM_ID`
- [ ] **Phase 3 final:** Get `ANDROID_RELEASE_SHA256` from EAS/Play keystore → set on Vercel → redeploy → verify live 200
- [ ] **Phase 5:** Take 7 screenshots on physical device after Clay verify
- [ ] **Phase 7–10:** EAS production build → Android manual upload → TestFlight → QA → submit

### Known product gap (do not block submission)

Account deletion relies on a support ticket if `api.requestAccountDeletion()` endpoint does not yet perform immediate erasure. Apple 5.1.1(v) and Google increasingly expect self-service deletion. The in-app button is policy-aligned for **initial submission**; plan backend hard-delete before v1 renewal.

---

## Phase 0 — Developer account enrollment *(human, blocking)*

**Done when:** Apple Developer Program membership and Google Play Console account are active under the **org** identity (not a random personal account).

## Phase 1 — Draft app listings

**Done when:**
- App Store Connect has a draft app → numeric `ascAppId`
- Play Console has a draft app with application ID `uz.fundingpro.app`

Nothing public yet.

## Phase 2 — Credentials in the build pipeline

**Done when:** `mobile/eas.json → submit.production` (or EAS-managed credentials) can run non-interactively:
- iOS: `ascAppId`, `appleTeamId`, plus app-specific password **or** ASC API key
- Android: `serviceAccountKeyPath` (JSON gitignored) + first track `internal`

See [`EAS-SUBMIT-CREDENTIALS.md`](./EAS-SUBMIT-CREDENTIALS.md).

## Phase 3 — Production App Links env

**Done when:**
1. Vercel Production has real `APPLE_TEAM_ID` and `ANDROID_RELEASE_SHA256`
2. Live checks pass:

```bash
curl -sI https://www.fundingpro.uz/.well-known/apple-app-site-association
curl -sI https://www.fundingpro.uz/.well-known/assetlinks.json
# Expect: HTTP 200, JSON body, NO header X-App-Links-Config: incomplete

cd fundingpro && npm run app-links:check -- --live
```

3. Universal / App Links open `https://www.fundingpro.uz/mobile/*` on a physical device.

**Status (2026-07-08):** Vercel production deployment is now up to date with main.
Well-known paths will return 200 once the two env vars below are set.

**Remaining blocker — env vars not yet set in Vercel:**
- `APPLE_TEAM_ID` — get from Apple Developer portal → Membership → Team ID (10-char string)
- `ANDROID_RELEASE_SHA256` — get from EAS keystore or Play Console after first signed upload

**Do not invent these values.** After setting them in Vercel (Settings → Environment Variables → Production):
```bash
npx vercel deploy --prod   # one more redeploy to pick up the new env vars
cd fundingpro && npm run app-links:check -- --live  # verify 200 + no incomplete header
```

Do not submit for store review until app-links:check passes on the live domain.

## Phase 4 — Store listing copy

**Done when:** titles, short/full descriptions, keywords, support + marketing URLs are pasted into both consoles from [`STORE-LISTING-COPY.md`](./STORE-LISTING-COPY.md).

Must match in-app positioning: **физлица**, not NGO regression.

## Phase 5 — Visual assets

**Done when:** screenshots per [`STORE-LAUNCH.md`](./STORE-LAUNCH.md) (7 screens, including «Мой путь» / onboarding) + Play feature graphic **1024×500**. Assets show current individuals-first UI.

## Phase 6 — Compliance forms

**Done when:** Apple App Privacy + Google Play Data Safety + content rating are submitted using [`APP-PRIVACY-DATA-SAFETY.md`](./APP-PRIVACY-DATA-SAFETY.md).

## Phase 7 — First production builds

**Done when:**
```bash
cd mobile
eas build --profile production --platform all
```
- Android `.aab` uploaded **once manually** in Play Console (required before `eas submit` works)
- iOS build appears in TestFlight

## Phase 8 — Device QA sign-off

**Done when:** checklist in `STORE-LAUNCH.md` is checked (Clay, Maestro smoke, deep links on device). **Then** bump `app.json` + `package.json` → `1.0.0`.

## Phase 9 — Submit for review

**Done when:**
```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```
Both consoles show Waiting for Review (or equivalent).

## Phase 10 — Review outcome

**Done when:** both apps are live, **or** every rejection has a committed fix and resubmit.

---

## What NOT to do

- Do **not** bump past `0.4.0` before Phase 8.
- Do **not** invent `ascAppId` / Team ID / SHA-256 — leave placeholders until Phase 0–1.
- Do **not** regress listing or screenshots to NGO-only framing.
- Do **not** commit ASC API keys, `.p8`, or Google service-account JSON (gitignored).

---

## Fast path after Phase 0 is paid

1. Create draft listings → write IDs into `eas.json` / EAS credentials  
2. Set Vercel App Links env → redeploy web → `app-links:check --live`  
3. Paste listing copy + fill privacy forms  
4. Capture screenshots  
5. `eas build` → manual Android upload once → TestFlight  
6. Device QA → bump `1.0.0` → `eas submit`
