# Post-merge App Links cheat sheet

> **Status (2026-07-08):** PR #8 merged ✅ · Site live at `www.fundingpro.uz` ✅ · Both `.well-known` endpoints return 200 ✅ · `X-App-Links-Config: incomplete` still present — needs Vercel env vars (Step 1 below).

Run these steps **immediately after** the PR is merged and Vercel finishes its production deploy.

---

## 1 — Set Vercel env vars (Production)

In [Vercel Dashboard → Project → Settings → Environment Variables](https://vercel.com/dashboard), add the following under **Production** (and Preview if you need to test on preview URLs):

| Variable | Where to get it |
|---|---|
| `APPLE_TEAM_ID` | [Apple Developer → Account → Membership](https://developer.apple.com/account) — 10-character string, e.g. `AB12CD34EF` |
| `ANDROID_RELEASE_SHA256` | EAS keystore or Play Console signing certificates page. Accepts hex with or without colons; comma-separate multiple fingerprints. Example: `AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99` |
| `ANDROID_PACKAGE` | Only set if overriding the default `uz.fundingpro.app` |

> **Env-only changes do NOT trigger an automatic redeploy.** After saving the vars, manually redeploy Production:
> ```bash
> cd fundingpro && vercel --prod
> ```

> **Note on apex domain:** `fundingpro.uz` (no www) redirects 307 → `www.fundingpro.uz`. This is normal Vercel behavior (primary domain = www). The mobile app already targets `www.fundingpro.uz` in `associatedDomains` and `intentFilters` — no change needed.

---

## 2 — Verify live endpoints

```bash
# Apple AASA — must return HTTP 200, Content-Type: application/json, NO X-App-Links-Config header
curl -sI https://www.fundingpro.uz/.well-known/apple-app-site-association

# Android Digital Asset Links — same requirements
curl -sI https://www.fundingpro.uz/.well-known/assetlinks.json
```

Expected response headers:

```
HTTP/2 200
content-type: application/json
cache-control: public, max-age=3600
# X-App-Links-Config header must NOT be present when env vars are set
```

---

## 3 — Run the app-links check script

```bash
cd fundingpro
npm run app-links:check -- --live
```

Expected: both checks pass, no `incomplete` header.

---

## 4 — Deep-link smoke test on device

| Platform | Deep link URL to open |
|---|---|
| iOS | `https://www.fundingpro.uz/mobile/auth/callback` |
| Android | `https://www.fundingpro.uz/mobile/auth/callback` |

The URL should open in the native app (not the browser) once App Links / Universal Links are verified. If it still opens in the browser, wait up to 24 h for CDN propagation or clear the app cache and retest.

---

## Canonical route files

These are the files actually serving the well-known responses (via `next.config.mjs` rewrites):

```
fundingpro/app/api/well-known/apple-app-site-association/route.ts
fundingpro/app/api/well-known/assetlinks/route.ts
```

The rewrites in `fundingpro/next.config.mjs`:

```
/.well-known/apple-app-site-association  →  /api/well-known/apple-app-site-association
/.well-known/assetlinks.json             →  /api/well-known/assetlinks
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `X-App-Links-Config: incomplete` header | Env vars not set on Vercel Production | Set `APPLE_TEAM_ID` + `ANDROID_RELEASE_SHA256` and redeploy |
| 404 on well-known paths | Vercel hasn't redeployed after merge | Trigger a manual redeploy |
| Links open in browser on device | App Links not yet verified | Test 24 h after deploy; ensure AASA/assetlinks return 200 |
| `sha256_cert_fingerprints` shows placeholder | `ANDROID_RELEASE_SHA256` not set | Set env var and redeploy |
| AASA appID shows `TEAM_ID.uz.fundingpro.app` | `APPLE_TEAM_ID` not set | Set env var and redeploy |
