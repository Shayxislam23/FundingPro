# @fundingpro/api-types

Zod schemas and TypeScript types for the FundingPro public HTTP API (`/api/v1/*`). Used by the mobile client for runtime response validation.

## Exports

- **Envelope helpers** — `parseApiResponse`, `apiErrorSchema`, `apiSuccessSchema`
- **Resource schemas** — grants, plans, applications, documents, payments, onboarding, etc.
- **Inferred types** — e.g. `GrantListItem`, `ListGrantsResult`, `MeResponse`

## Usage

```typescript
import { listGrantsResultSchema, parseApiResponse } from "@fundingpro/api-types";

const res = await fetch("/api/v1/grants?limit=20");
const json = await res.json();
const data = parseApiResponse(json, listGrantsResultSchema);
```

## Scripts

```bash
npm run typecheck --workspace=@fundingpro/api-types
npm test --workspace=@fundingpro/api-types
```

## Contract tests

The web app runs `npm run contract:mobile-api` in CI to verify live API responses against these schemas. Update schemas here when API shapes change.
