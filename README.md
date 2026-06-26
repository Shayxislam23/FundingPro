# FundingPro Monorepo

| Workspace | Path | Description |
|-----------|------|-------------|
| Web + API | [`fundingpro/`](fundingpro/) | Next.js 14, Convex, Clerk, `/api/v1` |
| Mobile | [`mobile/`](mobile/) | Expo (React Native) iOS/Android |
| Shared utils | [`packages/shared/`](packages/shared/) | format-grant, sector-labels, validation |
| API types | [`packages/api-types/`](packages/api-types/) | Zod schemas for REST API |

## Quick start

```bash
# Install all workspaces
npm install

# Web (from fundingpro/)
cd fundingpro && npm run dev

# Mobile
cd mobile && cp .env.example .env && npm run start

# Typecheck everything
npm run typecheck

# Mobile API contract tests (web server must be running)
npm run contract:mobile-api
```

See [`fundingpro/README.md`](fundingpro/README.md) for web setup and [`mobile/README.md`](mobile/README.md) for Expo/EAS.
