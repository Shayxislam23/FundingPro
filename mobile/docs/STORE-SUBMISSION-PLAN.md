# FundingPro Mobile → App Store + Play Market: submission plan

Standalone plan for whoever executes the remaining work (Cursor or a human)
— no prior conversation context assumed. Each phase states an **end
result**, not implementation steps: the executor decides how, this doc
fixes what "done" means. Related prep already in this repo:
`STORE-LAUNCH.md`, `APP-PRIVACY-DATA-SAFETY.md`, `EAS-SUBMIT-CREDENTIALS.md`,
`RELEASE.md`.

Source docs to consult while executing:
- https://docs.expo.dev/submit/introduction/ (and its iOS/Android sub-pages)
- https://expo.dev/accounts/shayxislam/projects/fundingpro/submissions (build/submission history — requires login, not accessible to an agent)

---

## Phase 0 — Developer account enrollment *(human, billing, blocking everything below)*
**End result:** an active Apple Developer Program membership and an active Google Play Console account, both under the org's identity, not a personal one.

## Phase 1 — Draft app listings created in both consoles
**End result:** an app record exists in App Store Connect (giving you the numeric `ascAppId`) and a draft app exists in Google Play Console (giving you an application ID matching `uz.fundingpro.app`). Nothing public yet — draft state only.

## Phase 2 — Credentials wired into the build pipeline
**End result:** `mobile/eas.json → submit.production` has real values for iOS (`ascAppId`, `appleTeamId`, plus either an app-specific password or App Store Connect API key) and Android (`serviceAccountKeyPath`) — see `EAS-SUBMIT-CREDENTIALS.md` for exactly which field comes from which console screen. `eas submit` can run without interactive prompts.

## Phase 3 — Production env vars set
**End result:** `APPLE_TEAM_ID` and `ANDROID_RELEASE_SHA256` are set in Vercel production. Fetching `https://www.fundingpro.uz/.well-known/apple-app-site-association` and `.../assetlinks.json` returns real values (no `X-App-Links-Config: incomplete` header, no placeholder strings). Universal Links / Android App Links verify on a real device.

## Phase 4 — Store listing content (copy) finalized
**End result:** for both stores — app title, subtitle/short description, full description, keywords/category, support URL, marketing URL — written in Russian (primary) with positioning matching the current in-app copy: **business + youth**, not NGO (this was already corrected in-app and in `STORE-LAUNCH.md`; the store listing text must match, not regress to old NGO framing). Support URL and marketing URL point at live `fundingpro.uz` pages.

## Phase 5 — Visual assets produced
**End result:** screenshots captured per `STORE-LAUNCH.md`'s checklist (now 7 screens, including Opportunities Lab) at required device sizes for both stores, plus a Play Store feature graphic (1024×500). All assets show current app state — no stale NGO-era screens.

## Phase 6 — Compliance forms filled
**End result:** Apple App Privacy nutrition labels and Google Play Data Safety form are both submitted, using the pre-derived answers in `APP-PRIVACY-DATA-SAFETY.md` (no re-deriving what data the app collects — that analysis is already done and grounded in the actual code). Play Store content rating questionnaire completed.

## Phase 7 — First builds produced and manually uploaded once
**End result:** a production build exists for both platforms (`eas build --profile production`). The Android `.aab` has been uploaded **manually** through the Play Console UI at least once (Google's API hard-requires this before `eas submit` will work for Android at all — cannot be automated around). An iOS build is live in TestFlight.

## Phase 8 — Device QA sign-off
**End result:** the device-QA checklist already defined in `STORE-LAUNCH.md` (Clay UI verified on device, Maestro smoke passing locally, deep links working end-to-end on a physical device) is fully checked off. Version is bumped from `0.4.0` to `1.0.0` **only after** this phase passes, per the existing policy in that doc — not before.

## Phase 9 — Submitted for review
**End result:** `eas submit --platform ios` and `eas submit --platform android` have both run successfully against Phase 2's credentials. Both apps show a "Waiting for Review" (or equivalent) status in their respective consoles.

## Phase 10 — Review outcome handled
**End result:** either both apps are live on their stores, or every rejection reason has a corresponding fix committed and resubmitted — no rejection left unaddressed or unacknowledged.

---

## What NOT to do
- Do not bump the app version past `0.4.0` before Phase 8 passes — it's an explicit gate in `STORE-LAUNCH.md`, not a suggestion.
- Do not invent or guess values for `ascAppId`, `appleTeamId`, or the Android SHA-256 — they only exist after Phase 0/1 are real; placeholders in the codebase are intentional until then.
- Do not regress store copy or screenshots back to NGO-only framing — the product's current positioning is business + youth, already corrected in-app this cycle.
