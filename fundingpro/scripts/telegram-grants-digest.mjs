#!/usr/bin/env node
/**
 * Weekly grant deadline digest for Telegram channel.
 * Usage: TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... node scripts/telegram-grants-digest.mjs
 * Cron: 0 9 * * 1 (Mondays 09:00)
 */
import "dotenv/config";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
  process.exit(1);
}

async function main() {
  const res = await fetch(`${API_BASE}/api/v1/grants?limit=5&country=Uzbekistan`);
  const json = await res.json();
  const grants = json.data?.grants ?? [];

  const lines = grants.map((g, i) => {
    const title = g.title_ru ?? g.title;
    const deadline = g.deadline ? new Date(g.deadline).toLocaleDateString("ru-RU") : "—";
    return `${i + 1}. ${title}\n   Дедлайн: ${deadline}\n   ${API_BASE}/grants/${g.id}?utm_source=telegram`;
  });

  const text = `📋 Гранты недели для НКО Узбекистана\n\n${lines.join("\n\n")}\n\n→ Все гранты: ${API_BASE}/grants?utm_source=telegram`;

  const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: false }),
  });

  const tgJson = await tgRes.json();
  if (!tgJson.ok) {
    console.error("Telegram error:", tgJson);
    process.exit(1);
  }
  console.log("Digest sent:", grants.length, "grants");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
