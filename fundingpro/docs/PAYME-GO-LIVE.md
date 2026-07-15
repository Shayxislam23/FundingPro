# Payme Go-Live Checklist

FundingPro принимает оплату подписок и трека «Мой путь» через [Payme Merchant API](https://developer.help.paycom.uz/metody-merchant-api/) (JSON-RPC).

Официальная документация Paycom / Payme: [https://developer.help.paycom.uz/](https://developer.help.paycom.uz/).

## Sandbox

1. Зарегистрируйте тестовый merchant в Payme Business.
2. Установите в `.env.local`:

```bash
PAYMENTS_ENABLED=true
PAYMENT_PROVIDERS=uzum,payme,click
PAYME_MERCHANT_ID=your_merchant_id
PAYME_MERCHANT_KEY=your_test_key
PAYME_TEST_MODE=true
PAYME_CHECKOUT_BASE_URL=https://checkout.test.paycom.uz
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Запустите `npm run dev` и `npx convex dev`.
4. Эмуляция потока: `npm run payme:sandbox`

## Production endpoint

Зарегистрируйте в ЛК Payme Business URL:

```
POST https://www.fundingpro.uz/api/v1/payments/payme
Authorization: Basic base64(Paycom:MERCHANT_KEY)
Content-Type: application/json
```

Payme's servers authenticate as login `Paycom` (their infra naming — see `checkout.paycom.uz`), not `Payme`. If the actual Business cabinet ever shows a different login string, override it with `PAYME_MERCHANT_LOGIN` — do not hardcode a second guess.

## Методы

| Method | Назначение |
|--------|------------|
| `CheckPerformTransaction` | Проверка заказа |
| `CreateTransaction` | Создание транзакции |
| `PerformTransaction` | Проведение оплаты → активация подписки или Lab enrollment |
| `CancelTransaction` | Отмена / reverse |
| `CheckTransaction` | Статус |
| `GetStatement` | Выписка по Payme transaction create time |

## Client checkout

- Подписки: mobile/web открывают `paymeCheckoutUrl` из `POST /api/v1/payments/intent` с `provider: "payme"`.
- Lab course: web открывает `POST /api/v1/lab/payme-intent`, получает `redirectUrl`, затем Payme вызывает merchant endpoint `/api/v1/payments/payme`.

## Vercel env

| Variable | Required |
|----------|----------|
| `PAYME_MERCHANT_ID` | Yes |
| `PAYME_MERCHANT_KEY` | Yes |
| `PAYME_TEST_MODE` | `false` in prod |
| `PAYME_CHECKOUT_BASE_URL` | optional; defaults to test/live by mode |
| `PAYMENT_PROVIDERS` | Include `payme` |
| `PAYMENTS_ENABLED` | `true` only after sandbox passes |
| `PAYMENT_RECONCILIATION_CONFIRMED` | `true` only after `/admin/payments` reconciliation has 0 critical issues |
| `NEXT_PUBLIC_APP_URL` | production origin, e.g. `https://www.fundingpro.uz` |

## Verify

- [ ] `npm run payme:sandbox` green locally
- [ ] First sandbox/prod subscription payment activates subscription
- [ ] First Lab payment marks `/admin/users` enrollment as `paid`
- [ ] `GetStatement` returns Payme transactions for the requested time window
- [ ] Admin `/admin/payments` shows `provider=payme`
- [ ] Admin `/admin/payments` Reconciliation shows `Critical = 0`
