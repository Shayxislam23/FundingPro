#!/usr/bin/env bash
# Preflight for App Store / Play Store submit (does not call Apple/Google).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EAS_JSON="$ROOT/eas.json"
APP_JSON="$ROOT/app.json"
SECRETS_DIR="$ROOT/secrets"
FAIL=0
WARN=0

ok() { printf '  OK    %s\n' "$1"; }
warn() { printf '  WARN  %s\n' "$1"; WARN=$((WARN + 1)); }
err() { printf '  FAIL  %s\n' "$1"; FAIL=$((FAIL + 1)); }

echo "FundingPro store-submit preflight"
echo "  mobile: $ROOT"
echo

if [[ ! -f "$EAS_JSON" ]]; then
  err "eas.json missing"
else
  ok "eas.json present"
fi

if [[ ! -f "$APP_JSON" ]]; then
  err "app.json missing"
else
  BUNDLE="$(node -e "const a=require('$APP_JSON'); process.stdout.write(a.expo?.ios?.bundleIdentifier||'')")"
  PKG="$(node -e "const a=require('$APP_JSON'); process.stdout.write(a.expo?.android?.package||'')")"
  PROJECT="$(node -e "const a=require('$APP_JSON'); process.stdout.write(a.expo?.extra?.eas?.projectId||'')")"
  OWNER="$(node -e "const a=require('$APP_JSON'); process.stdout.write(a.expo?.owner||'')")"
  VERSION="$(node -e "const a=require('$APP_JSON'); process.stdout.write(a.expo?.version||'')")"

  [[ "$BUNDLE" == "uz.fundingpro.app" ]] && ok "iOS bundleIdentifier=$BUNDLE" || err "iOS bundleIdentifier='$BUNDLE' (expected uz.fundingpro.app)"
  [[ "$PKG" == "uz.fundingpro.app" ]] && ok "Android package=$PKG" || err "Android package='$PKG' (expected uz.fundingpro.app)"
  [[ "$PROJECT" == "57edb446-5583-4f1a-9540-6b812beb5467" ]] && ok "EAS projectId set" || err "EAS projectId missing/unexpected"
  [[ "$OWNER" == "shayxislam" ]] && ok "Expo owner=$OWNER" || warn "Expo owner='$OWNER' (expected shayxislam)"
  ok "app version=$VERSION (bump to 1.0.0 only after device QA)"
fi

if [[ -f "$EAS_JSON" ]]; then
  if grep -q 'REPLACE_AFTER_' "$EAS_JSON"; then
    err "eas.json still has REPLACE_AFTER_* placeholders — eas submit --non-interactive will fail"
  else
    ok "eas.json has no REPLACE_AFTER_* placeholders"
  fi

  ASC="$(node -e "const e=require('$EAS_JSON'); process.stdout.write(String(e.submit?.production?.ios?.ascAppId||''))")"
  TEAM="$(node -e "const e=require('$EAS_JSON'); process.stdout.write(String(e.submit?.production?.ios?.appleTeamId||''))")"
  TRACK="$(node -e "const e=require('$EAS_JSON'); process.stdout.write(String(e.submit?.production?.android?.track||''))")"
  REL="$(node -e "const e=require('$EAS_JSON'); process.stdout.write(String(e.submit?.production?.android?.releaseStatus||''))")"
  SA_PATH="$(node -e "const e=require('$EAS_JSON'); process.stdout.write(String(e.submit?.production?.android?.serviceAccountKeyPath||''))")"

  if [[ -n "$ASC" ]]; then
    if [[ "$ASC" =~ ^[0-9]+$ ]]; then
      ok "ascAppId=$ASC"
    else
      err "ascAppId='$ASC' is not a numeric App Store Connect Apple ID"
    fi
  else
    warn "ascAppId not in eas.json — eas submit --platform ios will prompt (ok locally, not for CI)"
  fi

  if [[ -n "$TEAM" ]]; then
    if [[ "$TEAM" =~ ^[A-Z0-9]{10}$ ]]; then
      ok "appleTeamId=$TEAM"
    else
      err "appleTeamId='$TEAM' should be a 10-character Apple Team ID"
    fi
  else
    warn "appleTeamId not in eas.json — fill after Apple membership (also Vercel APPLE_TEAM_ID)"
  fi

  [[ "$TRACK" == "internal" ]] && ok "Android track=internal (first submit)" || warn "Android track='$TRACK'"
  [[ "$REL" == "draft" ]] && ok "Android releaseStatus=draft (safe first upload)" || warn "Android releaseStatus='$REL'"

  if [[ -n "$SA_PATH" ]]; then
    ABS="$ROOT/${SA_PATH#./}"
    if [[ -f "$ABS" ]]; then
      ok "Google service account file exists: $SA_PATH"
    else
      warn "serviceAccountKeyPath=$SA_PATH not found — upload the key with: eas credentials --platform android"
    fi
  else
    warn "No serviceAccountKeyPath — use eas credentials to store the Play service account on Expo"
  fi
fi

if [[ -f "$SECRETS_DIR/play-service-account.json" ]]; then
  ok "secrets/play-service-account.json present (gitignored)"
else
  warn "secrets/play-service-account.json absent — fine if the key is stored via eas credentials"
fi

if command -v eas >/dev/null 2>&1; then
  ok "eas CLI: $(eas --version 2>/dev/null || true)"
  if eas whoami >/dev/null 2>&1; then
    ok "logged in as $(eas whoami 2>/dev/null || echo unknown)"
  else
    warn "eas CLI installed but not logged in — run: eas login"
  fi
else
  warn "eas CLI not on PATH — npm i -g eas-cli && eas login"
fi

echo
echo "Next (after Apple/Google drafts exist):"
echo "  cd mobile"
echo "  eas build --profile production --platform all"
echo "  eas submit --platform ios --profile production"
echo "  eas submit --platform android --profile production"
echo "Dashboard: https://expo.dev/accounts/shayxislam/projects/fundingpro/submissions"
echo "Runbook:   mobile/docs/STORE-SUBMIT-RUNBOOK.md"
echo

if [[ "$FAIL" -gt 0 ]]; then
  echo "Result: $FAIL failed, $WARN warning(s)"
  exit 1
fi
echo "Result: ready for interactive eas submit ($WARN warning(s) — expected until store IDs are filled)"
exit 0
