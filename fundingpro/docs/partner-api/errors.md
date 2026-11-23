# Errors

Every error has the same shape:

```json
{ "error": { "code": "INVALID_REQUEST", "message": "Human-readable message", "request_id": "req_…" } }
```

| HTTP | `code` | Meaning | What to do |
|---|---|---|---|
| 400 | `INVALID_REQUEST` | Bad parameter, unknown field, too long, invalid JSON, key sent in URL | Fix the request; `message` names the field |
| 401 | `INVALID_API_KEY` | Missing / unknown / revoked key, or sandbox key used on production (or the reverse) | Check `X-API-Key` and the base URL |
| 401 | `EXPIRED_API_KEY` | Key passed its expiry date | Ask FundingPro for a new key |
| 403 | `PARTNER_SUSPENDED` | Access suspended or pilot period ended | Contact FundingPro |
| 403 | `FORBIDDEN_ORIGIN` | Call came from a domain, IP or app that is not on your allowlist | Call from your server or ask to update the allowlist |
| 403 | `INVALID_REQUEST` | `partner_id` in the body does not match your key | Send your own `partner_id` |
| 404 | `GRANT_NOT_FOUND` | Grant does not exist, is closed, unpublished or marked unreliable | Remove it from your cache |
| 409 | `IDEMPOTENCY_CONFLICT` | `Idempotency-Key` reused with a different body | Generate a new UUID per new submission |
| 409 | `DUPLICATE_LEAD` | Reserved; repeats normally return `200` + `duplicate: true` | — |
| 413 / 415 | `INVALID_REQUEST` | Body too large / not `application/json` | — |
| 422 | `CONSENT_REQUIRED` | `consent_to_contact` is not `true`; nothing was stored | Ask the user for consent |
| 429 | `RATE_LIMIT_EXCEEDED` | Per-minute or monthly limit reached | Wait `Retry-After` seconds; cache more |
| 500 | `INTERNAL_ERROR` | Unexpected error | Retry later; send `request_id` to support |
| 503 | `INTERNAL_ERROR` | Temporary backend problem | Retry with exponential backoff |
