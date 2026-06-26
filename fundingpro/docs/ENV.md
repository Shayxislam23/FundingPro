# Environment variables

Copy `fundingpro/.env.example` to `fundingpro/.env.local` and `mobile/.env.example` to `mobile/.env` for local development.

## Web (`fundingpro/`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk client key |
| `CLERK_SECRET_KEY` | Yes | Clerk server key |
| `CLERK_JWT_ISSUER_DOMAIN` | Recommended | Clerk JWT issuer for Convex auth |
| `CONVEX_SYSTEM_SECRET` | Production | Shared secret for payment webhooks and system Convex actions |
| `CONVEX_DEPLOY_KEY` | CI/deploy | Convex deploy automation |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Yes | Transactional email |
| `EXPO_ACCESS_TOKEN` | Optional | Expo push API (set in Convex env too) |
| `ADMIN_EMAILS` | Recommended | Admin route access |

See `fundingpro/.env.example` for payments, AI, and analytics variables.

## Mobile (`mobile/`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_API_URL` | Yes | FundingPro API base (`…/api/v1`, no trailing slash) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Same Clerk app as web |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional | Crash reporting |

## Convex dashboard

Set these in the Convex project environment (not only Next.js):

- `CLERK_JWT_ISSUER_DOMAIN`
- `CONVEX_SYSTEM_SECRET` (must match web `CONVEX_SYSTEM_SECRET`)
- `EXPO_ACCESS_TOKEN` (for `pushNotifications` action)

Run `npx convex dev` from `fundingpro/` during development.
