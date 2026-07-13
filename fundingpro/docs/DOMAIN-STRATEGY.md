# Domain strategy

Canonical production URL for FundingPro web and smoke/CI checks:

| URL | Role |
|-----|------|
| **https://www.fundingpro.uz** | **Canonical prod** — App Links, smoke tests, release gate, `SMOKE_BASE_URL` |
| https://fundingpro.uz | Apex → 307 redirect to `www` (Vercel) |
| https://fundingpro.app | Legacy Netlify host — **do not** use for smoke/CI or App Links |
| https://funding-pro.vercel.app | Deprecated Vercel preview alias — not for prod verification |

See also: [OPS-RUNBOOK.md](./OPS-RUNBOOK.md) (gates, App Links M-02, smoke) · [ACCESS_NEEDED.md](../../ACCESS_NEEDED.md) (human blockers).

## Vercel config (monorepo)

Two valid deploy layouts; pick one in Vercel **Settings → Git → Root Directory**:

| Root Directory | Config file | installCommand | buildCommand | outputDirectory |
|---|---|---|---|---|
| `.` (repo root, recommended for Git reconnect) | `vercel.json` | `npm ci` | `npm run build --workspace=fundingpro` | `fundingpro/.next` |
| `fundingpro` (CLI deploy fallback) | `fundingpro/vercel.json` | `npm install` | `npm run build` | `.next` (default) |

Both target the same Next.js app; root config is for monorepo CI/Git integration, subdirectory config is for `cd fundingpro && npx vercel --prod`.

### Human: Vercel Git reconnect

Auto-deploy from GitHub is a **dashboard** action (cannot be fixed in code):

1. Vercel → Project → **Settings → Git** → reconnect `FundingPro` repo.
2. Set **Root Directory** to `.` (preferred) or `fundingpro` to match the table above.
3. Confirm Production branch is `main`.
4. After reconnect, push or Redeploy; then run:

```bash
cd fundingpro
PROD_BASE_URL=https://www.fundingpro.uz npm run prod:content-check
SMOKE_BASE_URL=https://www.fundingpro.uz npm run test:smoke
```

### App Links (incomplete until secrets)

Live AASA/assetlinks return `X-App-Links-Config: incomplete` until `APPLE_TEAM_ID` and `ANDROID_RELEASE_SHA256` are pasted on Vercel Production (see `bash paste-secrets.sh` / OPS-RUNBOOK M-02). Do not invent fingerprints. Admin → Settings shows missing **env names only**.
