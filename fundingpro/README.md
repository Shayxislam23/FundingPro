# FundingPro

AI-платформа для поиска международных грантов, проверки соответствия требованиям и подготовки заявок.

**Компания:** ООО «FUNDINGPRO» / "FUNDINGPRO" MCHJ (STIR: 313 116 567)
**Регистрация ПО:** DGU No. 61712 (27.03.2026, заявка DT 202602875)
**Регистрация юрлица:** 18.06.2026, подтверждение № 3174142
**Основатель:** Shayxislam Seytibaev
**GitHub:** [Shayxislam23/FundingPro](https://github.com/Shayxislam23/FundingPro)

---

## Стек

| Слой | Технология |
|------|------------|
| Frontend + Backend | Next.js 14 App Router |
| UI | React 18 + Tailwind CSS + Radix UI |
| БД | PostgreSQL (Supabase) |
| Auth | Supabase Auth (Email OTP) |
| Email | Resend (info@fundingpro.uz) |
| ORM / Schema | Supabase migrations (runtime); `prisma/schema.prisma` — reference only |
| Язык | TypeScript |
| Деплой | Vercel |

---

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone https://github.com/Shayxislam23/FundingPro.git
cd FundingPro
npm install
```

### 2. Переменные окружения

```bash
cp .env.example .env.local
# Заполни .env.local
```

### 3. База данных

**Локально (Docker, без Supabase CLI):**

```bash
docker compose up -d
npm run db:init          # сброс схемы + миграция + seed
npm run dev
```

**Авторизация:** Supabase Email OTP (6-значный код на email).

Локально OTP уходит на **реальный inbox** через Resend (SMTP в `supabase/config.toml`):

```bash
npm run supabase:start   # подхватывает RESEND_API_KEY из .env.local
npm run dev
```

Откройте `/auth` → введите email → код придёт в Gmail (проверьте «Спам»).

Fallback без Resend: закомментируйте `[auth.email.smtp]` в `config.toml` — тогда коды только в Mailpit (http://127.0.0.1:54324).

**Supabase (production / staging):**

```bash
supabase link
supabase db push         # применить миграции
DATABASE_URL=... npm run db:seed
```

**Скрипты:**

| Команда | Описание |
|---------|----------|
| `npm run setup` | Docker + `db:init` |
| `npm run db:init` | Миграция + seed (по умолчанию `DB_FRESH=true` — сброс public schema) |
| `npm run test` | Unit-тесты |
| `npm run test:smoke` | Smoke-тесты API (нужен `npm run dev`; auth опционально через `SMOKE_AUTH=1`) |
| `npm run deploy:check` | Проверка env перед деплоем на Vercel |
| `npm run deploy:prep` | typecheck + tests + lint + deploy:check |
| `npm run lint` | ESLint |

Миграции: `supabase/migrations/`
Seed-данные: `supabase/seed.sql` (5 доноров, 30 грантов, 6 тарифов, 5 консультантов)

### 4. Запуск

```bash
npm run dev
# http://localhost:3000
```

---

## Environment Variables

### Обязательные

```env
# Supabase — supabase.com/dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database — Supabase → Settings → Database → Connection string
# pgBouncer URL (транзакции)
DATABASE_URL=postgresql://postgres:[password]@db.your-project-id.supabase.co:6543/postgres?pgbouncer=true
# Прямое подключение (для миграций)
DIRECT_URL=postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=info@fundingpro.uz
```

### Опциональные

```env
# AI (если не указаны — используется MockProvider)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=mock   # openai | anthropic | mock

# Платежи Uzum Bank (выключены до sandbox-тестов)
PAYMENTS_ENABLED=false
PAYMENT_PROVIDER=uzum
PAYMENT_INTEGRATION_STATUS=pending_integration
# UZUM_MERCHANT_SERVICE_ID= ...
# UZUM_MERCHANT_LOGIN= ...
# UZUM_MERCHANT_PASSWORD= ...
# UZUM_CHECKOUT_TERMINAL_ID= ...
# UZUM_CHECKOUT_SECRET= ...
# USD_UZS_RATE=12800
```

---

## Настройка Supabase

1. Создай проект на [supabase.com](https://supabase.com)
2. **Settings → API** → скопируй URL и publishable key
3. **Settings → Database** → Connection string → скопируй `DATABASE_URL` (port 6543) и `DIRECT_URL` (port 5432)
4. **Authentication → Settings → SMTP** → включи Custom SMTP (hosted Supabase, не локальный `config.toml`):
   - Host: `smtp.resend.com`, Port: `465`, User: `resend`, Password: Resend API Key
   - Sender: `info@fundingpro.uz`
5. **Storage** → создай bucket `documents`
6. Запусти `supabase db push` для применения миграций

---

## Настройка Resend

1. Зарегистрируйся на [resend.com](https://resend.com)
2. **Domains** → добавь и верифицируй `fundingpro.uz`
3. **API Keys** → создай ключ → вставь в `RESEND_API_KEY`

---

## Деплой на Vercel

### Подготовка

```bash
cp .env.production.example .env.production.local  # шаблон для Vercel (без секретов в git)
npm run deploy:prep   # typecheck + tests + lint + deploy:check
```

```mermaid
flowchart LR
  subgraph prep [Подготовка]
    A[deploy:prep] --> B[supabase link]
  end
  subgraph db [База]
    B --> C[supabase db push]
    C --> D[npm run db:seed]
  end
  subgraph auth [Auth и почта]
    D --> E[Supabase SMTP Resend]
    E --> F[Storage bucket documents]
  end
  subgraph vercel [Vercel]
    F --> G[vercel env vars]
    G --> H[vercel --prod]
  end
```

### Пошаговый чеклист

| # | Шаг | Команда / действие |
|---|-----|-------------------|
| 1 | Проверка перед деплоем | `npm run deploy:prep` |
| 2 | Привязка Supabase | `supabase link --project-ref <YOUR_PROJECT_ID>` *(вручную)* |
| 3 | Миграции БД | `supabase db push` |
| 4 | Seed-данные | `DATABASE_URL="..." npm run db:seed` |
| 5 | SMTP в Supabase | Dashboard → Authentication → SMTP → Resend (`smtp.resend.com:465`) |
| 6 | Storage | Dashboard → Storage → bucket `documents` |
| 7 | Деплой | `vercel --prod` или push в `main` *(вручную)* |

**Автоматизация (после заполнения ключей):**

```bash
node scripts/setup-production-env.mjs   # шаблон .env.production.local
# заполните Supabase keys в .env.production.local
npm run deploy:production               # env → Vercel, миграции, vercel --prod
```

Supabase project: `xgvwfnfifzsgscwvtcnz` — [Dashboard](https://supabase.com/dashboard/project/xgvwfnfifzsgscwvtcnz)

```bash
npm i -g vercel
vercel --prod
```

**Важные настройки в Vercel Dashboard → Settings → Environment Variables:**

| Переменная | Обязательно |
|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ |
| `DATABASE_URL` | ✅ (для миграций/seed) |
| `RESEND_API_KEY` | ✅ |
| `RESEND_FROM_EMAIL` | ✅ |
| `ADMIN_EMAILS` | ✅ (email админов через запятую) |
| `AI_PROVIDER` | mock / openai / anthropic |
| `PAYMENTS_ENABLED` | false |
| `PAYMENT_INTEGRATION_STATUS` | pending_integration |

**После первого деплоя — применить схему БД:**
```bash
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
DATABASE_URL="..." npm run db:seed
```

> ⚠️ Не храните секреты в `vercel.json` — только в Environment Variables панели Vercel.

**Build Command:** `npm run build`

---

## Команды

```bash
npm run dev           # Dev сервер
npm run build         # Сборка
npm run lint          # Линтер
npm run typecheck     # TypeScript проверка
npm run check         # typecheck + unit tests
npm test              # Unit-тесты
npm run test:smoke    # Smoke API (нужен dev server)
npm run deploy:prep    # typecheck + tests + lint + deploy:check
npm run deploy:check   # Только проверка env перед деплоем на Vercel
npm run db:seed       # Только seed
supabase db push      # Применить миграции на remote
```

---

## Платёжная интеграция (Uzum Bank)

> По умолчанию **`PAYMENTS_ENABLED=false`** — включайте только после sandbox-тестов с реальными credentials от Uzum.

FundingPro поддерживает два канала оплаты подписки через [Uzum Bank](https://developer.uzumbank.uz/):

| Канал | Назначение | API |
|-------|------------|-----|
| **Merchant API** | Оплата из приложения Uzum Bank | Inbound webhooks: `/check`, `/create`, `/confirm`, `/reverse`, `/status` |
| **Checkout API** | Оплата картой на сайте | Outbound: `payment.register` + return URL |

### Предусловия

1. Договор с Uzum Bank — [merchants.uzumbank.uz](https://merchants.uzumbank.uz/en/)
2. Получить `serviceId`, Merchant login/password, Checkout terminal credentials
3. Применить миграцию `20250623120000_uzum_payments.sql` (`supabase db push`)

### Переменные окружения

См. `.env.example` и `.env.production.example`:

```env
PAYMENTS_ENABLED=false
PAYMENT_PROVIDER=uzum
UZUM_MERCHANT_SERVICE_ID=
UZUM_MERCHANT_LOGIN=
UZUM_MERCHANT_PASSWORD=
UZUM_CHECKOUT_BASE_URL=https://api.uzumbank.uz
UZUM_CHECKOUT_TERMINAL_ID=
UZUM_CHECKOUT_SECRET=
UZUM_CHECKOUT_RETURN_URL=https://fundingpro.uz/dashboard/subscription/return
USD_UZS_RATE=12800
```

### Webhook URLs (зарегистрировать в кабинете Uzum)

Базовый URL: `https://fundingpro.uz/api/v1/payments/uzum`

| Endpoint | Метод |
|----------|-------|
| `/check` | POST |
| `/create` | POST |
| `/confirm` | POST |
| `/reverse` | POST |
| `/status` | POST |

Авторизация: `Authorization: Basic base64(login:password)`.

`params.account` (или `order_id`) = внутренний `payments.id` FundingPro. Сумма в **тийинах** (1 UZS = 100 tiyin).

### Поток оплаты

1. Пользователь выбирает тариф → `POST /api/v1/payments/intent`
2. **Карта:** `POST /api/v1/payments/checkout` → redirect на форму Uzum → `/dashboard/subscription/return`
3. **Uzum App:** deep link `apelsin.uz/open-service?serviceId=...&order_id=...&amount=...`

### Локальное тестирование

```bash
npm test                    # unit-тесты payments + uzum-merchant
PAYMENTS_ENABLED=true npm run dev   # отдельный терминал
npm run uzum:sandbox        # Merchant E2E (check → create → confirm)
npm run uzum:checkout-mock  # Checkout mock E2E (без Uzum API)
```

Эмулятор Uzum: https://github.com/VenSnow/uz-payments-emulator

### После подписания договора с Uzum (чеклист)

1. Получить credentials: `UZUM_MERCHANT_*` и `UZUM_CHECKOUT_*`
2. Заполнить `.env.production.local` (шаблон: `npm run deploy:setup-env`)
3. `npm run uzum:webhooks` — зарегистрировать URL в [кабинете merchant](https://merchants.uzumbank.uz/en/)
4. `supabase db push` на production (если ещё не применена миграция `uzum_transactions`)
5. `npm run deploy:env` — push env на Vercel
6. Sandbox с **реальными** credentials: Merchant + Checkout тестовый платёж
7. `npm run uzum:enable` → `vercel --prod`

`npm run uzum:check` предупредит, если `PAYMENTS_ENABLED=true` без Uzum credentials.

### Go-live команды

```bash
npm run uzum:check      # чеклист готовности (credentials, миграция, env)
npm run uzum:webhooks   # URL для регистрации в кабинете Uzum
npm run uzum:sandbox    # E2E Merchant flow (нужен npm run dev + PAYMENTS_ENABLED=true)
npm run uzum:checkout-mock  # Checkout mock E2E (без Uzum API)
npm run uzum:enable     # включить PAYMENTS_ENABLED после успешных проверок
```

**Пилот 5–10 paying orgs:** см. [docs/POST_UZUM_PILOT.md](docs/POST_UZUM_PILOT.md) и `npm run pilot:check`.

### Безопасность (beta hardening)

- `requireActiveUserOrResponse` — проверка `is_active` / `is_banned` на всех защищённых API routes
- RLS на `organizations`, `applications`, `documents`, `payments`, `subscriptions` — миграция `20250623140000_rls_sensitive_tables.sql`
- Plan limits в API: Basic 5 eligibility / 2 AI drafts в месяц (`lib/plan-limits.ts`)
- AI rate limit в PostgreSQL (`rate_limit_buckets`) для serverless

### Админка

`/admin/payments` — отчёт по платежам с полем `provider=uzum` и `provider_ref_id` (transId / order id).

---

## Юридическое соответствие (РУз)

Публичные документы (RU + UZ) в [`lib/legal/`](lib/legal/) и на страницах:

| Страница | Назначение |
|----------|------------|
| [/legal/offer](app/legal/offer) | Публичная оферта (ЗРУ-792) |
| [/legal/privacy](app/legal/privacy) | Политика персональных данных (ЗРУ-547) |
| [/legal/refunds](app/legal/refunds) | Возвраты цифровой подписки |
| [/legal/ai](app/legal/ai) | AI-обработка и трансграничная передача |
| [/legal/success-fee](app/legal/success-fee) | Гонорар за успех |

API: `GET /api/v1/legal` (manifest), `POST /api/v1/legal/consent`, `GET /api/v1/legal/consent/status`.

Согласия пользователей хранятся в таблице `user_consents` (миграция `20250623150000_user_consents.sql`).

**Цены:** основная валюта отображения — UZS; USD справочно. Курс: `USD_UZS_RATE` (по умолчанию 12800).

**Чеклист основателя (вне кода):**

1. Вычитка текстов с местным юристом перед масштабированием
2. Регистрация оператора / базы ПДн в Госреестре (Центр персонализации)
3. Юридические страницы live на production **до** `npm run uzum:enable`
4. Договор с Uzum Bank и регистрация webhooks

Тексты адаптированы по открытым нормам lex.uz и **не заменяют** юридическую консультацию.

---

## Growth, SEO и SMM

- Публичный каталог грантов: `/grants`, `/grants/[id]` (SSR + share)
- Контент: `/how-it-works`, `/stories`, `/donors`
- SEO: `sitemap.xml`, `robots.txt`, Open Graph в `app/layout.tsx`
- Аналитика: Plausible или PostHog (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` / `NEXT_PUBLIC_POSTHOG_KEY`)
- Telegram digest: `npm run telegram:digest` (см. `docs/GROWTH_PLAYBOOK.md`)
- Admin воронка: `/admin/funnel`, заявки `/admin/applications`, согласия `/admin/consents`

Подробнее: [docs/GROWTH_PLAYBOOK.md](docs/GROWTH_PLAYBOOK.md)

---

## Дисклеймер

FundingPro не гарантирует получение гранта. Платформа помогает найти подходящие возможности, проверить требования и подготовить заявку.

FundingPro не является микрофинансовой организацией, банком, кредитной или платёжной организацией.
