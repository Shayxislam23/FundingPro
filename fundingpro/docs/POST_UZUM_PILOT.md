# Post-Uzum: пилотная монетизация (5–10 paying orgs)

Чеклист после подписания договора с Uzum Bank. Не включайте реальные платежи до прохождения sandbox.

**Sandbox → production:** см. [UZUM-GO-LIVE.md](./UZUM-GO-LIVE.md).

## 0. Юридические страницы (до `uzum:enable`)

Перед включением оплаты убедитесь, что на production доступны:

| URL | Документ |
|-----|----------|
| `/legal/offer` | Публичная оферта (ЗРУ-792) |
| `/legal/privacy` | Политика ПДн (ЗРУ-547) |
| `/legal/refunds` | Возвраты цифровой подписки |
| `/legal/ai` | Обработка данных AI / трансграничная передача |
| `/legal/success-fee` | Гонорар за успех (отдельный договор) |

Проверки в продукте:

- Регистрация: обязательные чекбоксы оферты и ПДн на `/auth`
- Оплата: чекбокс оферты + возвратов на `/dashboard/subscription`
- Согласия пишутся в `user_consents` (миграция `20250623150000_user_consents.sql`)

**Вне кода:** регистрация оператора ПДн в Госреестре (Центр персонализации) и финальная вычитка текстов местным юристом — обязательны перед масштабированием.

## 1. Sandbox и credentials

```bash
cd fundingpro
cp .env.example .env.local
# Заполните UZUM_* из кабинета мерчанта
npm run uzum:check
npm run uzum:sandbox
npm run uzum:checkout-mock
```

Все три команды должны завершиться без ошибок.

## 2. Production env

```bash
supabase db push                    # RLS + rate_limit_buckets + uzum migrations
npm run deploy:env                  # Vercel env (UZUM_*, SUPABASE_*)
```

Проверьте `/api/v1/health` на production: `payments.enabled` только после явного включения.

## 3. Включение оплаты (поэтапно)

Рекомендация аудита: **только 1–2 тарифа** на старте (НКО Basic + Pro).

```bash
npm run uzum:enable                 # PAYMENTS_ENABLED=true после sandbox
```

Зарегистрируйте webhooks:

```bash
npm run uzum:webhooks
```

## 4. Пилот 5–10 НКО

| # | Организация | Тариф | Оплата | Case study |
|---|-------------|-------|--------|------------|
| 1 | | plan-ngo-basic | | |
| 2 | | plan-ngo-pro | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

**Activation metrics (отслеживать вручную на старте):**

- Заполнен профиль org
- Первая eligibility check
- Первый AI draft
- Успешная оплата Uzum

## 5. A/B на subscription page

- Вариант A: «Оплатить сейчас» (когда `PAYMENTS_ENABLED=true`)
- Вариант B: «Запросить подключение» (fallback)

## 6. Критерии готовности к масштабированию

- [ ] 5+ успешных оплат без reverse/chargeback
- [ ] Sandbox E2E зелёный после каждого деплоя (`npm run deploy:prep`)
- [ ] RLS применён (`20250623140000_rls_sensitive_tables.sql`)
- [ ] Plan limits работают (Basic: 5 checks / 2 drafts)
- [ ] MRR > $500 или эквивалент в UZS

## Скрипт быстрой проверки

```bash
npm run pilot:check
```
