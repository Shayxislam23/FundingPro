#!/usr/bin/env bash
# paste-secrets.sh — одноразовый скрипт для добавления 2 секретов на Vercel
# Запуск: bash paste-secrets.sh
set -euo pipefail

FUNDINGPRO_DIR="$(cd "$(dirname "$0")/fundingpro" && pwd)"

echo "=== Шаг 1: APPLE_TEAM_ID ==="
echo "Откуда: developer.apple.com/account → Membership → Team ID"
printf "Вставь APPLE_TEAM_ID (10 символов, напр. AB12CD34EF): "
read -r APPLE_TEAM_ID

if [[ -z "$APPLE_TEAM_ID" ]]; then
  echo "❌ Пустое значение. Прерываю."
  exit 1
fi

echo ""
echo "=== Шаг 2: ANDROID_RELEASE_SHA256 ==="
echo "Откуда: Play Console → App → Setup → App signing → SHA-256"
printf "Вставь SHA-256 fingerprint (с двоеточиями или без): "
read -r ANDROID_SHA256

if [[ -z "$ANDROID_SHA256" ]]; then
  echo "❌ Пустое значение. Прерываю."
  exit 1
fi

echo ""
echo "→ Добавляем APPLE_TEAM_ID на Vercel (Production)..."
echo "$APPLE_TEAM_ID" | npx vercel env add APPLE_TEAM_ID production --yes 2>/dev/null \
  || echo "$APPLE_TEAM_ID" | (cd "$FUNDINGPRO_DIR" && npx vercel env add APPLE_TEAM_ID production)

echo "→ Добавляем ANDROID_RELEASE_SHA256 на Vercel (Production)..."
echo "$ANDROID_SHA256" | (cd "$FUNDINGPRO_DIR" && npx vercel env add ANDROID_RELEASE_SHA256 production)

echo ""
echo "=== Шаг 3: Редеплой в production ==="
cd "$FUNDINGPRO_DIR"
npx vercel --prod

echo ""
echo "✅ Готово! Проверяй:"
echo "  curl -sI https://www.fundingpro.uz/.well-known/apple-app-site-association | grep x-app-links"
echo "  curl -sI https://www.fundingpro.uz/.well-known/assetlinks.json | grep x-app-links"
