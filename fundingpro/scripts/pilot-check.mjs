#!/usr/bin/env node
/**
 * Pre-pilot readiness check — run after Uzum contract + before first paying customers.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  return r.status === 0;
}

function loadEnv() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...process.env, ...loadEnv() };
const checks = [];

checks.push(["typecheck + unit tests", () => run("npm", ["run", "check"])]);
checks.push(["deploy check", () => run("npm", ["run", "deploy:check"])]);

if (
  env.UZUM_MERCHANT_SERVICE_ID &&
  env.UZUM_MERCHANT_LOGIN &&
  env.UZUM_MERCHANT_PASSWORD
) {
  checks.push(["uzum sandbox", () => run("npm", ["run", "uzum:sandbox"])]);
} else {
  console.warn("⚠ UZUM credentials missing — skip sandbox (expected before contract)");
}

console.log("\n→ uzum readiness (informational)...");
spawnSync("npm", ["run", "uzum:check"], { cwd: root, stdio: "inherit", shell: true });

console.log("\n=== FundingPro pilot readiness ===\n");
let failed = 0;
for (const [name, fn] of checks) {
  process.stdout.write(`→ ${name}... `);
  const ok = fn();
  console.log(ok ? "OK" : "FAIL");
  if (!ok) failed += 1;
}

console.log(
  failed === 0
    ? "\n✓ Ready for pilot onboarding. See docs/POST_UZUM_PILOT.md\n"
    : `\n✗ ${failed} check(s) failed. Fix before onboarding pilots.\n`
);
process.exit(failed > 0 ? 1 : 0);
