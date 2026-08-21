# EAS submit secrets (gitignored)

Place credential files here locally. **Never commit** real keys.

| File | Purpose |
|------|---------|
| `play-service-account.json` | Google Play service account for `eas submit` (`eas.json` → `serviceAccountKeyPath`) |
| `AuthKey_XXXXXX.p8` | Optional App Store Connect API key (prefer EAS-managed credentials) |

## Setup

1. Create the file(s) in this folder after Phase 0–2 (see [`../docs/EAS-SUBMIT-CREDENTIALS.md`](../docs/EAS-SUBMIT-CREDENTIALS.md)).
2. Leave `eas.json → submit.production.ios` empty until you have real numeric `ascAppId` and Team ID (no `REPLACE_*` strings).
3. Prefer storing the Play JSON with `eas credentials --platform android` so `serviceAccountKeyPath` is optional.

This `README.md` is tracked; everything else under `secrets/` is ignored by git.
