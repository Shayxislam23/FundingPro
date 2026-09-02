# Partner bank integration (ZOOMRAD and future channels)

FundingPro distributes through **WebView Mini Apps** inside partner super-apps (ZOOMRAD first). Native iOS/Android (`mobile/`) remains the standalone app; bank users typically open the web mini app inside the partner shell.

## Architecture

```
Partner bank app (ZOOMRAD)
    └── WebView → https://www.fundingpro.uz/zoomrad/*
            └── Next.js mini app (mobile-first UI)
            └── /api/v1/zoomrad/* (auth + payments)
                    └── Convex (sessions, payments, revenue-share stats)

FundingPro native app
    └── /partner/zoomrad → WebView (same /zoomrad/* URL)
    └── Standalone tabs (grants, eligibility, …) via REST /api/v1
```

## Adding a new bank channel

1. Register the channel in `fundingpro/lib/partners/channels.ts` and `mobile/lib/partner/channels.ts`.
2. Set env secrets: `{SLUG}_AUTH_SECRET`, `{SLUG}_WEBHOOK_SECRET`.
3. Implement server auth init (signed `POST /api/v1/zoomrad/auth/init` pattern — clone route group per partner or generalise to `/api/v1/partners/{slug}/…`).
4. Add WebView path under `/zoomrad`-style route group or reuse `/zoomrad?channel=kapital`.
5. Configure revenue-share tiers in Convex settings key `partner_revenue_share_tiers` (JSON array).

## ZOOMRAD API (v1)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/zoomrad/auth/init` | Bank server starts SSO (`X-Partner-Signature` HMAC) |
| POST | `/api/v1/zoomrad/auth/callback` | Activate session (public) |
| PATCH | `/api/v1/zoomrad/auth/callback` | Link session to Clerk user |
| POST | `/api/v1/zoomrad/payments/create` | Create pending payment (Clerk auth) |
| POST | `/api/v1/zoomrad/payments/webhook` | Signed activation (`X-Zoomrad-Signature`) |

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
