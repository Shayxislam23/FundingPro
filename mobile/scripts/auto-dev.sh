#!/usr/bin/env bash
# Auto-start FundingPro Expo Metro + smoke-test JS bundles (cloud-friendly).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOBILE="$ROOT/mobile"
TMUX_CONF="/exec-daemon/tmux.portal.conf"
SESSION="${FUNDINGPRO_EXPO_SESSION:-expo-mobile}"
PORT="${EXPO_PORT:-8081}"
HOST="${EXPO_HOST:-127.0.0.1}"

log() { printf '→ %s\n' "$*"; }

tmux_bin() {
  if [[ -f "$TMUX_CONF" ]]; then
    tmux -f "$TMUX_CONF" "$@"
  else
    tmux "$@"
  fi
}

ensure_env() {
  if [[ ! -f "$MOBILE/.env" ]]; then
    log "Creating mobile/.env from .env.example"
    cp "$MOBILE/.env.example" "$MOBILE/.env"
  fi
}

ensure_deps() {
  if [[ ! -d "$ROOT/node_modules/expo" && ! -d "$MOBILE/node_modules/expo" ]]; then
    log "Installing monorepo deps"
    (cd "$ROOT" && npm install)
  fi
}

metro_status() {
  curl -sf "http://${HOST}:${PORT}/status" 2>/dev/null || true
}

wait_metro() {
  local i
  for i in $(seq 1 60); do
    if [[ "$(metro_status)" == *"packager-status:running"* ]]; then
      log "Metro ready on :${PORT}"
      return 0
    fi
    sleep 1
  done
  log "Metro did not become ready within 60s"
  return 1
}

start_metro() {
  if [[ "$(metro_status)" == *"packager-status:running"* ]]; then
    log "Metro already running"
    return 0
  fi

  log "Starting Metro in tmux session '${SESSION}'"
  tmux_bin has-session -t "=${SESSION}" 2>/dev/null || \
    tmux_bin new-session -d -s "$SESSION" -c "$ROOT" -- "${SHELL:-bash}" -l

  # Clear any stuck prompt, then launch
  tmux_bin send-keys -t "${SESSION}:0.0" C-c 2>/dev/null || true
  sleep 1
  tmux_bin send-keys -t "${SESSION}:0.0" "cd '$ROOT' && npm run mobile:dev" C-m
  wait_metro
}

bundle_url() {
  local platform="$1"
  printf 'http://%s:%s/mobile/node_modules/expo-router/entry.bundle?platform=%s&dev=true&minify=false&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable' \
    "$HOST" "$PORT" "$platform"
}

smoke_bundle() {
  local platform="$1"
  local out="/tmp/fp-${platform}.bundle"
  local code
  log "Bundling ${platform}…"
  code="$(curl -s -o "$out" -w '%{http_code}' --max-time 180 "$(bundle_url "$platform")" || true)"
  if [[ "$code" != "200" ]]; then
    log "FAIL ${platform}: HTTP ${code}"
    head -c 400 "$out" || true
    echo
    return 1
  fi
  if head -c 1 "$out" | grep -q '{'; then
    if grep -q 'UnableToResolveError\|"type":".*Error"' "$out"; then
      log "FAIL ${platform}: resolver/error JSON"
      head -c 500 "$out"
      echo
      return 1
    fi
  fi
  local size
  size="$(wc -c <"$out" | tr -d ' ')"
  if [[ "$size" -lt 100000 ]]; then
    log "FAIL ${platform}: bundle too small (${size} bytes)"
    return 1
  fi
  log "OK ${platform}: ${size} bytes"
}

smoke_web_html() {
  local code
  code="$(curl -s -o /tmp/fp-web.html -w '%{http_code}' --max-time 30 "http://${HOST}:${PORT}/" || true)"
  if [[ "$code" != "200" ]]; then
    log "FAIL web HTML: HTTP ${code}"
    return 1
  fi
  log "OK web HTML"
}

typecheck() {
  log "Typecheck mobile"
  (cd "$ROOT" && npm run typecheck --workspace=@fundingpro/mobile)
}

main() {
  ensure_env
  ensure_deps
  start_metro
  smoke_web_html
  smoke_bundle ios
  smoke_bundle android
  # Web JS only if react-native-web is present
  if [[ -d "$ROOT/node_modules/react-native-web" || -d "$MOBILE/node_modules/react-native-web" ]]; then
    smoke_bundle web || log "WARN web bundle failed (optional in cloud)"
  else
    log "Skip web JS bundle (react-native-web not installed)"
  fi
  typecheck
  log "Auto-dev complete. Attach: tmux attach -t ${SESSION}"
  log "Metro: http://${HOST}:${PORT}  status: $(metro_status)"
}

main "$@"
