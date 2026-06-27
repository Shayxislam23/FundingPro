# Payments Overview — Uzum, Payme, Click

FundingPro поддерживает три платёжных провайдера в Узбекистане. Пользователь выбирает провайдера на экране подписки (web + mobile).

## Architecture

```
Client → POST /payments/intent?provider=
       → ProviderRegistry → adapter (uzum | payme | click)
Inbound:
  Uzum  → /api/v1/payments/uzum/*
  Payme → /api/v1/payments/payme (JSON-RPC)
  Click → /api/v1/payments/click/prepare|complete
Convex:
  payments + paymentEvents
  uzumTransactions | paymeTransactions | clickTransactions
Activation: activateSubscriptionFromPayment (single path)
```

## Provider comparison

| | Uzum | Payme | Click |
|---|------|-------|-------|
| Protocol | Merchant REST | JSON-RPC 2.0 | SHOP Prepare/Complete |
| Mobile | App deep link + card checkout | Payme checkout URL | Click SuperApp URL |
| Env prefix | `UZUM_*` | `PAYME_*` | `CLICK_*` |
| Go-live doc | [UZUM-GO-LIVE.md](./UZUM-GO-LIVE.md) | [PAYME-GO-LIVE.md](./PAYME-GO-LIVE.md) | [CLICK-GO-LIVE.md](./CLICK-GO-LIVE.md) |
| Sandbox | `npm run uzum:sandbox` | `npm run payme:sandbox` | `npm run click:sandbox` |

## Configuration

```bash
PAYMENTS_ENABLED=true
PAYMENT_PROVIDERS=uzum,payme,click
```

`GET /api/v1/payments/status` → `providers[]` with `{ id, enabled, configured, label, methods[] }`.

## Health check

```bash
npm run payments:check
```

Проверяет env, credentials per enabled provider, и `/payments/status`.

## Legal

Оферта и политика возвратов упоминают Uzum Bank, Payme и Click как PSP. FundingPro не хранит данные карт.
