# EAS Submit — what's missing and where it comes from

`eas.json → submit.production` is currently `{}` (empty). This is not a bug —
these values don't exist yet because they're issued by Apple/Google only
after you enroll in their paid developer programs and create the app
listing. Nothing here can be filled from code or by an agent; each value is
either a paid account credential or a secret. This doc exists so filling
them in later is a checklist, not a research task.

## iOS

| Field | Where it comes from | Notes |
|---|---|---|
| `ascAppId` | App Store Connect → your app → **App Information** → General Information → "Apple ID" (a numeric ID, not your Apple ID email) | Requires the app to already exist as a draft listing in App Store Connect |
| `appleTeamId` | [developer.apple.com/account](https://developer.apple.com/account) → Membership → Team ID | Same value needed for `APPLE_TEAM_ID` in Vercel (see `RELEASE.md`, App Links section) — set both from the same source |
| `appleId` + `EXPO_APPLE_APP_SPECIFIC_PASSWORD` env var, **or** `ascApiKeyPath`/`ascApiKeyId`/`ascApiKeyIssuerId` | Either: Apple ID email + an [app-specific password](https://support.apple.com/en-us/102654); or an App Store Connect API Key (Users and Access → Keys → Generate) | The API Key path is preferred for CI/non-interactive submission — an app-specific password is simpler for one-off manual submits |

Requires: an active Apple Developer Program membership ($99/year) and the
app already created as a draft in App Store Connect.

## Android

| Field | Where it comes from | Notes |
|---|---|---|
| `serviceAccountKeyPath` | Google Play Console → Setup → API access → link/create a Google Cloud project → create a service account with "Release manager" access → download its JSON key | Full walkthrough: https://github.com/expo/fyi/blob/main/creating-google-service-account.md |
| `track` (optional, defaults `internal`) | Your choice — `internal`, `alpha`, `beta`, or `production` | Start with `internal` for the first automated submit |

**Hard prerequisite Google enforces**: the app must be uploaded to Play
Console **manually at least once** before the API-based `eas submit` will
work at all (https://expo.fyi/first-android-submission). Automating this
from the start is not possible — the first .aab has to go up through the
Play Console UI by hand.

Requires: a Google Play Console account ($25 one-time) and the app already
created as a draft listing.

## Once you have real values

Add them directly to `eas.json → submit.production` (safe to commit — these
are IDs, not secrets, except the API key / service account JSON files,
which should be referenced by path and gitignored, never committed). Or run
`eas credentials` interactively per platform and let EAS store them
server-side instead of in the repo — this is the safer default and what
`docs/RELEASE.md` already recommends for signing credentials.

## Same root cause as App Links

`APPLE_TEAM_ID` and `ANDROID_RELEASE_SHA256` (used by
`fundingpro/lib/mobile-app-links.ts` for the `.well-known` Universal
Links / App Links endpoints) come from the same two developer accounts
above — `appleTeamId` here is the identical value, and the Android SHA-256
comes from the release signing keystore that Play Console/EAS manages once
the app is created there. Getting both dev accounts set up unblocks EAS
submit, App Links, and this file in one pass.
