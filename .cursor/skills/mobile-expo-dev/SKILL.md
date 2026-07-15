---
name: mobile-expo-dev
description: Starts and smoke-tests the FundingPro Expo mobile app (Metro, dev client, env, Maestro). Use when launching mobile via Expo, running npm run mobile:dev, rebuilding the iOS dev client, or verifying the mobile workspace.
disable-model-invocation: true
---

# Mobile Expo Dev

## Quick start

From the monorepo root:

```bash
npm install
cp mobile/.env.example mobile/.env   # if mobile/.env is missing
npm run mobile:dev
```

This runs `mobile/scripts/dev-client.sh` → `npx expo start --dev-client --clear` from `mobile/` (or `$FUNDINGPRO_MOBILE_DIR` / `~/Projects/FundingPro/mobile` when present).

## Env

- Copy from `mobile/.env.example`. Required: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- Do not commit real Clerk keys. EAS Secrets hold the key for cloud builds.
- App uses development build (`expo-dev-client`), not Expo Go, when native modules matter.

## Healthy Metro signals

- `env: load .env`
- `Starting Metro Bundler`
- QR / deep link: `exp+fundingpro://expo-development-client/?url=...`
- `Web: http://localhost:8081`
- Status check: `curl -s http://localhost:8081/status` → `packager-status:running`

## Smoke test (cloud / no simulator)

Monorepo Metro serves the entry under the `/mobile/` prefix:

```bash
# Metro up
curl -s http://localhost:8081/status

# JS bundle for expo-router entry (iOS)
curl -s -o /tmp/fp-ios.bundle -w "%{http_code}\n" --max-time 180 \
  "http://localhost:8081/mobile/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable"
# Expect HTTP 200 and a large JS file (not JSON UnableToResolveError)
```

Web HTML is at `http://localhost:8081/` (needs `react-native-web` for a full web bundle). Prefer iOS/Android bundle checks for this app.

## Clerk monorepo note

Mobile uses `@clerk/expo` (not `@clerk/clerk-expo`). Align with root overrides for `@clerk/clerk-js` 6.x.

- Provider / `useAuth` / `getClerkInstance`: import from `@clerk/expo`
- Email OTP `useSignIn` / `useSignUp` (isLoaded, prepareFirstFactor, etc.): import from `@clerk/expo/legacy`
- If Metro fails on `@clerk/clerk-js/headless`, migrate off `@clerk/clerk-expo`

## Related commands

| Command | Purpose |
|---------|---------|
| `npm run mobile:dev` | Metro + dev client, cache cleared |
| `npm run mobile:rebuild-ios` | Native iOS rebuild via `expo run:ios` |
| `npm run mobile:maestro` | Maestro flows under `mobile/maestro/` |
| `cd mobile && npx expo start` | Plain Expo start (no `--dev-client`) |

## Docs

- `mobile/README.md` — EAS, env, clay-lite notes
- `mobile/AGENTS.md` — read Expo v56 docs before code changes
- Root `AGENTS.md` — typical loop: Metro → reload → optional prod seed → optional native rebuild

## Do not

- Run Expo from the monorepo root as the project directory (Metro project root must be `mobile/`).
- Use `npx convex deploy` for local mobile API work; use `npx convex dev` in `fundingpro/` when changing Convex.
- Commit `mobile/.env` with real secrets.
