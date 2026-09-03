# Partner bank integration (ZOOMRAD and future channels)

FundingPro distributes through **WebView Mini Apps** inside partner super-apps (ZOOMRAD first). Native iOS/Android (`mobile/`) remains the standalone app; bank users typically open the web mini app inside the partner shell.

## Architecture

```
Partner bank app (ZOOMRAD)
    └── WebView → https://www.fundingpro.uz/zoomrad/*?code=…
            └── Next.js exchanges one-time code → sessionStorage token
            └── /api/v1/zoomrad/* (auth + payments)
                    └── Convex (sessions, payments, revenue-share stats)

FundingPro native app
    └── /partner/zoomrad → WebView (same /zoomrad/* URL)
    └── Standalone tabs (grants, eligibility, …) via REST /api/v1
```

## Secrets (isolate SSO vs payments)

| Env | Purpose |
|-----|---------|
| `ZOOMRAD_AUTH_SECRET` | HMAC for `auth/init` and signed `auth/callback` |
| `ZOOMRAD_WEBHOOK_SECRET` | HMAC for payment webhooks only |

Do **not** reuse one key for both. `PARTNER_AUTH_ALLOW_UNSIGNED=true` works only when `NODE_ENV !== "production"`.

### Signed request format

Headers:

- Auth: `X-Partner-Signature`, `X-Partner-Timestamp` (unix seconds), `X-Partner-Nonce` (≥8 chars, unique)
- Webhook: `X-Zoomrad-Signature`, `X-Zoomrad-Timestamp`, `X-Zoomrad-Nonce`

HMAC-SHA256 hex over: `{timestamp}.{nonce}.{rawBody}`

Skew window: ±300s. Nonces are stored and rejected on replay.

## Adding a new bank channel

1. Register the channel in `fundingpro/lib/partners/channels.ts` and `mobile/lib/partner/channels.ts`.
2. Set env secrets: `{SLUG}_AUTH_SECRET`, `{SLUG}_WEBHOOK_SECRET` (separate values).
3. Implement server auth init (signed `POST /api/v1/zoomrad/auth/init` pattern).
4. Add WebView path under `/zoomrad`-style route group or reuse `/zoomrad?channel=kapital`.
5. Configure revenue-share tiers in Convex settings key `partner_revenue_share_tiers` (JSON array).

## ZOOMRAD API (v1)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/zoomrad/auth/init` | Bank server starts SSO (HMAC + timestamp + nonce) → `launchUrl` with one-time `code` |
| POST | `/api/v1/zoomrad/auth/exchange` | WebView exchanges `code` → `sessionToken` (store in sessionStorage; strip from URL) |
| POST | `/api/v1/zoomrad/auth/callback` | Bank-signed session activate |
| PATCH | `/api/v1/zoomrad/auth/callback` | Link session to Clerk user (uses sessionStorage token) |
| POST | `/api/v1/zoomrad/payments/create` | Create pending payment (Clerk auth; amount from plan) |
| POST | `/api/v1/zoomrad/payments/webhook` | Signed activation (`X-Zoomrad-Signature` + timestamp + nonce) |

## Session security notes

- Long-lived session bearers are **never** placed on `launchUrl` or mini-app nav links.
- Launch `code` TTL is ~2 minutes and single-use.
- Replayed `auth/init` for an open bank user refreshes the launch code only — it does **not** rotate `sessionTokenHash`.
- Prefer injecting the launch code via the native WebView bridge when the bank shell supports it.

## Revenue share

Monthly completed transaction count per channel determines the split (defaults in `fundingpro/lib/partners/revenue-share.ts`). Override via Convex settings without redeploying.

## Mobile entry

```bash
# Open ZOOMRAD mini app inside native shell
npx expo start
# Deep link / route: /partner/zoomrad
```

## Regulatory note (D-001)

All partner UI and API copy must describe **grants intelligence and application automation** — never lending, credit, wallets, or repayment flows.
