#!/usr/bin/env node
/**
 * One-time Telegram bot setup: webhook + commands + description (RU/UZ).
 *
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... APP_URL=https://www.fundingpro.uz \
 *     node scripts/telegram-setup.mjs
 *
 * TELEGRAM_WEBHOOK_SECRET: any random string of 32+ letters/digits (same value in Vercel env).
 */
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const appUrl = (process.env.APP_URL ?? "https://www.fundingpro.uz").replace(/\/$/, "");

if (!token || !secret) {
  console.error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET (and optionally APP_URL).");
  process.exit(1);
}
if (!/^[A-Za-z0-9_-]{32,256}$/.test(secret)) {
  console.error("TELEGRAM_WEBHOOK_SECRET must be 32-256 chars of A-Z, a-z, 0-9, _ or -.");
  process.exit(1);
}

async function call(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(`${method}: ${json.description ?? res.status}`);
  console.log(`OK ${method}`);
}

const commandsRu = [
  { command: "start", description: "Начать / выбрать язык" },
  { command: "menu", description: "Меню: гранты, «Мой путь», заявка" },
  { command: "lang", description: "Сменить язык" },
];
const commandsUz = [
  { command: "start", description: "Boshlash / tilni tanlash" },
  { command: "menu", description: "Menyu: grantlar, «Mening yo‘lim», ariza" },
  { command: "lang", description: "Tilni o‘zgartirish" },
];

await call("setWebhook", {
  url: `${appUrl}/api/v1/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: true,
});
await call("setMyCommands", { commands: commandsRu });
await call("setMyCommands", { commands: commandsRu, language_code: "ru" });
await call("setMyCommands", { commands: commandsUz, language_code: "uz" });
await call("setMyDescription", {
  description: "FundingPro: гранты для бизнеса и молодёжи Узбекистана. Каталог, «Мой путь» и заявка под ключ.",
});
await call("setMyDescription", {
  description: "FundingPro: O‘zbekiston biznesi va yoshlari uchun grantlar. Katalog, «Mening yo‘lim» va tayyor ariza.",
  language_code: "uz",
});
console.log(`\nDone. Webhook: ${appUrl}/api/v1/telegram/webhook`);
console.log("Next: add the bot to your sales group, send /chatid there, put the number into TELEGRAM_SALES_CHAT_ID on Vercel.");
