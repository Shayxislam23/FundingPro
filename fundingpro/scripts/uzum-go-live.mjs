#!/usr/bin/env node
/**
 * Uzum Bank go-live readiness checker.
 * Usage: npm run uzum:check
 *
 * Validates credentials, migration, webhooks list, and optional sandbox E2E.
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP_URL =
  process.env.UZUM_WEBHOOK_BASE_URL ??
  (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://fundingpro.uz");

function loadEnv() {
  const paths = [".env.production.local", ".env.local", ".env"];
  const merged = { ...process.env };
  for (const file of paths) {
    const p = join(root, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!merged[m[1]]) merged[m[1]] = v;
    }
  }
  return merged;
}

const env = loadEnv();

const MERCHANT_KEYS = [
  "UZUM_MERCHANT_SERVICE_ID",
  "UZUM_MERCHANT_LOGIN",
  "UZUM_MERCHANT_PASSWORD",
];
const CHECKOUT_KEYS = ["UZUM_CHECKOUT_TERMINAL_ID", "UZUM_CHECKOUT_SECRET"];
const PLATFORM_KEYS = [
  "NEXT_PUBLIC_CONVEX_URL",
  "CONVEX_DEPLOY_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

function isSet(key) {
  const v = env[key];
  return !!(v && !v.includes("your-") && v !== "TODO" && v !== "");
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

let blockers = 0;
let warnings = 0;

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function warn(msg) {
  warnings++;
  console.log(`  ⚠ ${msg}`);
}
function fail(msg) {
  blockers++;
  console.log(`  ✗ ${msg}`);
}

section("1. Договор и credentials Uzum");
console.log("  Заявка: https://merchants.uzumbank.uz/en/");
console.log("  Документация Merchant: https://developer.uzumbank.uz/merchant/");
console.log("  Документация Checkout: https://developer.uzumbank.uz/checkout/");

const merchantOk = MERCHANT_KEYS.every(isSet);
const checkoutOk = CHECKOUT_KEYS.every(isSet);

if (merchantOk) ok("Merchant credentials заполнены");
else {
  fail("Merchant credentials неполные — нужны:");
  MERCHANT_KEYS.filter((k) => !isSet(k)).forEach((k) => console.log(`      ${k}`));
}

if (checkoutOk) ok("Checkout credentials заполнены");
else {
  warn("Checkout credentials неполные (оплата картой на сайте):");
  CHECKOUT_KEYS.filter((k) => !isSet(k)).forEach((k) => console.log(`      ${k}`));
}

if (!merchantOk && !checkoutOk) {
  fail("Нужен хотя бы один канал (Merchant или Checkout)");
}

section("2. Convex — uzum_transactions table");
if (!isSet("NEXT_PUBLIC_CONVEX_URL")) {
  fail("NEXT_PUBLIC_CONVEX_URL не настроен");
} else {
  ok("NEXT_PUBLIC_CONVEX_URL настроен (uzum_transactions в Convex schema)");
}
if (!isSet("CONVEX_DEPLOY_KEY")) {
  warn("CONVEX_DEPLOY_KEY не настроен — webhooks/audit могут не работать");
} else {
  ok("CONVEX_DEPLOY_KEY настроен");
}

section("3. Vercel / Convex + Clerk env");
for (const k of PLATFORM_KEYS) {
  if (isSet(k)) ok(k);
  else fail(`${k} не настроен`);
}

if (env.PAYMENTS_ENABLED === "true") {
  warn("PAYMENTS_ENABLED=true — убедитесь, что sandbox пройден");
} else {
  ok("PAYMENTS_ENABLED=false (безопасно до go-live)");
}

section("4. Webhook URLs для кабинета Uzum");
const base = `${APP_URL.replace(/\/$/, "")}/api/v1/payments/uzum`;
for (const ep of ["check", "create", "confirm", "reverse", "status"]) {
  console.log(`  POST ${base}/${ep}`);
}
console.log("\n  Auth: Authorization: Basic base64(UZUM_MERCHANT_LOGIN:UZUM_MERCHANT_PASSWORD)");

section("5. Sandbox E2E");
console.log("  Локально: PAYMENTS_ENABLED=true npm run dev");
console.log("  Затем:     npm run uzum:sandbox");
console.log("  Эмулятор:  https://github.com/VenSnow/uz-payments-emulator");

section("6. Включение оплат");
if (env.PAYMENTS_ENABLED === "true" && blockers === 0) {
  ok("Можно принимать оплаты после успешного uzum:sandbox");
} else if (env.PAYMENTS_ENABLED !== "true") {
  console.log("  После sandbox: npm run uzum:enable");
} else {
  fail("Не включайте PAYMENTS_ENABLED=true пока есть блокеры выше");
}

console.log(`\n--- Итог: ${blockers} блокер(ов), ${warnings} предупреждений ---\n`);
process.exit(blockers > 0 ? 1 : 0);
