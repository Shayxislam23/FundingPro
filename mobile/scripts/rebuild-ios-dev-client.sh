#!/usr/bin/env bash
set -euo pipefail

MOBILE_DIR="${FUNDINGPRO_MOBILE_DIR:-$HOME/Projects/FundingPro/mobile}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_MOBILE="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ ! -d "$MOBILE_DIR/ios" ]]; then
  echo "→ Projects path missing or no ios/; using repo mobile at $REPO_MOBILE"
  MOBILE_DIR="$REPO_MOBILE"
fi

cd "$MOBILE_DIR"
echo "→ Rebuilding iOS dev client from: $MOBILE_DIR"
exec npx expo run:ios
