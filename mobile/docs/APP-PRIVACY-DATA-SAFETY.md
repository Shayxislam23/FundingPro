# App Privacy / Data Safety — answer sheet for store forms

Both stores require these answered **in their dashboards** (Apple App Store
Connect → App Privacy; Google Play Console → App content → Data safety) —
they cannot be set from code. This sheet gives the factual answers derived
from what the app actually does, so whoever fills the forms doesn't have to
re-derive them from the source.

Verified by reading `mobile/lib/sentry.ts`, `mobile/lib/clerk.ts`,
`mobile/lib/secure-store-adapter.ts`, `mobile/app/(app)/lab.tsx`,
`mobile/app/(app)/subscription/*`, and `fundingpro/lib/payments/providers/registry.ts`
as of 2026-07-08.

## Data collected

| Category | Collected? | What / where | Linked to identity? | Used for tracking? |
|---|---|---|---|---|
| Contact info (email) | Yes | Sign-in via Clerk (email OTP) | Yes | No |
| Contact info (phone) | Optional | Lab profile `telegram` field is a handle, not a phone number; no phone field is collected elsewhere in-app | Yes (if provided) | No |
| Name | Optional | Lab profile `fullName` field, self-reported | Yes | No |
| User content | Yes | Grant applications, AI proposal drafts, Lab onboarding answers (age, city, education status, interests) | Yes | No |
| Identifiers | Yes | Clerk user ID (auth), Convex user record ID | Yes | No |
| Diagnostics (crash logs, performance) | Yes | Sentry (`@sentry/react-native`) — stack traces, app version, device model, OS version | No — `Sentry.init` does not call `setUser`, no default-PII flag is enabled, so email/name are not attached to crash events | No |
| Financial info (payment) | No, not directly | Checkout happens via PSP redirect (Uzum/Payme/Click web flow); the app never receives or stores card numbers/PANs | — | — |
| Precise/approximate location | No | Not requested anywhere in the codebase | — | — |
| Photos/camera | No | `expo-document-picker` is used for document upload (CV, etc.) — this is a file picker, not a camera/photo-library permission; no `expo-image-picker` or camera usage exists | — | — |

## Third parties data is shared with

- **Clerk** (authentication) — email, auth session data. Clerk's own privacy policy governs their processing.
- **Sentry** (crash/performance monitoring) — device diagnostics and stack traces, not account identity (see above).
- **Convex** (first-party backend) — all in-app content (applications, Lab profile, proposals) — this is FundingPro's own database, not a third-party share.
- **Payment service providers** (Uzum, Payme, Click) — user is redirected to the PSP's own checkout; FundingPro does not transmit card data to them from app code because the app never holds it.

## Data deletion

Account deletion is a support-ticket flow today (Profile → «Запросить удаление аккаунта»), not self-service in-app deletion. Both stores' newer policies (Apple guideline 5.1.1(v), Google Play account deletion policy) increasingly expect **in-app** self-service deletion, not just a support request — flagged here as a gap to close before relying on the ticket flow long-term; not fixed in this pass because it requires a product decision on data retention (what happens to grant applications tied to a deleted account), which is a business call, not a code default I should silently make.

## Suggested Apple App Privacy answers (summary)

- Data used to track you: **None**
- Data linked to you: Contact Info (email, optional name), User Content, Identifiers
- Data not linked to you: Diagnostics

## Suggested Google Play Data Safety answers (summary)

- Does your app collect or share any of the required user data types: **Yes**
- Personal info: Email address, Name (optional) — collected, not shared
- App activity: In-app actions (Lab progress, applications) — collected, not shared
- App info and performance: Crash logs, diagnostics (Sentry) — collected, not shared
- Is data encrypted in transit: **Yes** (HTTPS to Convex/Clerk/Sentry)
- Can users request data deletion: **Yes**, via support ticket (see gap noted above)
