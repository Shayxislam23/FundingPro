# FundingPro

AI-платформа для поиска международных грантов, проверки соответствия требованиям и подготовки заявок.

**Компания:** Beta Version Solutions ООО (STIR: 311 119 058)
**Регистрация ПО:** DGU No. 61712
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
| ORM | Prisma |
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

### 3. Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

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

# Платежи (выключены до интеграции)
PAYMENTS_ENABLED=false
PAYMENT_INTEGRATION_STATUS=pending
```

---

## Настройка Supabase

1. Создай проект на [supabase.com](https://supabase.com)
2. **Settings → API** → скопируй URL и publishable key
3. **Settings → Database** → Connection string → скопируй `DATABASE_URL` (port 6543) и `DIRECT_URL` (port 5432)
4. **Authentication → Settings → SMTP** → включи Custom SMTP:
   - Host: `smtp.resend.com`, Port: `465`, User: `resend`, Password: Resend API Key
5. Запусти `npx prisma migrate dev` для применения схемы

---

## Настройка Resend

1. Зарегистрируйся на [resend.com](https://resend.com)
2. **Domains** → добавь и верифицируй `fundingpro.uz`
3. **API Keys** → создай ключ → вставь в `RESEND_API_KEY`

---

## Деплой на Vercel

```bash
npm i -g vercel
vercel --prod
```

**Важные настройки:**
- Build Command: `npx prisma generate && next build`
- Install Command: `npm install`
- Добавь все переменные из `.env.example` в Vercel → Settings → Environment Variables

---

## Команды

```bash
npm run dev           # Dev сервер
npm run build         # Сборка
npm run lint          # Линтер
npx tsc --noEmit      # TypeScript проверка
npx prisma generate   # Генерация Prisma Client
npx prisma migrate dev # Применить миграции
npx prisma db seed    # Заполнить базу данными
npx prisma studio     # GUI для базы данных
```

---

## Платёжная интеграция

> ⚠️ **Платёжная интеграция не активирована** (`PAYMENTS_ENABLED=false`)
>
> Онлайн-оплата временно недоступна. Пользователи могут отправить запрос на подключение тарифа — команда FundingPro свяжется с ними.
>
> Реальная интеграция будет добавлена после выбора и подключения платёжного провайдера.

---

## Дисклеймер

FundingPro не гарантирует получение гранта. Платформа помогает найти подходящие возможности, проверить требования и подготовить заявку.

FundingPro не является микрофинансовой организацией, банком, кредитной или платёжной организацией.
