# Click Go-Live Checklist

FundingPro принимает оплату через [Click SHOP API](https://docs.click.uz/) (Prepare / Complete).

## Sandbox

1. Получите credentials в личном кабинете Click (merchant, service, secret).
2. `.env.local`:

```bash
PAYMENTS_ENABLED=true
PAYMENT_PROVIDERS=uzum,payme,click
CLICK_MERCHANT_ID=
CLICK_SERVICE_ID=
CLICK_SECRET_KEY=
CLICK_MERCHANT_USER_ID=
```

3. Запустите dev-сервер и Convex.
4. `npm run click:sandbox`

## Inbound URLs

```
POST https://www.fundingpro.uz/api/v1/payments/click/prepare
POST https://www.fundingpro.uz/api/v1/payments/click/complete
```

Подпись: MD5 по [спецификации Click](https://docs.click.uz/) (`sign_string` + `sign_time`).

## Client launch

`POST /api/v1/payments/intent` с `provider: "click"` возвращает `clickPayUrl` (deep link `my.click.uz`).

## Vercel env

| Variable | Required |
|----------|----------|
| `CLICK_MERCHANT_ID` | Yes |
| `CLICK_SERVICE_ID` | Yes |
| `CLICK_SECRET_KEY` | Yes |

## Verify

- [ ] `npm run click:sandbox` green
- [ ] Prepare → Complete activates subscription
- [ ] Rate limits on `/api/v1/payments/click/*` (middleware)
