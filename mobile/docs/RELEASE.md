# FundingPro Mobile — Release Checklist (v0.3.0)

## What's new in v0.3.0

- **Feature parity**: grants search/filters, AI writer + match-grants, tracker detail, onboarding checklist, public donors/stories API
- **Push notifications**: Expo token registered to backend via `POST /api/v1/me/push-token` after Clerk login
- **Home dashboard**: stats, plan usage, applications preview, quick actions, match-grants teaser
- **Tooling**: ESLint (`eslint-config-expo`) + CI lint step

## Prerequisites (user action required)

1. **EAS**: Run `eas login` and `eas init` — replace `projectId` in `app.json` (`REPLACE_AFTER_eas_init`)
2. **Env**: Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in EAS secrets
3. **Clerk**: Add redirect URL `fundingpro://auth/callback` in Clerk Dashboard → Paths; JWT template `convex`
4. **Push**: EAS build configures Expo push credentials automatically; physical device required to test token registration
5. **Apple**: Apple Developer account, App Store Connect app, provisioning profiles
6. **Google**: Play Console app, signing key (EAS manages or upload your own)
7. **Payments**: Backend `PAYMENTS_ENABLED=true`, Uzum credentials; server resolves `fundingpro://subscription/return` from `platform=mobile` (client does not send `returnUrl`)

## App Links / Universal Links (recommended for production)

Custom scheme `fundingpro://` works for development. For production, configure verified links so only your app handles auth/payment callbacks:

### iOS (Universal Links)

1. Apple Developer → Identifiers → App ID → enable **Associated Domains**
2. Add domain association file at `https://www.fundingpro.uz/.well-known/apple-app-site-association`
3. In `app.json` under `ios.associatedDomains`: `["applinks:www.fundingpro.uz"]`
4. Clerk redirect: `https://www.fundingpro.uz/mobile/auth/callback` (or keep custom scheme if preferred)

### Android (App Links)

1. Play Console / `app.json` → `android.intentFilters` with `autoVerify: true` for `https://www.fundingpro.uz/mobile/*`
2. Host `https://www.fundingpro.uz/.well-known/assetlinks.json` with your signing certificate SHA-256
3. Test: `adb shell am start -a android.intent.action.VIEW -d "https://www.fundingpro.uz/mobile/auth/callback"`

Deep link handler validates `fundingpro://auth/callback` and Clerk session before granting app access.

## App Store compliance

- Privacy Policy URL: https://www.fundingpro.uz/legal/privacy
- Terms: https://www.fundingpro.uz/legal/offer
- AI disclosure in-app: Dashboard → AI → «Раскрытие AI»
- Payment terms shown before checkout
- Sign in with Email OTP (no social login required for review)
- Account deletion: contact support (document in App Review notes if no in-app delete yet)

## Build commands

```bash
cd mobile
eas build --profile preview --platform all
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```

## Deep links to test

- `fundingpro://auth/callback` — Clerk auth
- `fundingpro://subscription/return?paymentId=<id>` — payment return

## Maestro E2E

```bash
maestro test mobile/maestro/
```

## Versioning

- Current release: **0.3.0** (`app.json`, `package.json`)
- `app.json` version + EAS `autoIncrement` for production builds
- `X-Client-Version: mobile-<version>` sent on API requests
