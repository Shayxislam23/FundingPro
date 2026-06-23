# Next.js 16 upgrade (post-pilot)

Deferred until after the 5–10 NGO pilot. Current stack: Next.js 14.2.x.

## Why upgrade

- Closes npm audit findings in `glob` (transitive via Next/eslint)
- Performance and App Router improvements in Next 15/16

## Checklist before upgrade

1. Run full regression: `npm run check && npm run lint && npm run build`
2. Review [Next.js upgrade guide](https://nextjs.org/docs/app/building-your-application/upgrading)
3. Update `eslint-config-next` to match Next version
4. Re-test Uzum payment webhooks and Supabase auth cookies
5. Re-deploy to Vercel preview before promoting production

## Suggested command (when ready)

```bash
npm install next@latest react@latest react-dom@latest eslint-config-next@latest
npm run check && npm run build
```

Do not upgrade during active pilot unless a critical security CVE requires it.
