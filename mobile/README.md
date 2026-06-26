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
| `npm run lint` | TypeScript check (alias) |
| `npm run android` | Android emulator |
| `npm run ios` | iOS simulator |

Из корня monorepo:

```bash
npm run mobile:start
npm run mobile:typecheck
npm run contract:mobile-api   # требует запущенный fundingpro dev server
```

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

## EAS profiles

| Profile | Назначение |
|---------|------------|
| `development` | Dev client + simulator/APK |
| `preview` | Internal testing |
| `production` | App Store / Play Store |
