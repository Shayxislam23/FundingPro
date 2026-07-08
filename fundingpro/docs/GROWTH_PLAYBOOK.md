# Growth Playbook — FundingPro

## Каналы (Узбекистан, физлица)

| Канал | Формат | Частота | CTA |
|-------|--------|---------|-----|
| Telegram | Дедлайны грантов | 2×/нед | `/grants/{id}?utm_source=telegram` |
| LinkedIn | Кейс + скрин eligibility | 1×/нед | `/auth?utm_source=linkedin` |
| Email lead magnet | PDF подборка | landing form | `/grants?utm_source=lead_magnet` |

## UTM-таблица

| utm_source | utm_campaign | Назначение |
|------------|--------------|------------|
| telegram | weekly_digest | Канал дедлайнов |
| share | grant_card | Кнопка «Поделиться» на `/grants/[id]` |
| linkedin | individual_case | Кейсы пилота |
| lead_magnet | pdf_grants_2026 | Форма на landing |

## Telegram digest

```bash
# .env.local
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

npm run telegram:digest
```

## Аналитика

```bash
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=fundingpro.uz
# или
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

События: `landing_cta_click`, `lab_cta_click`, `lab_checkout_started`, `lab_profile_saved`, `auth_success`, `onboarding_step_*`, `lab_task_submitted`, `eligibility_run`, `north_star_*`, `ai_generate`, `lead_magnet_submit`, `grant_shared`, `pmf_survey_response`.

См. также `lib/analytics.ts` — canonical event names and GROWTH_PLAYBOOK mapping.

## Пилотные метрики

См. `docs/POST_UZUM_PILOT.md` — profile → eligibility → AI → Uzum pay.

Admin: `/admin/funnel` — воронка активации в продукте.

## SEO

- Публичный каталог: `/grants`, `/grants/[id]`
- Sitemap: `/sitemap.xml`
- Контент: `/how-it-works`, `/stories`, `/donors`
