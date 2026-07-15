# Changelog — FundingPro Mobile

## [0.4.0] — Clay-lite UI + release prep

### Added
- **Clay-lite design**: canvas `#E8F0EA`, clay cards/pills, floating tab dock, hero gradient without clay overlay
- **App Links stubs**: iOS `associatedDomains` + Android `intentFilters` for `https://www.fundingpro.uz/mobile/*`
- **Account deletion**: in-app request flow via support ticket from profile screen
- **Web SEO**: metadata, Open Graph, JSON-LD on landing, grants, donors, pricing pages
- **Universal Links hosting**: `.well-known/apple-app-site-association` and `assetlinks.json` on web (env-driven Team ID / SHA-256)
- **Maestro** `my-path.yaml` for «Мой путь» wizard smoke
- **`secrets/README.md`**: local EAS submit credential drop folder (keys gitignored)

### Changed
- Version bump `0.3.0` → `0.4.0`
- Home progress copy + store review notes use «Мой путь» (individuals-first)
- `eas.json` Android submit: `track: internal` + `releaseStatus: draft` for safer first upload
- **Auth**: `@clerk/clerk-expo` → `@clerk/expo@3.7.5` so Metro resolves `@clerk/clerk-js` 6.x (no `/headless` export)

### User action required (EAS preview — not run in CI)
```bash
cd mobile
eas secret:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "<key>"
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://www.fundingpro.uz/api/v1"
eas build --profile preview --platform ios
eas build --profile preview --platform android
maestro test mobile/maestro/
```
Set Vercel `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256` (see `paste-secrets.sh` / `docs/POST-MERGE-APP-LINKS.md`) before production store submit.

## [0.3.0] — Feature parity + push + dashboard polish

### Added
- **Push**: register Expo push token to backend after Clerk login (`POST /me/push-token`)
- **Home dashboard**: stats grid, plan usage badge, applications preview, quick actions, match-grants teaser
- **ESLint**: `eslint-config-expo` + CI lint step for mobile workspace

### Changed
- **Auth**: migrated from Supabase OTP to Clerk (`@clerk/clerk-expo`); Convex JWT via template `convex` for `/api/v1`
- **Admin**: removed admin stack from mobile — admin panel is web-only (`fundingpro` dashboard)
- **Grants**: search, sector/country filters, pagination
- **AI Writer**: grant picker, plan limits, match-grants recommendations
- **Tracker**: application detail screen + status PATCH
- **Onboarding**: checklist on home + wizard screen
- **Public**: donors and stories from API
- **Docs**: README, SECURITY, RELEASE, Maestro flows updated for Clerk

### User action required
- Clerk Dashboard: redirect URI `fundingpro://auth/callback`, JWT template `convex`
- `eas login` + `eas init` (replace `projectId` in `app.json`)
- Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env` / EAS secrets
- Physical device + EAS dev build to verify push token registration

## [0.2.1] — Security hardening (post-audit)

### Security
- **Payments**: mobile client sends only `platform: "mobile"`; checkout `returnUrl` resolved server-side (`fundingpro://subscription/return`)
- **SecureStore**: chunked adapter for Supabase sessions larger than Expo 2048-byte limit
- **Admin**: biometric/PIN gate no longer fail-open when hardware exists but biometrics not enrolled
- **Auth deep links**: validate `fundingpro://auth/callback`, JWT shape, and OTP `token_hash` before session write
- **Admin settings**: use authenticated `api.adminSettings()` instead of raw fetch
- **Docs**: `mobile/docs/SECURITY.md` (RU), App Links / Universal Links section in `RELEASE.md`

### Backend (monorepo)
- CSP: remove `unsafe-eval` in production; document `unsafe-inline` tradeoff
- CI: dedicated `security` job — Semgrep + `npm audit --audit-level=high` fail the build
- Export `resolveCheckoutReturnUrl` from `@/lib/payments`

### Tests
- `fundingpro/tests/secure-store-chunking.test.mjs`
- `fundingpro/tests/auth-callback-validation.test.mjs`

## [0.2.0] — Phases 1–7 (full app scaffold)

### Phase 1 — Auth + Legal
- Supabase OTP auth with expo-secure-store session persistence
- Auth guard: unauthenticated → `(auth)`, authenticated away from auth
- Screens: login, forgot-password, reset-password, confirm, callback (deep link `fundingpro://auth/callback`)
- Legal consent: status + submit, ReconsentBanner before payments
- Legal WebView for 5 URLs under `/(legal)/[doc]`
- `GET /api/v1/auth/admin-check` for admin flag
- Maestro `maestro/auth-login.yaml`

### Phase 2 — Dashboard core
- Tab navigator: Home, Grants, Eligibility, AI, More
- React Query + pull-to-refresh on main screens
- Grants list/detail/save, eligibility check, tracker applications
- Profile organization GET/PATCH, consultants + orders
- Extended `@fundingpro/api-types` and `mobile/lib/api/client.ts`

### Phase 3 — Complex features
- AI Writer tab with generate + history + disclosure screen
- Documents: expo-document-picker upload, list, download
- Subscription: plans, Uzum app (`Linking`) + checkout (`expo-web-browser`), payment terms, return polling
- Support tickets create/list
- Backend: mobile `returnUrl`/`platform` on payments intent + checkout

### Phase 4 — Admin (14 screens)
- Admin stack gated by `isAdmin` + optional `expo-local-authentication`
- List views for users, funnel, applications, consents, orgs, grants, donors, consultant-orders, payments, ai-logs, support, audit, settings

### Phase 5 — Public + polish
- Landing, donors, stories, how-it-works, public grants
- Push notifications scaffold (`expo-notifications`)
- Offline grants cache via AsyncStorage
- RU strings in `lib/i18n.ts`
- FlashList on long lists

### Phase 6 — Backend hardening
- Mobile `returnUrl` in Uzum checkout
- `X-Client-Version` header on API client
- Extended contract tests
- README updates

### Phase 7 — Release prep
- EAS profiles verified in `eas.json`
- `mobile/docs/RELEASE.md` App Store compliance notes
- Maestro flows: auth-login, public-grants

### Dependencies added
- expo-web-browser, expo-document-picker, expo-notifications, expo-local-authentication
- react-native-webview, @react-native-async-storage/async-storage, @shopify/flash-list

### User action required
- `eas login` + `eas init` (replace projectId)
- Configure `.env` / EAS secrets (API, Supabase, optional Sentry)
- Apple/Google developer accounts for store submission
- Supabase redirect URL: `fundingpro://auth/callback`

## [0.1.0] — Phase 0 infrastructure

### Added
- Monorepo workspace `@fundingpro/mobile`
- Expo Router, NativeWind, API client stub, EAS profiles, contract tests
