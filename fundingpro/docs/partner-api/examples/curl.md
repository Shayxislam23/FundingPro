# cURL examples

```bash
export FP_BASE=https://sandbox-api.fundingpro.uz/v1
export FP_KEY=fp_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Health (no key):

```bash
curl -s "$FP_BASE/health"
```

Business grants for Jizzakh, open, nearest deadline first:

```bash
curl -s -H "X-API-Key: $FP_KEY" "$FP_BASE/grants?applicant_type=business&region=Jizzakh&status=open&sort=deadline_asc&page=1&limit=20"
```

Agriculture grants with deadline before 1 March 2027:

```bash
curl -s -H "X-API-Key: $FP_KEY" "$FP_BASE/grants?sector=agriculture&deadline_to=2027-03-01T00:00:00Z"
```

Search:

```bash
curl -s -H "X-API-Key: $FP_KEY" "$FP_BASE/grants/search?q=climate+uzbekistan"
```

One grant:

```bash
curl -s -H "X-API-Key: $FP_KEY" "$FP_BASE/grants/grant_k57abc0123456789"
```

Send a lead (idempotent):

```bash
curl -s -X POST "$FP_BASE/leads" \
  -H "X-API-Key: $FP_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "partner_id": "jizzakh_business_platform",
    "grant_id": "grant_k57abc0123456789",
    "full_name": "Ali Valiyev",
    "phone": "+998901234567",
    "applicant_type": "business",
    "region": "Jizzakh",
    "preferred_language": "uz",
    "consent_to_contact": true,
    "consent_text_version": "v1.0",
    "utm_source": "jizzakh_platform",
    "utm_medium": "web",
    "external_user_id": "partner_user_98765"
  }'
```

Batch of events:

```bash
curl -s -X POST "$FP_BASE/events" \
  -H "X-API-Key: $FP_KEY" -H "Content-Type: application/json" \
  -d '{"events":[{"event_type":"grant_view","grant_id":"grant_k57abc0123456789","session_id":"s-1"},{"event_type":"official_source_click","grant_id":"grant_k57abc0123456789","session_id":"s-1"}]}'
```
