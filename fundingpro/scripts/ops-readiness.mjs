#!/usr/bin/env node
/**
 * Ops readiness gate — runs in-repo checks and prints manual next steps.
 * Does NOT require Vercel/Convex/PSP credentials beyond local .env files.
 *
 * Usage:
 *   npm run ops:readiness
 *   npm run ops:readiness -- --strict   # fail if any sub-check fails
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

function run(label, args, { optional = false } = {}) {
  console.log(`\n━━ ${label} ━━`);
  const r = spawnSync("npm", args, { cwd: root, stdio: "inherit", shell: true });
  const ok = r.status === 0;
  if (!ok && optional) {
    console.log(`  ⚠ ${label} failed (optional — see manual steps below)`);
    return true;
  }
  if (!ok) console.log(`  ✗ ${label} failed`);
  return ok;
}

console.log("FundingPro ops readiness\n");
console.log("Runs deploy:check + app-links (local) + payments:golive (dry).\n");

const results = {
  deploy: run("deploy:check", ["run", "deploy:check"]),
  appLinks: run("app-links:check (local env)", ["run", "app-links:check"], { optional: !strict }),
  payments: run("payments:golive (dry — PAYMENTS_ENABLED may be false)", ["run", "payments:golive"]),
};

const failed = Object.values(results).filter((ok) => !ok).length;

console.log("\n━━ Summary ━━");
console.log(`  deploy:check     ${results.deploy ? "PASS" : "FAIL"}`);
console.log(`  app-links:check  ${results.appLinks ? "PASS" : "WARN/FAIL"}`);
console.log(`  payments:golive  ${results.payments ? "PASS" : "FAIL"}`);

console.log("\n━━ Manual steps (require your dashboards) ━━");
console.log("");
console.log("O1 — Vercel env");
console.log("  [ ] Vercel → Settings → Environment Variables (Production + Preview)");
console.log("  [ ] Required: NEXT_PUBLIC_CONVEX_URL, Clerk keys, RESEND_*, ADMIN_EMAILS");
console.log("  [ ] App Links: APPLE_TEAM_ID, ANDROID_RELEASE_SHA256");
console.log("  [ ] Payments: keep PAYMENTS_ENABLED=false until sandbox passes");
console.log("  [ ] npm run deploy:env  (after filling .env.production.local)");
console.log("  [ ] Redeploy production");
console.log("");
console.log("O2 — Convex deploy");
console.log("  [ ] CONVEX_DEPLOY_KEY in .env.production.local or CI secret");
console.log("  [ ] cd fundingpro && npx convex deploy");
console.log("  [ ] npm run convex:seed:prod  (if catalog empty — docs/PROD-SEED.md)");
console.log("  [ ] CONVEX_SYSTEM_SECRET aligned on Vercel + Convex production");
console.log("");
console.log("O3 — App Links live");
console.log("  [ ] SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live");
console.log("  [ ] Device smoke — mobile/docs/EAS-SMOKE.md");
console.log("  [ ] Mark M-02 Resolved in docs/SECURITY-ROADMAP.md");
console.log("");
console.log("O4 — PSP sandbox → production");
console.log("  [ ] Register webhook URLs with Uzum, Payme, Click");
console.log("  [ ] Preview: PAYMENTS_ENABLED=true npm run payments:golive -- --sandbox");
console.log("  [ ] uzum:sandbox → payme:sandbox → click:sandbox (each exit 0)");
console.log("  [ ] Flip PAYMENTS_ENABLED=true on Vercel Production → redeploy");
console.log("  [ ] SMOKE_BASE_URL=https://www.fundingpro.uz npm run payments:check");
console.log("");
console.log("S4 — Monitoring & pen-test");
console.log("  [ ] npm run security:probe:prod");
console.log("  [ ] External pen-test — docs/PEN-TEST-CHECKLIST.md");
console.log("  [ ] Incident playbook — docs/OPS-RUNBOOK.md#incident-response");
console.log("");
console.log("Docs: docs/OPS-RUNBOOK.md · docs/API-SECURITY.md");
console.log("────────────────────────────────────────────────────────\n");

if (failed > 0) {
  const hardFail = results.deploy === false || strict;
  console.log(
    hardFail
      ? "Ops readiness FAILED — fix deploy:check or use --strict"
      : "Ops readiness: warnings above — complete manual O1–O4 steps (exit 0 without --strict)"
  );
  process.exit(hardFail ? 1 : 0);
}

console.log("Ops readiness: in-repo checks passed — complete manual steps above.");
process.exit(0);
