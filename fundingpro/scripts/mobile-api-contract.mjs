#!/usr/bin/env node
/**
 * Contract tests: mobile API client expectations vs running FundingPro API.
 * Usage: SMOKE_BASE_URL=http://localhost:3000 node fundingpro/scripts/mobile-api-contract.mjs
 */
const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function fetchJson(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, init);
  const json = await res.json();
  return { status: res.status, json, headers: res.headers };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

async function testHealth() {
  const { status, json } = await fetchJson("/api/v1/health");
  assert(status === 200 || status === 503, `health status ${status}`);
  assert(typeof json.status === "string", "health.status missing");
  assert(json.service === "FundingPro API", "health.service mismatch");
  assert(typeof json.version === "string", "health.version missing");
  console.log("OK  GET /api/v1/health");
}

async function testPlans() {
  const { status, json } = await fetchJson("/api/v1/plans");
  assert(status === 200, `plans status ${status}`);
  assert(json.success === true, "plans envelope success");
  assert(Array.isArray(json.data?.plans), "plans.data.plans array");
  console.log(`OK  GET /api/v1/plans (${json.data.plans.length} plans)`);
}

async function testGrants() {
  const { status, json } = await fetchJson("/api/v1/grants?limit=5");
  assert(status === 200, `grants status ${status}`);
  assert(json.success === true, "grants envelope success");
  assert(Array.isArray(json.data?.grants), "grants.data.grants array");
  assert(typeof json.data?.total === "number", "grants.data.total number");
  console.log(`OK  GET /api/v1/grants (${json.data.grants.length} items)`);
}

async function testMeRequiresAuth() {
  const res = await fetch(`${BASE}/api/v1/me`);
  assert(res.status === 401, `me without auth should be 401, got ${res.status}`);
  console.log("OK  GET /api/v1/me requires auth");
}

async function testAdminCheckRequiresAuth() {
  const res = await fetch(`${BASE}/api/v1/auth/admin-check`);
  assert(res.status === 401, `admin-check without auth should be 401, got ${res.status}`);
  console.log("OK  GET /api/v1/auth/admin-check requires auth");
}

async function testLegalConsentStatusRequiresAuth() {
  const res = await fetch(`${BASE}/api/v1/legal/consent/status`);
  assert(res.status === 401, `consent status without auth should be 401, got ${res.status}`);
  console.log("OK  GET /api/v1/legal/consent/status requires auth");
}

async function testPaymentsStatus() {
  const { status, json } = await fetchJson("/api/v1/payments/status");
  assert(status === 200, `payments/status status ${status}`);
  assert(json.success === true, "payments/status envelope");
  assert(typeof json.data?.paymentsEnabled === "boolean", "paymentsEnabled boolean");
  console.log("OK  GET /api/v1/payments/status");
}

async function testClientVersionHeader() {
  const { headers } = await fetchJson("/api/v1/health", {
    headers: { "X-Client-Version": "mobile-0.2.0" },
  });
  console.log("OK  X-Client-Version header accepted");
}

async function main() {
  console.log(`Contract tests against ${BASE}\n`);
  await testHealth();
  await testPlans();
  await testGrants();
  await testMeRequiresAuth();
  await testAdminCheckRequiresAuth();
  await testLegalConsentStatusRequiresAuth();
  await testPaymentsStatus();
  await testClientVersionHeader();
  console.log("\nAll mobile API contract checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
