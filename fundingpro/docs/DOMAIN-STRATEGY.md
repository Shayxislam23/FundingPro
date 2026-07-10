# Domain strategy

Canonical production URL for FundingPro web and smoke/CI checks:

| URL | Role |
|-----|------|
| **https://www.fundingpro.uz** | **Canonical prod** — App Links, smoke tests, release gate, `SMOKE_BASE_URL` |
| https://fundingpro.uz | Apex → 307 redirect to `www` (Vercel) |
| https://fundingpro.app | Legacy Netlify host — **do not** use for smoke/CI or App Links |
| https://funding-pro.vercel.app | Deprecated Vercel preview alias — not for prod verification |

## Vercel config (monorepo)

Two valid deploy layouts; pick one in Vercel **Settings → Git → Root Directory**:

| Root Directory | Config file | installCommand | buildCommand | outputDirectory |
|---|---|---|---|---|
| `.` (repo root, recommended for Git reconnect) | `vercel.json` | `npm ci` | `npm run build --workspace=fundingpro` | `fundingpro/.next` |
| `fundingpro` (CLI deploy fallback) | `fundingpro/vercel.json` | `npm install` | `npm run build` | `.next` (default) |

Both target the same Next.js app; root config is for monorepo CI/Git integration, subdirectory config is for `cd fundingpro && npx vercel --prod`.
