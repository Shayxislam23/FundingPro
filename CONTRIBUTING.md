# Contributing to FundingPro

FundingPro is an npm workspaces monorepo:

| Workspace | Path | Stack |
|-----------|------|-------|
| Web + API | `fundingpro/` | Next.js 14, Convex, Clerk |
| Mobile | `mobile/` | Expo 56, React Native |
| Shared utils | `packages/shared/` | TypeScript |
| API contracts | `packages/api-types/` | Zod |

## Prerequisites

- Node.js 20+
- npm (workspaces enabled at repo root)

## Setup

```bash
npm ci
cd fundingpro && npx convex dev   # separate terminal for backend
cd fundingpro && npm run dev      # web at :3000
npm run mobile:dev                # Metro for mobile dev client
```

## Before opening a PR

```bash
npm run typecheck    # all workspaces
npm run lint         # web + mobile
cd fundingpro && npm run check   # web typecheck + unit tests
```

CI also runs contract tests and Playwright e2e in the `integration` job.

## Code guidelines

- **Shared logic** — put cross-platform helpers in `@fundingpro/shared`; API response shapes in `@fundingpro/api-types`.
- **Convex** — read `fundingpro/convex/_generated/ai/guidelines.md` before editing backend code; use `npx convex dev` (not `deploy`) during development.
- **Scope** — keep PRs focused; avoid duplicating shared package code in `fundingpro/lib/`.
- **Commits** — use conventional prefixes (`feat:`, `fix:`, `chore:`) with a short imperative subject.

## Mobile

See `mobile/README.md` for EAS builds, env vars, and clay-lite UI notes.

## Security

Do not commit secrets (`.env.local`, deploy keys). Report security issues privately to the maintainers.
