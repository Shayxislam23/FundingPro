# EAS submit secrets (gitignored)

Place credential files here locally. **Never commit** real keys.

| File | Purpose |
|------|---------|
| `play-service-account.json` | Google Play service account for `eas submit` (`eas.json` → `serviceAccountKeyPath`) |
| `AuthKey_XXXXXX.p8` | Optional App Store Connect API key (prefer EAS-managed credentials) |

## Setup

1. Create the file(s) in this folder after Phase 0–2 (see [`../docs/EAS-SUBMIT-CREDENTIALS.md`](../docs/EAS-SUBMIT-CREDENTIALS.md)).
2. Keep placeholders in `eas.json` until you have real `ascAppId` / `appleTeamId`.
3. Prefer storing secrets with `eas credentials` / Expo Secrets when possible.

This `README.md` is tracked; everything else under `secrets/` is ignored by git.
