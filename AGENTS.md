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
