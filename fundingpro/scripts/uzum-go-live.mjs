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
import pg from "pg";

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
const SUPABASE_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
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

section("2. Production БД — миграция uzum_transactions");
const dbUrl = env.DATABASE_URL;
if (!dbUrl || dbUrl.includes("[password]")) {
  fail("DATABASE_URL не настроен — нельзя проверить миграцию");
} else {
  try {
    const pool = new pg.Pool({ connectionString: dbUrl });
    const { rows } = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'uzum_transactions'
       ) AS exists`
    );
    const col = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'plans' AND column_name = 'price_uzs'
       ) AS exists`
    );
    await pool.end();
    if (rows[0]?.exists) ok("Таблица uzum_transactions существует");
    else {
      fail("Таблица uzum_transactions отсутствует — выполните: supabase db push");
      console.log("     или: npm run deploy:production (применит все миграции)");
    }
    if (col.rows[0]?.exists) ok("Колонка plans.price_uzs существует");
    else fail("Колонка plans.price_uzs отсутствует");
  } catch (e) {
    fail(`Не удалось подключиться к БД: ${e instanceof Error ? e.message : e}`);
  }
}

section("3. Vercel / Supabase env");
for (const k of SUPABASE_KEYS) {
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
