# FundingPro Mobile

Expo (React Native) приложение FundingPro — monorepo workspace.

## Требования

- Node.js 20+
- npm 10+
- [Expo CLI](https://docs.expo.dev/) / `npx expo`
- Для dev build: [EAS CLI](https://docs.expo.dev/build/setup/) (`npm i -g eas-cli`)

## Быстрый старт

Из корня monorepo:

```bash
npm install
cd mobile
cp .env.example .env
npm run start
```

Для нативных модулей (secure store, deep links) используйте **development build**, не Expo Go (см. [EAS setup](#eas-setup) ниже).

## EAS setup

Однократная настройка Expo Application Services для dev/preview/production builds.

### 1. Установка и вход

```bash
npm i -g eas-cli
eas login
```

Используйте аккаунт Expo с доступом к организации проекта.

### 2. Привязка проекта (`eas init`)

Из каталога `mobile/`:

```bash
cd mobile
eas init
```

Команда создаст или привяжет Expo project и запишет `projectId` в `app.json` → `expo.extra.eas.projectId`.

> **Важно:** не запускайте `eas init` без своих credentials. Если в репозитории всё ещё placeholder `REPLACE_AFTER_eas_init` — выполните `eas init` локально после `eas login`; до этого EAS build не будет работать.

### 3. EAS Secrets (Clerk)

`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` **не хранится в git** и не задаётся в `eas.json`. Добавьте через EAS Secrets (один раз на project):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_test_..." 
```

Для production используйте production Clerk publishable key. Локально тот же ключ — в `mobile/.env` (см. `.env.example`).

Опционально: `EXPO_PUBLIC_SENTRY_DSN` тоже можно вынести в secrets для preview/production.

### 4. Первый dev build

```bash
eas build --profile development --platform android
# или iOS simulator:
eas build --profile development --platform ios
```

После сборки установите dev client на устройство/эмулятор и запускайте `npm run start` с подключением к dev server.

### 5. Проверка конфигурации

| Файл | Что проверить |
|------|----------------|
| `app.json` | `extra.eas.projectId` — реальный UUID после `eas init` |
| `assets/` | `icon.png`, Android adaptive icons, `favicon.png` |
| `eas.json` | profiles `development` / `preview` / `production` |
| EAS Secrets | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` задан |

## Переменные окружения

Скопируйте `.env.example` → `.env`:

| Переменная | Описание |
|------------|----------|
| `EXPO_PUBLIC_API_URL` | Base URL API (`/api/v1` включён в путь) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (то же приложение, что web) |
| `EXPO_PUBLIC_SENTRY_DSN` | Опционально — crash reporting |

Мобильное приложение использует **Clerk** (не Supabase). Сессия и токены хранятся через `@clerk/clerk-expo` + chunked SecureStore adapter.

### Настройка Clerk

1. В [Clerk Dashboard](https://dashboard.clerk.com) используйте то же приложение, что и web FundingPro.
2. Добавьте redirect URI: `fundingpro://auth/callback` (custom scheme, см. Deep links).
3. Создайте JWT template **`convex`** — тот же шаблон, что для web; mobile передаёт Bearer JWT в `/api/v1`.
4. Для EAS builds задайте `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` через [EAS Secrets](https://docs.expo.dev/build-reference/variables/) (не коммитьте ключ в git).

Подробнее: `fundingpro/README.md`, `mobile/lib/clerk.ts`.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run start` | Expo dev server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run android` | Android emulator |
| `npm run ios` | iOS simulator |

Из корня monorepo:

```bash
npm run mobile:dev              # Metro --dev-client --clear (Projects path)
npm run mobile:rebuild-ios      # expo run:ios dev client rebuild
npm run convex:seed:prod        # prod Convex seed + verify (needs CONVEX_DEPLOY_KEY)
npm run mobile:start            # обычный expo start
npm run mobile:typecheck
npm run contract:mobile-api     # требует запущенный fundingpro dev server
```

### Dev workflow (Metro → Reload → seed → rebuild)

1. **Metro:** `npm run mobile:dev` — поднимает dev server для development build (не Expo Go).
2. **Reload:** в dev client на устройстве/симуляторе — Reload JS (⌘R в iOS simulator).
3. **Prod seed (опционально):** `npm run convex:seed:prod` — только с `CONVEX_DEPLOY_KEY` в `fundingpro/.env.production.local`.
4. **Native rebuild (опционально):** `npm run mobile:rebuild-ios` — после добавления native-модулей (`expo-linear-gradient`, `expo-haptics`, …).

Скрипты `mobile:dev` и `mobile:rebuild-ios` предпочитают ASCII-путь `~/Projects/FundingPro/mobile` (rsync из основного репозитория). Переопределение: `FUNDINGPRO_MOBILE_DIR=/path/to/mobile`.

## Deep links

Scheme: `fundingpro://`

| Path | Назначение |
|------|------------|
| `fundingpro://auth/callback` | Clerk auth callback |
| `fundingpro://subscription/return?paymentId=` | Uzum payment return |

## App structure

| Group | Описание |
|-------|----------|
| `(public)` | Landing, grants, donors — без авторизации |
| `(auth)` | Login, forgot/reset password, confirm (Clerk) |
| `(legal)` | WebView юридических документов |
| `(app)` | Dashboard (tabs + stack screens) |

Админ-панель доступна только в web-приложении (`fundingpro`), не в mobile.

## Maestro E2E

```bash
maestro test mobile/maestro/
```

## Workspace packages

- `@fundingpro/shared` — format-grant, sector-labels, validation
- `@fundingpro/api-types` — Zod schemas для API

## Каталог грантов и доноров (backend seed)

Публичные экраны **Гранты** и **Доноры** читают `GET /api/v1/grants` и `GET /api/v1/donors`. Если Convex пуст, mobile показывает статический demo-каталог из `lib/public-fallback.ts` (last resort).

Чтобы заполнить реальные данные локально:

```bash
cd fundingpro
npx convex dev          # в отдельном терминале
npm run convex:seed     # idempotent — пропускает, если donors уже есть
```

Seed создаёт **5 доноров** (UNDP, EU, GIZ, World Bank, Swiss Embassy), **30 активных грантов** с требованиями и **6 тарифных планов** (`SEED_PLANS` в `convex/seedData.ts`). Не используйте `npx convex deploy` для seed в dev — только `convex dev` + `convex:seed`.

### Production seed (только с deploy key)

**Не запускайте prod seed без `CONVEX_DEPLOY_KEY`** — без ключа команда не должна выполняться (нет доступа к production Convex).

1. Добавьте `CONVEX_DEPLOY_KEY` в `fundingpro/.env.production.local` (ключ из Convex Dashboard → Settings → Deploy Key).
2. Из `fundingpro/`:
   ```bash
   npm run convex:seed
   ```
   или `node scripts/production-next-steps.mjs`.
3. Проверка: `curl https://www.fundingpro.uz/api/v1/plans` — ожидается 6 планов, не пустой массив.

До seed prod API отдаёт пустые `plans`/`donors` — mobile показывает fallback из `lib/public-fallback.ts`.

## Daily dev workflow (monorepo)

From the **repository root** (recommended order):

1. **Metro (dev client)** — `npm run mobile:dev`  
   Runs `expo start --dev-client --clear`. Uses `~/Projects/FundingPro/mobile` when that directory exists (ASCII path for native tooling); otherwise the repo `mobile/` folder.

2. **Reload JS** — open the installed dev client on simulator/device and reload (shake menu → Reload, or `r` in the Metro terminal).

3. **Optional: production catalog seed** — `npm run convex:seed:prod`  
   Requires `CONVEX_DEPLOY_KEY` in `fundingpro/.env.production.local`. Seeds Convex and verifies `https://www.fundingpro.uz/api/v1/plans`.

4. **Optional: rebuild iOS dev client** — `npm run mobile:rebuild-ios`  
   Needed after adding/updating native modules (`expo-linear-gradient`, haptics, sharing, etc.). Same Projects-path fallback as Metro.

| Root script | Script file |
|-------------|-------------|
| `npm run mobile:dev` | `mobile/scripts/dev-client.sh` |
| `npm run mobile:rebuild-ios` | `mobile/scripts/rebuild-ios-dev-client.sh` |
| `npm run convex:seed:prod` | `fundingpro/scripts/seed-production-safe.mjs` |

Override Projects copy: `PROJECTS_MOBILE=/path/to/mobile npm run mobile:dev`.


## Dev client vs Metro-only JS

Expo Go и `npm run start` без dev client загружают только JavaScript через Metro. **Native-модули не подхватываются** без пересборки бинарника приложения.

| Режим | Что работает | Native modules |
|-------|----------------|----------------|
| Expo Go / Metro-only | JS, большинство Expo SDK | ❌ `expo-linear-gradient`, `expo-haptics`, `expo-sharing` и др. |
| Development build (dev client) | JS + скомпилированные native deps | ✅ |

Premium UI (градиенты hero, haptic feedback на кнопках, share sheet) требует **development build**:

```bash
# Локально (simulator / подключённое устройство) — из ASCII-пути, напр. ~/Projects/FundingPro/mobile
cd mobile
npx expo run:ios
# Android:
npx expo run:android
```

Облачная сборка dev client (EAS):

```bash
cd mobile
eas build --profile development --platform ios
# или Android APK:
eas build --profile development --platform android
```

После установки dev client на устройство/симулятор запускайте `npm run start` и открывайте приложение через dev client (не Expo Go).

## EAS profiles

| Profile | Назначение |
|---------|------------|
| `development` | Dev client + simulator/APK |
| `preview` | Internal testing |
| `production` | App Store / Play Store |
