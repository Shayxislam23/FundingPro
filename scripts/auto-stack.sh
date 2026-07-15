#!/usr/bin/env bash
# Auto-start FundingPro cloud/dev stack: Expo Metro + Next.js + Convex (agent mode).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMUX_CONF="/exec-daemon/tmux.portal.conf"

log() { printf '→ %s\n' "$*"; }

tmux_bin() {
  if [[ -f "$TMUX_CONF" ]]; then
    tmux -f "$TMUX_CONF" "$@"
  else
    tmux "$@"
  fi
}

ensure_session() {
  local name="$1" cwd="$2"
  tmux_bin has-session -t "=${name}" 2>/dev/null || \
    tmux_bin new-session -d -s "$name" -c "$cwd" -- "${SHELL:-bash}" -l
}

start_cmd() {
  local name="$1" cmd="$2"
  tmux_bin send-keys -t "${name}:0.0" C-c 2>/dev/null || true
  sleep 1
  tmux_bin send-keys -t "${name}:0.0" "$cmd" C-m
}

wait_http() {
  local url="$1" label="$2" n="${3:-60}"
  local i code
  for i in $(seq 1 "$n"); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$url" || true)"
    if [[ "$code" == "200" || "$code" == "304" ]]; then
      log "OK ${label} (${url}) → ${code}"
      return 0
    fi
    sleep 1
  done
  log "WARN ${label} not ready (${url})"
  return 1
}

# Env bootstraps (never commit secrets)
[[ -f "$ROOT/mobile/.env" ]] || cp "$ROOT/mobile/.env.example" "$ROOT/mobile/.env"
if [[ ! -f "$ROOT/fundingpro/.env.local" ]]; then
  cp "$ROOT/fundingpro/.env.example" "$ROOT/fundingpro/.env.local"
  # CI-style placeholder publishable key mentioned in SECURITY-ROADMAP
  sed -i 's/pk_test_\.\.\./pk_test_Y2xlcmsuZGV2JHRlc3Qk/' "$ROOT/fundingpro/.env.local"
  sed -i 's/sk_test_\.\.\./sk_test_placeholder/' "$ROOT/fundingpro/.env.local"
fi
if ! rg -q '^CLERK_JWT_ISSUER_DOMAIN="https?://.+"' "$ROOT/fundingpro/.env.local"; then
  sed -i 's|^CLERK_JWT_ISSUER_DOMAIN=.*|CLERK_JWT_ISSUER_DOMAIN="https://clerk.dev"|' "$ROOT/fundingpro/.env.local"
fi

ensure_session expo-mobile "$ROOT"
ensure_session fundingpro-next "$ROOT/fundingpro"
ensure_session convex-dev "$ROOT/fundingpro"

# Seed Convex agent env (local anonymous deploy)
(
  cd "$ROOT/fundingpro"
  CONVEX_AGENT_MODE=anonymous npx convex env set CLERK_JWT_ISSUER_DOMAIN https://clerk.dev >/dev/null 2>&1 || true
)

start_cmd expo-mobile "cd '$ROOT' && npm run mobile:dev"
start_cmd fundingpro-next "cd '$ROOT/fundingpro' && npm run dev -- --port 3000"
start_cmd convex-dev "cd '$ROOT/fundingpro' && CONVEX_AGENT_MODE=anonymous npx convex dev"

wait_http "http://127.0.0.1:8081/status" "Metro" 60 || true
wait_http "http://127.0.0.1:3000/" "Next.js" 90 || true
wait_http "http://127.0.0.1:3210/" "Convex" 90 || true

log "Running mobile:auto smoke…"
(cd "$ROOT" && npm run mobile:auto)

log "Sessions: expo-mobile | fundingpro-next | convex-dev"
tmux_bin ls 2>/dev/null || true
