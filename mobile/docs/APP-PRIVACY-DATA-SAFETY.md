# App Privacy / Data Safety — answer sheet for store forms

Fill these **in the store dashboards** (not in code):
- Apple: App Store Connect → App Privacy
- Google Play: App content → Data safety (+ content rating questionnaire)

Answers derived from mobile + web payment code as of 2026-07-13. Sources: Clerk auth, Sentry, SecureStore, profile/onboarding, documents picker, PSP redirect checkout.

## Data collected

| Category | Collected? | What / where | Linked to identity? | Used for tracking? |
|---|---|---|---|---|
| Contact info (email) | Yes | Sign-in via Clerk (email OTP) | Yes | No |
| Contact info (phone) | No (Telegram handle optional on «Мой путь» profile, not a phone number) | Lab / onboarding profile fields | Yes if provided | No |
| Name | Optional | Personal / lab profile `fullName`, self-reported | Yes | No |
| User content | Yes | Grant applications, AI drafts, onboarding answers (city, education, interests), uploaded documents (CV, etc.) | Yes | No |
| Identifiers | Yes | Clerk user ID, Convex user id | Yes | No |
| Diagnostics | Yes | Sentry (`@sentry/react-native`) if enabled — stack traces, app version, device/OS | No by default (no `setUser` / no default PII flag) | No |
| Financial info | No directly | Checkout is PSP redirect (Uzum / Payme / Click); app never holds PAN/card data | — | — |
| Location | No | Not requested | — | — |
| Photos / camera | No | `expo-document-picker` for files only — no camera / photo-library permission | — | — |

## Third parties

- **Clerk** — email, auth session (their privacy policy applies)
- **Sentry** — diagnostics only (if configured)
- **Convex** — first-party backend (not a third-party “share”)
- **PSP (Uzum / Payme / Click)** — user leaves the app to PSP checkout; FundingPro does not send card data from app code

## Data deletion

In-app self-service: Profile → «Запросить удаление аккаунта» calls `POST /api/v1/me/delete-request` directly (no manual ticket). The account is marked for deletion immediately; a 30-day grace period follows per the privacy policy, after which a daily cron (`convex/accountErasure.ts`) deletes the Clerk auth identity via the Clerk Backend API and purges all Convex-side data (applications, documents, push tokens, org memberships) and scrubs PII. Both steps are automatic — no manual ops step remains (fixed 2026-07-14).

## Suggested Apple App Privacy answers

- Data used to track you: **None**
- Data linked to you: Contact Info (email, optional name), User Content, Identifiers
- Data not linked to you: Diagnostics

## Suggested Google Play Data Safety answers

- Collects/shares required data types: **Yes**
- Personal info: Email, Name (optional) — collected, not shared with advertisers
- App activity: In-app actions (onboarding, applications) — collected, not shared
- App info and performance: Crash logs / diagnostics — collected, not shared
- Encrypted in transit: **Yes** (HTTPS)
- Users can request deletion: **Yes** — in-app self-service, full auth + data purge automated

## Content rating (Play)

Typical answers for this app: no gambling, no user-generated social feed moderated like a network, informational finance/education tooling for adults; complete the official questionnaire honestly based on current features (grants discovery + AI writing assistant + document upload).
