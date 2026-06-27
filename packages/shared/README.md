# @fundingpro/shared

Cross-platform utilities shared by the FundingPro web app (`fundingpro/`) and mobile app (`mobile/`).

## Exports

| Module | Purpose |
|--------|---------|
| `format-grant` | Grant amount/deadline formatting, urgency helpers |
| `sector-labels` | Sector slug → Russian label translation, profile dropdown options |
| `country-labels` | Country code → display name translation |
| `validation` | Pagination parsing, search sanitization, safe file names |

## Usage

```typescript
import {
  formatGrantAmount,
  translateSector,
  translateCountry,
  parsePagination,
} from "@fundingpro/shared";
```

## Scripts

```bash
npm run typecheck --workspace=@fundingpro/shared
```

## Conventions

- Keep modules free of React, Next.js, or Expo imports.
- Prefer pure functions and stable string formatting (locale: `ru-RU` for dates).
- When changing labels or validation rules, update both web and mobile consumers in the same PR.
