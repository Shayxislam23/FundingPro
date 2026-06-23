# Growth Playbook — FundingPro

## Каналы (Узбекистан, НКО)

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
| linkedin | ngo_case | Кейсы пилота |
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

События: `landing_cta_click`, `auth_success`, `onboarding_step_*`, `eligibility_run`, `ai_generate`, `lead_magnet_submit`, `grant_shared`.

## Пилотные метрики

См. `docs/POST_UZUM_PILOT.md` — profile → eligibility → AI → Uzum pay.

Admin: `/admin/funnel` — воронка активации в продукте.

## SEO

- Публичный каталог: `/grants`, `/grants/[id]`
- Sitemap: `/sitemap.xml`
- Контент: `/how-it-works`, `/stories`, `/donors`
