# Caching rules

| Data | Maximum cache time |
|---|---|
| `GET /grants`, `/grants/search` | 15–30 minutes (we send `Cache-Control: private, max-age=900`) |
| `GET /grants/{id}` | 1 hour (`max-age=3600`) |
| `GET /meta` | 24 hours |

* After the cache window expires, re-fetch. Closed, removed, unreliable or re-dated grants must disappear or update in your app **no later than one cache window** after the change.
* A `404 GRANT_NOT_FOUND` for a cached grant means: remove it now.
* You may keep only what your cache needs. Building a permanent local copy of the FundingPro catalogue, exporting it (CSV/Excel) or re-publishing it elsewhere is not allowed.
* Do not cache `POST` responses or anything containing personal data.
