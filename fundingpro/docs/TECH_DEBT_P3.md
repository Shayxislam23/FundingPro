# Tech debt P3 checklist

After App Links complete + payments sandbox pass.

## Build hygiene

- [x] Remove `typescript.ignoreBuildErrors` from `next.config.mjs` (2026-07-13 — `npm run typecheck` green)
- [ ] Keep `npm run lint --max-warnings=0` green in CI (blocked by GitHub billing)
- [ ] Do **not** re-enable ignoreBuildErrors without a tracked issue

## Security / payments gate

- [ ] M-02 App Links resolved (`paste-secrets.sh` + live check)
- [ ] Pen-test using [`PEN-TEST-CHECKLIST.md`](./PEN-TEST-CHECKLIST.md) after `PAYMENTS_ENABLED` still false but sandbox E2E green
- [ ] Enforce `CORS_ALLOWED_ORIGINS` in production
- [ ] Automate Clerk user delete after Convex account erasure cron (L-02)

## Data

- [ ] Production seed (`CONVEX_DEPLOY_KEY` + `npm run convex:seed:prod`)
- [ ] Verify grants include `Individual` applicant types after seed

Owner: founder + eng. Do not flip payments until this list is mostly checked.
