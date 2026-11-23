# FundingPro Partner API: integration guide

Base URL: `https://api.fundingpro.uz/v1` · Sandbox: `https://sandbox-api.fundingpro.uz/v1`
Spec: [`openapi.yaml`](openapi.yaml) · Postman: [`FundingPro-Partner-API.postman_collection.json`](FundingPro-Partner-API.postman_collection.json)

You can complete the integration in about 15 minutes with the sandbox key FundingPro gives you.

## 1. Before you start

| You receive from FundingPro | You give FundingPro |
|---|---|
| `partner_id`, e.g. `jizzakh_business_platform` | the domain of your web platform (if any calls come from a browser) |
| a sandbox key `fp_test_…` | the public IP address(es) of your server (optional, recommended) |
| a production key `fp_live_…` after the sandbox check | the bundle id / package name of your mobile app |

**Call the API from your server only.** An API key inside browser JavaScript or a mobile app can be extracted by anyone. Your app should call *your* backend, and your backend calls FundingPro. Keep the key in an environment variable (see [`.env.example`](.env.example)) and never commit it.

## 2. Quick start

```bash
export FP_BASE=https://sandbox-api.fundingpro.uz/v1
export FP_KEY=fp_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

curl -s $FP_BASE/health
curl -s -H "X-API-Key: $FP_KEY" "$FP_BASE/grants?applicant_type=business&region=Jizzakh&limit=20"
```

More examples: [`examples/curl.md`](examples/curl.md) and [`examples/typescript.ts`](examples/typescript.ts).

## 3. Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | service status (no key) |
| GET | `/grants` | list: `page`, `limit` (≤ 50), `search`, `sector`, `applicant_type`, `country`, `region`, `funding_type`, `deadline_from`, `deadline_to`, `status`, `language`, `sort` |
| GET | `/grants/search?q=` | full-text search (EN / RU / UZ) |
| GET | `/grants/{grant_id}` | one grant (`grant_…` id or slug) |
| POST | `/leads` | hand over a user who wants application support |
| POST | `/events` | `grant_view`, `grant_click`, `consultation_click`, `lead_started`, `lead_submitted`, `official_source_click` |
| GET | `/meta` | vocabularies for filters |

Only grants that FundingPro has **verified and published** are returned. If a grant is closed, removed, marked unreliable or past its deadline, `/grants/{id}` returns `404 GRANT_NOT_FOUND`. Remove it from your cache when this happens.

## 4. Typical user flow

1. User opens your “Grants” section → `GET /grants` (cache ≤ 15 min) → send `grant_view` events in batches.
2. User opens a grant → `GET /grants/{id}` (cache ≤ 1 h). Show the **official source link**, **last verified date**, the **disclaimer** and **“Grant data powered by FundingPro”**.
3. User taps “Get help with the application” → `consultation_click`. Show your consent checkbox (text v1.0 in [`personal-data.md`](personal-data.md)).
4. User submits → `POST /leads` with `Idempotency-Key: <uuid>` → show “FundingPro will contact you within 1 working day”.
5. Alternatively, send the user to `referral_url` from the grant object. It opens FundingPro and records your platform as the source.

## 5. Leads

```json
POST /v1/leads
Idempotency-Key: 6f1c2b8e-4a0d-4c1e-9b7a-3d2e1f0a9b8c

{
  "partner_id": "jizzakh_business_platform",
  "grant_id": "grant_k57abc0123456789",
  "full_name": "Ali Valiyev",
  "phone": "+998901234567",
  "email": "ali@example.com",
  "organization_name": "Jizzakh Agro Tech LLC",
  "applicant_type": "business",
  "region": "Jizzakh",
  "message": "We would like support with the application",
  "preferred_language": "uz",
  "consent_to_contact": true,
  "consent_text_version": "v1.0",
  "utm_source": "jizzakh_platform",
  "utm_medium": "mobile_app",
  "utm_campaign": "grant_12345",
  "external_user_id": "partner_user_98765"
}
```

* Required fields: `partner_id`, `grant_id`, `full_name`, `phone` **or** `email`, `consent_to_contact: true`, `consent_text_version`.
* No consent → `422 CONSENT_REQUIRED`, nothing is stored.
* The same person for the same grant within 30 days → `200` with the **existing** `lead_id` and `duplicate: true`.
* The same `Idempotency-Key` with the same body → the same response. With a different body → `409 IDEMPOTENCY_CONFLICT`.
* Unknown fields are rejected. Do not send passport numbers, tax IDs or other data not listed here.

## 6. Limits and errors

Pilot: **60 requests/minute, 5 000 requests/month**, `limit` ≤ 50, `page` ≤ 20. Every response carries `X-Request-Id` and `X-RateLimit-*` headers. Quote `request_id` when you contact support.

```json
{ "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "API request limit exceeded", "request_id": "req_…" } }
```

All codes and what to do about each are in [`errors.md`](errors.md). On `429` wait for `Retry-After`. On `503` retry with exponential backoff.

## 7. Rules you agreed to

* Show FundingPro branding and the per-card requirements → [`branding.md`](branding.md).
* Respect cache windows; do not store a full copy of the catalogue → [`caching.md`](caching.md).
* Send leads only with the user's consent, never send personal data in URLs → [`personal-data.md`](personal-data.md).
* Use the key only in the approved platform and app; do not share, resell or re-expose the data.

## 8. Sandbox → production

See [`sandbox.md`](sandbox.md). When your sandbox integration passes the checklist, FundingPro issues the production key.
