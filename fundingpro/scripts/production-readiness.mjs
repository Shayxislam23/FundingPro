#!/usr/bin/env node
/**
 * Production + growth readiness (code-side checks).
 * Manual steps: Supabase SMTP, Storage bucket, Vercel env, Uzum contract.
 *
 * Usage: npm run production:readiness
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(label, args) {
  console.log(`\n→ ${label}`);
  const r = spawnSync("npm", args, { cwd: root, stdio: "inherit", shell: true });
  return r.status === 0;
}

console.log("=== FundingPro production readiness (automated) ===\n");

if (process.env.NODE_ENV === "production" && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("FAIL: SUPABASE_SERVICE_ROLE_KEY is required in production");
  process.exit(1);
}

const steps = [
  ["typecheck + unit tests", ["run", "check"]],
  ["lint", ["run", "lint"]],
  ["deploy env check", ["run", "deploy:check"]],
];

let failed = 0;
for (const [label, args] of steps) {
  if (!run(label, args)) failed += 1;
}

console.log("\n→ uzum checklist (informational — may show blockers before contract)...");
spawnSync("npm", ["run", "uzum:check"], { cwd: root, stdio: "inherit", shell: true });

console.log("\n--- Manual steps (cannot automate without your credentials) ---");
console.log("  • supabase link --project-ref xgvwfnfifzsgscwvtcnz && supabase db push");
console.log("  • DATABASE_URL=... npm run db:seed");
console.log("  • Supabase Dashboard → SMTP (Resend) + Storage bucket documents");
console.log("  • npm run deploy:env  (after .env.production.local)");
console.log("  • vercel --prod  OR  npm run deploy:production");
console.log("  • Growth: TELEGRAM_* + analytics keys → docs/GROWTH_PLAYBOOK.md");
console.log("  • Pilot: docs/POST_UZUM_PILOT.md + npm run pilot:check");
console.log("---------------------------------------------------------------\n");

process.exit(failed > 0 ? 1 : 0);
