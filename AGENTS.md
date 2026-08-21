<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** (in `fundingpro/`) for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->

## SEO / GEO skills

Installed from [aaron-he-zhu/seo-geo-claude-skills](https://github.com/aaron-he-zhu/seo-geo-claude-skills) for content, metadata, and geographic SEO tasks:

```bash
npx skills add aaron-he-zhu/seo-geo-claude-skills
```

Use these skills when optimizing FundingPro landing copy, structured data, sitemap strategy, or locale-specific SEO — primarily for the **web** app (`fundingpro/`). Mobile clay-lite UI is separate; SEO skills apply to public web pages and marketing content.

## Mobile dev workflow

| Command | Purpose |
|---------|---------|
| `npm run mobile:dev` | Metro with `--dev-client --clear` (prefers `~/Projects/FundingPro/mobile`) |
| `npm run mobile:rebuild-ios` | Native iOS dev client rebuild via `expo run:ios` |
| `npm run convex:seed:prod` | Production Convex seed (requires `CONVEX_DEPLOY_KEY`) + API verify |

Typical loop: **Metro → Reload in dev client → (optional) prod seed → (optional) native rebuild** when adding native modules.

See `mobile/README.md` for EAS, env vars, and clay-lite design notes.

## Cursor Cloud specific instructions

Standard commands live in `README.md`, `CONTRIBUTING.md`, `fundingpro/package.json`, and `.github/workflows/main-ci.yml`. Notes below are the non-obvious bits for running this monorepo in a Linux cloud VM without live Convex/Clerk.

**Node:** The VM default (Node 22) installs and runs everything fine. CI pins Node 20 — only switch (via `nvm`) if you hit a version-specific issue. Dependencies install from the repo root with `npm ci` (npm workspaces).

**Running the web app without live Convex/Clerk:** `fundingpro/.env.local` is gitignored, so it must be recreated each session (the update script does not create it). Populate it with the CI placeholder keys plus the seed-fallback flag so the public catalog is served locally:

```
NEXT_PUBLIC_CONVEX_URL="https://placeholder.convex.cloud"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_Zm9vLWJhci0xMy5jbGVyay5hY2NvdW50cy5kZXYk"
CLERK_SECRET_KEY="sk_test_Y2xlcmsuZGV2JHRlc3Qk"
CLERK_JWT_ISSUER_DOMAIN="https://placeholder.clerk.accounts.dev"
RESEND_API_KEY="re_placeholder"
RESEND_FROM_EMAIL="info@fundingpro.uz"
ADMIN_EMAILS="admin@fundingpro.uz"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AI_PROVIDER="mock"
PUBLIC_API_SEED_FALLBACK="1"
```

- Start it with `cd fundingpro && npm run dev` (port 3000).
- `PUBLIC_API_SEED_FALLBACK=1` makes public endpoints (`/api/v1/grants`, `/donors`, `/plans`, `/stories`) serve the seed catalog from `fundingpro/lib/db/catalog-fallback.ts`. Public pages (`/grants`, `/pricing`, etc.) render from this.
- `/api/v1/health` reports `status: degraded` with a `database.error` because Convex is a placeholder — this is expected, not a failure.
- Authenticated flows (`/dashboard/*`, `/api/v1/me`, eligibility check, AI writer) require **real** Clerk keys and a live/anonymous Convex deployment; they cannot be exercised with the placeholder keys. For a real backend use `CONVEX_AGENT_MODE=anonymous npx convex dev` (isolated deployment) — but authenticated login still needs real Clerk credentials.
- Quick end-to-end sanity check while the dev server runs: `SMOKE_BASE_URL=http://localhost:3000 npm run contract:mobile-api` (validates the REST contract the mobile app depends on).

**Mobile:** Metro (`npm run mobile:dev`) can start on Linux, but a full native run needs an iOS Simulator / Android emulator, which are not available in this VM. Only `lint`, `typecheck`, and `npm test --workspace=@fundingpro/api-types` are runnable here for the mobile/shared workspaces.

**Lint gotcha:** `npm run lint` exits 0 but CI runs it with `--max-warnings=0`; a pre-existing warning in `convex/adminGrants.ts` will fail under that stricter flag.
