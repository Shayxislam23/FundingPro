#!/usr/bin/env node
/**
 * Production-safe Convex seed: requires CONVEX_DEPLOY_KEY, runs idempotent seed, verifies API.
 *
 * Usage (from monorepo root): npm run convex:seed:prod
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prodEnvPath = join(root, ".env.production.local");
const verifyUrl = process.env.SEED_VERIFY_URL ?? "https://www.fundingpro.uz/api/v1/plans";

function parseEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function loadEnv() {
  if (existsSync(prodEnvPath)) {
    return parseEnv(prodEnvPath);
  }
  if (process.env.CONVEX_DEPLOY_KEY) {
    return { CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY };
  }
  return {};
}

const env = loadEnv();

if (!env.CONVEX_DEPLOY_KEY) {
  console.error("✗ CONVEX_DEPLOY_KEY is required for production seed.");
  console.error("  Add it to fundingpro/.env.production.local or export it in the shell.");
  process.exit(1);
}

console.log("→ Running Convex seed against production deployment…");
const seed = spawnSync("npm", ["run", "convex:seed"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, ...env },
});

if (seed.status !== 0) {
  process.exit(seed.status ?? 1);
}

console.log(`\n→ Verifying plans API: ${verifyUrl}`);
try {
  const response = await fetch(verifyUrl);
  if (!response.ok) {
    console.error(`✗ Verify failed: HTTP ${response.status}`);
    process.exit(1);
  }
  const data = await response.json();
  const plans = Array.isArray(data?.plans) ? data.plans : data;
  const count = Array.isArray(plans) ? plans.length : 0;
  if (count === 0) {
    console.error("✗ Verify failed: plans array is empty");
    process.exit(1);
  }
  console.log(`✓ Production seed verified — ${count} plan(s) available.`);
} catch (err) {
  console.error("✗ Verify request failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
