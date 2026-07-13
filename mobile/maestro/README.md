# Maestro smoke tests — FundingPro Mobile

End-to-end UI smoke tests for the Expo dev client (`uz.fundingpro.app`). Flows live in this directory and target Russian UI copy from the app.

## Prerequisites

1. **Maestro CLI** — [install](https://maestro.mobile.dev/getting-started/installing-maestro)
2. **Development build** on a simulator/emulator or device (not Expo Go — Clerk + secure store need native modules)
3. **App env** — `mobile/.env` with a **Clerk development** publishable key (`pk_test_…`) and reachable `EXPO_PUBLIC_API_URL`
4. **Backend** — public grants flow calls the API; auth flow needs Clerk Email code enabled on the same Clerk app as web

Build and install once:

```bash
cd mobile
cp .env.example .env   # fill EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_API_URL
eas build --profile development --platform ios    # or android
# install the resulting .app / .apk on simulator or device
```

Start Metro while testing (if using a dev client that loads from packager):

```bash
npm run start
```

## Run smoke tests

From the **monorepo root**:

```bash
maestro test mobile/maestro/
```

From `mobile/`:

```bash
maestro test maestro/
```

Single flow:

```bash
maestro test mobile/maestro/public-grants.yaml
maestro test mobile/maestro/auth-login.yaml
maestro test mobile/maestro/onboarding-checklist.yaml
maestro test mobile/maestro/my-path.yaml
maestro test mobile/maestro/subscription-consent.yaml
```

Or from `mobile/`:

```bash
npm run maestro
npm run maestro:my-path
```

Interactive debug (step through UI):

```bash
maestro studio
```

## Flows

| File | What it checks |
|------|----------------|
| `public-grants.yaml` | Landing → tap «Публичные гранты» → grants screen header |
| `auth-login.yaml` | Landing → login → Clerk email OTP → dashboard «Главная» |
| `onboarding-checklist.yaml` | After login → home onboarding card «Первые шаги в FundingPro» |
| `my-path.yaml` | After login → «Пройти по шагам» → screen title «Мой путь» + first step |
| `subscription-consent.yaml` | After login → Ещё → Подписка → payment terms consent copy |

### `public-grants.yaml`

- No sign-in required.
- Requires `EXPO_PUBLIC_API_URL` to respond; an empty list («Гранты не найдены») still means navigation succeeded.
- Uses `clearState: true` so a previous session does not skip the public landing.

### `auth-login.yaml` (Clerk email OTP)

Automated OTP uses Clerk’s **test email** pattern (development instances only):

| Item | Value |
|------|--------|
| Email | `e2e+clerk_test@example.com` (override with `CLERK_TEST_EMAIL` in the flow `env`) |
| OTP | `424242` (override with `CLERK_TEST_OTP`) |

Clerk does not send a real email for `+clerk_test` addresses; the code is always `424242`. See [Clerk: Test emails and phones](https://clerk.com/docs/guides/development/testing/test-emails-and-phones).

**Requirements**

- Clerk **development** instance (`pk_test_…` in `.env`)
- Email verification code strategy enabled in Clerk Dashboard
- First run may **sign up** the test user; later runs sign in

**Production / manual OTP**

Production Clerk instances do not accept `+clerk_test` / `424242`. For manual QA without automation:

1. Run through the flow in Maestro Studio or stop `auth-login.yaml` after «Получить код».
2. Use a real inbox email, enter the code from email, tap «Подтвердить».
3. Confirm «Главная» appears.

Do not enable Clerk test mode on production.

### `onboarding-checklist.yaml`

- Runs `auth-login.yaml` first via `runFlow`.
- Expects the test user to have **incomplete onboarding** (checklist visible on home).
- If all steps are done, the card is hidden — use a fresh `+clerk_test` user or reset onboarding in backend.

### `my-path.yaml`

- Runs `auth-login.yaml`, taps **Пройти по шагам** on the home checklist.
- Asserts wizard screen title **«Мой путь»** and first step «Заполнить личный профиль».
- Same incomplete-onboarding prerequisite as `onboarding-checklist.yaml`.

### `subscription-consent.yaml`

- Runs `auth-login.yaml`, opens **Ещё → Подписка**.
- Asserts payment consent copy before checkout (no payment initiated).

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| App not found | Install dev build with bundle id `uz.fundingpro.app` |
| Stuck on «Загрузка…» (grants) | API down or wrong `EXPO_PUBLIC_API_URL` |
| «Email-код не настроен в Clerk» | Enable email code in Clerk → User & authentication |
| OTP step fails / invalid code | Not a dev instance, or email missing `+clerk_test` |
| «Главная» timeout after OTP | Convex/API unreachable after Clerk session |
| Wrong screen after launch | Remove app data or rely on `clearState: true` in flows |

## CI

The `mobile` job in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) installs Maestro via Homebrew when available and validates flow files. Full execution requires a dev-client `.app`:

```bash
export MAESTRO_APP_PATH=/path/to/FundingPro.app
maestro test mobile/maestro/ --format junit --output mobile/maestro-results.xml
```

Store submission checklist: [`mobile/docs/STORE-LAUNCH.md`](../docs/STORE-LAUNCH.md). Release builds: [`mobile/docs/RELEASE.md`](../docs/RELEASE.md).
