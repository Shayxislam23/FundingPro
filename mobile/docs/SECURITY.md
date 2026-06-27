# Безопасность FundingPro Mobile

Документ описывает текущую модель безопасности мобильного приложения (v0.4.0+) и результаты аудита после hardening-релиза.

## Краткое резюме

| Область | Статус |
|--------|--------|
| Аутентификация | Clerk (`@clerk/clerk-expo`), JWT template `convex`, токены в Expo SecureStore (chunked adapter) |
| API | Bearer Convex JWT, `X-Client-Version`, серверная авторизация на всех `/api/v1/*` |
| Платежи | `returnUrl` только на сервере (`platform=mobile` → фиксированный deeplink) |
| Админ-панель | **Не в mobile** — только web (`fundingpro` dashboard) |
| Deep links | Валидация схемы/пути и формата токенов; `fundingpro://` + `https://www.fundingpro.uz/mobile/*` App Links |
| Транспорт | HTTPS к API и Clerk |
| Секреты | Нет service role / webhook secret в клиенте; Clerk publishable key — публичный по дизайну |

## Стек аутентификации (Clerk)

```text
Clerk Expo → getToken({ template: "convex" }) → Authorization: Bearer <jwt> → /api/v1
```

- Сессия управляется Clerk; refresh и logout через Clerk SDK.
- Токены кэшируются в SecureStore через `chunkedSecureStoreAdapter` (лимит Expo 2048 байт на ключ).
- Redirect после входа: `fundingpro://auth/callback` или `https://www.fundingpro.uz/mobile/auth/callback` (настроить в Clerk Dashboard).

## Находки (после исправлений)

### CRITICAL

| ID | Описание | Статус |
|----|----------|--------|
| C-01 | Клиент мог подменить `returnUrl` в checkout → open redirect / фишинг после оплаты | **Исправлено** — `resolveCheckoutReturnUrl()` только на сервере |
| C-02 | HTML-инъекция в email поддержки (web API) | **Исправлено** ранее — escape в `support-tickets/route.ts` |

### HIGH

| ID | Описание | Статус |
|----|----------|--------|
| H-02 | Clerk/legacy session > 2048 байт в SecureStore (тихая потеря сессии) | **Исправлено** — chunked SecureStore adapter |
| H-03 | Deep link auth принимал произвольные URL/токены | **Исправлено** — `callback-validation.ts` |
| H-04 | CSP `unsafe-eval` в production (web) | **Исправлено** — `unsafe-eval` только в dev |
| H-05 | CI не падал на Semgrep / npm audit high | **Исправлено** — отдельный job `security` |

### MEDIUM

| ID | Описание | Статус |
|----|----------|--------|
| M-02 | Custom scheme без Universal/App Links (hijack risk на Android) | **Открыто** — `.well-known` + env на web; device verify pending — см. `fundingpro/docs/SECURITY-ROADMAP.md` |
| M-03 | Нет certificate pinning для API | **Открыто** — ADR в Track 6 (`fundingpro/docs/SECURITY-ROADMAP.md`) |
| M-04 | Push token регистрация на backend | **Исправлено** — `registerAndSyncPushToken()` после Clerk login → `POST /me/push-token` |
| M-05 | Offline cache грантов в AsyncStorage (не секреты, но без шифрования) | **Принято** — публичные данные |

### LOW

| ID | Описание | Статус |
|----|----------|--------|
| L-01 | `unsafe-inline` в CSP (Next.js) | **Принято** — ограничение фреймворка |
| L-02 | In-app удаление аккаунта | **Частично закрыто** — `POST /api/v1/me/delete-request` из профиля; fallback support ticket — см. SECURITY-ROADMAP |
| L-03 | Sentry DSN в клиенте (публичный по дизайну) | **Принято** |

### Снято с mobile (v0.3.0)

| ID | Описание | Статус |
|----|----------|--------|
| H-01 | Админ-панель без биометрии | **N/A** — admin stack удалён из mobile |
| M-01 | Admin settings без auth headers | **N/A** — admin только в web |
| L-04 | Maestro E2E admin biometric gate | **N/A** — admin только в web |

## Соответствие OWASP MASVS (выборочно)

| MASVS | Требование | Реализация |
|-------|------------|------------|
| MSTG-STORAGE-1 | Чувствительные данные не в plaintext | Clerk tokens в SecureStore (+ chunking) |
| MSTG-STORAGE-2 | Нет секретов в коде/логах | EAS secrets; только publishable Clerk key в клиенте |
| MSTG-AUTH-1 | Серверная авторизация | Все мутации через `/api/v1` + Convex JWT |
| MSTG-AUTH-2 | Управление сессией | Clerk session lifecycle, logout очищает token cache |
| MSTG-NETWORK-1 | TLS | HTTPS по умолчанию |
| MSTG-NETWORK-4 | Нет доверия клиентским redirect | Server-side `returnUrl` |
| MSTG-PLATFORM-3 | Deep link validation | `parseAuthCallbackUrl` |
| MSTG-CODE-4 | SAST в CI | Semgrep job |
| MSTG-CODE-5 | Зависимости | `npm audit --audit-level=high` |

## Оставшиеся риски и roadmap

1. **Universal Links / App Links** — задайте `APPLE_TEAM_ID` и `ANDROID_RELEASE_SHA256` в Vercel; проверьте `.well-known` на device. Статус: **M-02 открыт** — [`fundingpro/docs/SECURITY-ROADMAP.md`](../../fundingpro/docs/SECURITY-ROADMAP.md).
2. **SSL pinning** — рассмотреть для production API (trade-off с ротацией сертификатов). Статус: **M-03 открыт**.
3. **Account deletion** — профиль вызывает `POST /api/v1/me/delete-request`; при сбое API — тикет в поддержку. Полный cascade + Clerk delete — backlog Track 6. Статус: **L-02 частично закрыт**.
4. **Rate limiting** — middleware на `/api/v1/ai/*` и `/api/v1/auth/*` (IP buckets + per-user AI limits). DB-backed buckets — backlog.
5. **Pen-test** — повторить после App Links live на device.

## Проверки для релиза

```bash
npm run typecheck --workspace=@fundingpro/mobile
npm run typecheck --workspace=fundingpro
npm test --workspace=fundingpro
```

См. также: `mobile/docs/RELEASE.md`, `fundingpro/scripts/security-audit-orchestrator.mjs`.
