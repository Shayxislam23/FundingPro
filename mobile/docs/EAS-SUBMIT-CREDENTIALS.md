# EAS Submit — credentials checklist

`eas.json → submit.production` starts empty on purpose. Values come from Apple/Google **after** paid developer enrollment and draft app creation. Agents must not invent them.

Bundle / package (already in `app.json`): `uz.fundingpro.app`.

## iOS

| Field | Source | Notes |
|---|---|---|
| `ascAppId` | App Store Connect → App → App Information → **Apple ID** (numeric) | Draft listing must exist first |
| `appleTeamId` | developer.apple.com → Membership → Team ID | Same value as Vercel `APPLE_TEAM_ID` for App Links |
| Auth | App-specific password **or** ASC API Key (`ascApiKeyPath` / Id / IssuerId) | API Key preferred for CI; store key file outside git |

## Android

| Field | Source | Notes |
|---|---|---|
| `serviceAccountKeyPath` | Play Console → API access → service account JSON | See https://github.com/expo/fyi/blob/main/creating-google-service-account.md |
| `track` | Prefer `internal` for first automated submit | Then promote |

**Hard Google rule:** upload an `.aab` **manually once** in Play Console before `eas submit` works (https://expo.fyi/first-android-submission).

## Recommended `eas.json` shape (fill real IDs later)

```json
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "REPLACE_ASC_APP_ID",
        "appleTeamId": "REPLACE_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./secrets/play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

Keep `./secrets/**` and `*service-account*.json` gitignored. Prefer `eas credentials` to store secrets on Expo’s side instead of committing paths with real files.

## Unblocks together

| Need | Same accounts |
|---|---|
| `eas submit` | Phase 0–2 |
| Vercel `APPLE_TEAM_ID` | Apple Team ID |
| Vercel `ANDROID_RELEASE_SHA256` | Play / EAS release keystore fingerprint |

After setting Team ID + SHA-256: redeploy web and run `npm run app-links:check -- --live` from `fundingpro/`.
