# EAS Preview build

Preview internal builds before App Store / Play Store submission. Requires EAS CLI and Expo account.

## Prerequisites

```bash
npm i -g eas-cli
eas login
```

EAS project is linked in `app.json` (`extra.eas.projectId`).

## Secrets (one-time per project)

```bash
cd mobile
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_…"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://www.fundingpro.uz/api/v1"
```

Verify (logged in as project owner):

```bash
eas secret:list
# or: eas env:list
```

As of last check: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set; add `EXPO_PUBLIC_API_URL` if missing (preview profile also sets API URL in `eas.json` env).

Optional: `EXPO_PUBLIC_SENTRY_DSN`

Clerk Dashboard: redirect `fundingpro://auth/callback`, JWT template `convex`.

## Build

```bash
cd mobile
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

Install the build on device/simulator, then from monorepo root:

```bash
npm run mobile:dev
```

Reload JS in the dev client.

## Maestro smoke

```bash
maestro test mobile/maestro/
```

Requires [Maestro CLI](https://maestro.mobile.dev/) installed.

## Checklist before production

- Set Vercel env: `APPLE_TEAM_ID`, `ANDROID_RELEASE_SHA256` (bundle id reads from `mobile/app.json` or `IOS_BUNDLE_ID`)
- Verify `.well-known` — no `X-App-Links-Config: incomplete` header when env is set
- Run preview smoke: `mobile/docs/EAS-SMOKE.md`
- Run `eas build --profile production` then `eas submit`

See also `mobile/docs/RELEASE.md` and `mobile/CHANGELOG.md`.
