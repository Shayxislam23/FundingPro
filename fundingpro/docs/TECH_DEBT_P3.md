# Tech debt P3 checklist

After App Links complete + payments sandbox pass.

## Build hygiene

- [x] Remove `typescript.ignoreBuildErrors` from `next.config.mjs` (2026-07-13 — `npm run typecheck` green)
- [ ] Keep `npm run lint --max-warnings=0` green in CI (blocked by GitHub billing)
- [ ] Do **not** re-enable ignoreBuildErrors without a tracked issue

## Security / payments gate

- [ ] M-02 App Links resolved (`paste-secrets.sh` + live check)
- [ ] Pen-test using [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md) after `PAYMENTS_ENABLED` still false but sandbox E2E green
- [x] Enforce `CORS_ALLOWED_ORIGINS` in production — code already fails closed when the env var is unset (`lib/api-cors.ts`, wired into every route via `lib/api-route.ts`); only the env var value itself needs setting on Vercel, no code change needed
- [x] Automate Clerk user delete after Convex account erasure cron (L-02) — `convex/accountErasure.ts` now calls the Clerk Backend API to delete the auth identity *before* the Convex-side purge; a failed Clerk delete leaves the user unpurged for the next day's run instead of silently orphaning the identity (2026-07-14, 7 new tests in `accountErasure.test.ts`)

## Data

- [ ] Production seed (`CONVEX_DEPLOY_KEY` + `npm run convex:seed:prod`)
- [ ] Verify grants include `Individual` applicant types after seed

Owner: founder + eng. Do not flip payments until this list is mostly checked.
