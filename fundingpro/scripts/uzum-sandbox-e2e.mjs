#!/usr/bin/env node
/**
 * Sandbox E2E: Merchant webhook flow (check → create → confirm → subscription ACTIVE).
 *
 * Prerequisites:
 *   - Dev server running (npm run dev)
 *   - Local DB (USE_LOCAL_DATABASE=true) or DATABASE_URL
 *   - PAYMENTS_ENABLED=true
 *   - UZUM_MERCHANT_* set (or test defaults below)
 *
 * Usage: npm run uzum:sandbox
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { randomUUID } from "crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.UZUM_E2E_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const TEST_SERVICE_ID = process.env.UZUM_MERCHANT_SERVICE_ID ?? "fundingpro-test";
const TEST_LOGIN = process.env.UZUM_MERCHANT_LOGIN ?? "uzum_test";
const TEST_PASSWORD = process.env.UZUM_MERCHANT_PASSWORD ?? "uzum_test_secret";

function loadEnv() {
  const merged = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const p = join(root, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (merged[m[1]] === undefined) merged[m[1]] = v;
    }
  }
  return merged;
}

const env = loadEnv();
const authHeader = `Basic ${Buffer.from(`${TEST_LOGIN}:${TEST_PASSWORD}`, "utf8").toString("base64")}`;

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? `: ${detail}` : ""}`);
  }
}

async function merchantPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function seedPayment(pool) {
  const userId = randomUUID();
  const paymentId = randomUUID();
  const subscriptionId = randomUUID();
  const planId = "plan-ngo-basic";
  const amountTiyin = 38400000; // $30 @ 12800

  await pool.query(`INSERT INTO users (id, email) VALUES ($1::uuid, $2) ON CONFLICT DO NOTHING`, [
    userId,
    `uzum-e2e-${Date.now()}@test.local`,
  ]);
  await pool.query(
    `INSERT INTO user_identities (user_id, provider, provider_id)
     VALUES ($1::uuid, 'test', $2)
     ON CONFLICT DO NOTHING`,
    [userId, `test-${userId}`]
  );

  await pool.query(
    `INSERT INTO subscriptions (id, user_id, plan_id, status)
     VALUES ($1::uuid, $2::uuid, $3, 'PENDING')
     ON CONFLICT DO NOTHING`,
    [subscriptionId, userId, planId]
  );

  await pool.query(
    `INSERT INTO payments (id, user_id, subscription_id, amount_usd, currency, status, provider, idempotency_key, service_type, metadata)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 30, 'UZS', 'PENDING', 'uzum', $4, 'subscription', $5::jsonb)`,
    [
      paymentId,
      userId,
      subscriptionId,
      `e2e-${paymentId}`,
      JSON.stringify({ planId, planName: "Basic", amountTiyin, amountUzs: 384000 }),
    ]
  );

  return { paymentId, subscriptionId, amountTiyin };
}

console.log(`Uzum sandbox E2E → ${BASE}\n`);

if (env.PAYMENTS_ENABLED !== "true" && process.env.PAYMENTS_ENABLED !== "true") {
  console.error("Set PAYMENTS_ENABLED=true in .env.local or env for this test.");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL ?? env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL required for seeding test payment.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: dbUrl });
let paymentId;
let amountTiyin;
const transId = `e2e-trans-${randomUUID()}`;

try {
  await pool.query("SELECT 1");
  const hasUzum = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uzum_transactions') AS e`
  );
  assert("uzum_transactions table exists", hasUzum.rows[0]?.e === true);

  const seeded = await seedPayment(pool);
  paymentId = seeded.paymentId;
  amountTiyin = seeded.amountTiyin;
  console.log(`  Test payment: ${paymentId}\n`);

  const check = await merchantPost("/api/v1/payments/uzum/check", {
    serviceId: TEST_SERVICE_ID,
    timestamp: Date.now(),
    params: { account: paymentId },
  });
  assert("POST /uzum/check → 200", check.status === 200, `status=${check.status}`);
  assert("check status OK", check.json?.status === "OK", JSON.stringify(check.json));

  const create = await merchantPost("/api/v1/payments/uzum/create", {
    serviceId: TEST_SERVICE_ID,
    timestamp: Date.now(),
    transId,
    params: { account: paymentId },
    amount: amountTiyin,
  });
  assert("POST /uzum/create → 200", create.status === 200, `status=${create.status}`);
  assert("create status CREATED", create.json?.status === "CREATED", JSON.stringify(create.json));

  const confirm = await merchantPost("/api/v1/payments/uzum/confirm", {
    serviceId: TEST_SERVICE_ID,
    timestamp: Date.now(),
    transId,
  });
  assert("POST /uzum/confirm → 200", confirm.status === 200, `status=${confirm.status}`);
  assert("confirm status CONFIRMED", confirm.json?.status === "CONFIRMED", JSON.stringify(confirm.json));

  const payRow = await pool.query(`SELECT status FROM payments WHERE id = $1::uuid`, [paymentId]);
  assert("payment status SUCCESS", payRow.rows[0]?.status === "SUCCESS", payRow.rows[0]?.status);

  const subRow = await pool.query(
    `SELECT s.status FROM subscriptions s
     INNER JOIN payments p ON p.subscription_id = s.id
     WHERE p.id = $1::uuid`,
    [paymentId]
  );
  assert("subscription status ACTIVE", subRow.rows[0]?.status === "ACTIVE", subRow.rows[0]?.status);

  const txRow = await pool.query(`SELECT state FROM uzum_transactions WHERE trans_id = $1`, [transId]);
  assert("uzum_transaction CONFIRMED", txRow.rows[0]?.state === "CONFIRMED", txRow.rows[0]?.state);

  const status = await merchantPost("/api/v1/payments/uzum/status", {
    serviceId: TEST_SERVICE_ID,
    timestamp: Date.now(),
    transId,
  });
  assert("POST /uzum/status → 200", status.status === 200);
  assert("status CONFIRMED", status.json?.status === "CONFIRMED", JSON.stringify(status.json));
} catch (e) {
  console.error("E2E error:", e);
  failed++;
} finally {
  await pool.end();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
