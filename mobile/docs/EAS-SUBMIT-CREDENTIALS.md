# EAS Submit — credentials checklist

`eas.json → submit.production.ios` is empty until paid Apple/Google enrollment and draft apps exist. Agents must not invent `ascAppId` / Team ID. Operator steps: [`STORE-SUBMIT-RUNBOOK.md`](./STORE-SUBMIT-RUNBOOK.md).

Bundle / package (already in `app.json`): `uz.fundingpro.app`.

## iOS

| Field | Source | Notes |
|---|---|---|
| `ascAppId` | App Store Connect → App → App Information → **Apple ID** (numeric) | Draft listing must exist first |
| `appleTeamId` | developer.apple.com → Membership → Team ID | Same value as Vercel `APPLE_TEAM_ID` for App Links |
| Auth | App-specific password **or** ASC API Key (`ascApiKeyPath` / Id / IssuerId) | API Key preferred for CI; store key file outside git. Interactive: `eas submit` + Apple ID. |

After the draft exists, add only real values:

```json
"ios": {
  "ascAppId": "1234567890",
  "appleTeamId": "ABCD1234XY"
}
```

## Android

| Field | Source | Notes |
|---|---|---|
| Google Service Account | Play Console API access → JSON key | Upload with `eas credentials --platform android` (preferred) or local `secrets/play-service-account.json` + `serviceAccountKeyPath` |
| `track` | Prefer `internal` for first automated submit | Then promote in Play Console |
| `releaseStatus` | `draft` for the first upload | Completing the listing is still a console task |

Play app record must exist (`uz.fundingpro.app`). As of Expo Submit (2026): **`eas submit` can create the first internal-track release** if the service account is uploaded. Manual first AAB ([expo.fyi/first-android-submission](https://expo.fyi/first-android-submission)) is a fallback, not a hard prerequisite.

Optional local path (gitignored) if you are not using EAS-stored credentials:

```json
"android": {
  "serviceAccountKeyPath": "./secrets/play-service-account.json",
  "track": "internal",
  "releaseStatus": "draft"
}
```

`releaseStatus: "draft"` keeps the first Play upload as a draft (safe when listing metadata is incomplete). Promote / set `completed` later.

Keep `./secrets/**` (except `secrets/README.md`) and `*service-account*.json` gitignored. Prefer `eas credentials` to store secrets on Expo’s side instead of committing paths with real files.

## Unblocks together

| Need | Same accounts |
|---|---|
| `eas submit` | Phase 0–2 |
| Vercel `APPLE_TEAM_ID` | Apple Team ID |
| Vercel `ANDROID_RELEASE_SHA256` | Play / EAS release keystore fingerprint |

After setting Team ID + SHA-256: redeploy web and run `npm run app-links:check -- --live` from `fundingpro/`.
