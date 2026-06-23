#!/usr/bin/env node
/**
 * Enable PAYMENTS_ENABLED=true only after readiness checks pass.
 * Updates .env.production.local (never commits secrets).
 *
 * Usage: npm run uzum:enable
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prodEnv = join(root, ".env.production.local");

console.log("Running uzum:check first...\n");
const check = spawnSync("npm", ["run", "uzum:check"], { cwd: root, stdio: "inherit", shell: true });
if (check.status !== 0) {
  console.error("\nGo-live check failed. Fix blockers before enabling payments.");
  process.exit(1);
}

console.log("\nRunning uzum:sandbox E2E (requires dev server on :3000)...\n");
const sandbox = spawnSync("npm", ["run", "uzum:sandbox"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PAYMENTS_ENABLED: "true" },
});

if (sandbox.status !== 0) {
  console.error(
    "\nSandbox E2E failed or dev server not running.\n" +
      "Start: PAYMENTS_ENABLED=true npm run dev\n" +
      "Then:  npm run uzum:sandbox\n" +
      "Or use --force to enable without E2E (not recommended)."
  );
  if (!process.argv.includes("--force")) process.exit(1);
  console.warn("\n--force: enabling despite failed E2E\n");
}

if (!existsSync(prodEnv)) {
  console.error("Create .env.production.local first (npm run deploy:setup-env)");
  process.exit(1);
}

let content = readFileSync(prodEnv, "utf8");
if (/^PAYMENTS_ENABLED=/m.test(content)) {
  content = content.replace(/^PAYMENTS_ENABLED=.*$/m, "PAYMENTS_ENABLED=true");
} else {
  content += "\nPAYMENTS_ENABLED=true\n";
}
if (/^PAYMENT_INTEGRATION_STATUS=/m.test(content)) {
  content = content.replace(/^PAYMENT_INTEGRATION_STATUS=.*$/m, "PAYMENT_INTEGRATION_STATUS=active");
} else {
  content += "PAYMENT_INTEGRATION_STATUS=active\n";
}

writeFileSync(prodEnv, content, "utf8");
console.log("Updated .env.production.local: PAYMENTS_ENABLED=true");
console.log("\nNext:");
console.log("  1. npm run deploy:env     # push to Vercel");
console.log("  2. npx vercel --prod      # redeploy");
console.log("  3. Verify https://fundingpro.uz/api/v1/payments/status");
