# Sandbox

* Base URL: `https://sandbox-api.fundingpro.uz/v1`, keys start with `fp_test_`.
* Separate database: test grants only (titles start with `[TEST]`), including one Jizzakh-only grant with a deadline in 10 days (`flags.deadline_soon = true`) and one with co-financing.
* Leads created in sandbox have `is_test: true`, never reach FundingPro sales and never generate commissions.
* A `fp_test_` key never works on production and a `fp_live_` key never works on sandbox.
* Same limits as production (60/min, 5 000/month), so you can test `429` handling.

## Checklist before a production key is issued

- [ ] `GET /grants` with filters `applicant_type`, `region`, `sector` works and is cached ≤ 15 min.
- [ ] Grant page shows official link, last-verified date, disclaimer and “Grant data powered by FundingPro”.
- [ ] `POST /leads` sends `Idempotency-Key`, handles `201`, `200 duplicate`, `422 CONSENT_REQUIRED`, `429`.
- [ ] Consent checkbox v1.0 is shown, unticked by default.
- [ ] Events `grant_view`, `consultation_click`, `official_source_click` are sent.
- [ ] The API key lives only on your server (not in the app bundle or browser).
- [ ] `404 GRANT_NOT_FOUND` removes the grant from your cache.

## For FundingPro staff: setting up the sandbox

```bash
# on the SANDBOX Convex deployment only
npx convex env set PARTNER_SANDBOX_DEPLOYMENT true
npx convex deploy
npx convex run partnerAdmin:seedSandbox '{}'   # prints a fp_test_ key once
```

The Vercel project serving `sandbox-api.fundingpro.uz` must have `PARTNER_API_ENV=sandbox` and point `NEXT_PUBLIC_CONVEX_URL` / `CONVEX_DEPLOY_KEY` at the sandbox deployment.
