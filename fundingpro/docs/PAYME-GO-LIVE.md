# Payme Go-Live Checklist

FundingPro принимает оплату подписок через [Payme Merchant API](https://developer.help.paycom.uz/metody-merchant-api/) (JSON-RPC 2.0).

## Sandbox

1. Зарегистрируйте тестовый merchant в Payme Business.
2. Установите в `.env.local`:

```bash
PAYMENTS_ENABLED=true
PAYMENT_PROVIDERS=uzum,payme,click
PAYME_MERCHANT_ID=your_merchant_id
PAYME_MERCHANT_KEY=your_test_key
PAYME_TEST_MODE=true
```

3. Запустите `npm run dev` и `npx convex dev`.
4. Эмуляция потока: `npm run payme:sandbox`

## Production endpoint

Зарегистрируйте в ЛК Payme Business URL:

```
POST https://www.fundingpro.uz/api/v1/payments/payme
Authorization: Basic base64(Payme:MERCHANT_KEY)
Content-Type: application/json
```

## Методы

| Method | Назначение |
|--------|------------|
| `CheckPerformTransaction` | Проверка заказа |
| `CreateTransaction` | Создание транзакции |
| `PerformTransaction` | Проведение оплаты → активация подписки |
| `CancelTransaction` | Отмена / reverse |
| `CheckTransaction` | Статус |
| `GetStatement` | Выписка (admin) |

## Client checkout

Mobile/web открывают `paymeCheckoutUrl` из `POST /api/v1/payments/intent` с `provider: "payme"`.

## Vercel env

| Variable | Required |
|----------|----------|
| `PAYME_MERCHANT_ID` | Yes |
| `PAYME_MERCHANT_KEY` | Yes |
| `PAYME_TEST_MODE` | `false` in prod |
| `PAYMENT_PROVIDERS` | Include `payme` |

## Verify

- [ ] `npm run payme:sandbox` green locally
- [ ] First prod payment activates subscription
- [ ] Admin `/admin/payments` shows `provider=payme`
