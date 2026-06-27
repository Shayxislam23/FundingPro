#!/usr/bin/env bash
set -euo pipefail

# Prefer ASCII path used for native builds; fall back to repo-relative mobile/.
MOBILE_DIR="${FUNDINGPRO_MOBILE_DIR:-$HOME/Projects/FundingPro/mobile}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_MOBILE="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ ! -d "$MOBILE_DIR" ]]; then
  echo "→ Projects path missing; using repo mobile at $REPO_MOBILE"
  MOBILE_DIR="$REPO_MOBILE"
fi

cd "$MOBILE_DIR"
echo "→ Metro dev client from: $MOBILE_DIR"
exec npx expo start --dev-client --clear
