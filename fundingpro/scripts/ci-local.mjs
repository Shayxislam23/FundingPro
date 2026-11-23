#!/usr/bin/env node
/**
 * Local stand-in for GitHub Actions until billing unlocks CI.
 * Run from repo root: npm run ci:local
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function run(label, command, args, cwd) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`\nFAILED: ${label}`);
    process.exit(result.status ?? 1);
  }
}

run("Web typecheck", "npm", ["run", "typecheck"], path.join(root, "fundingpro"));
run("Web lint", "npm", ["run", "lint"], path.join(root, "fundingpro"));
run("Web unit tests", "npm", ["run", "test"], path.join(root, "fundingpro"));
run("Convex tests", "npm", ["run", "test:convex"], path.join(root, "fundingpro"));
run("Mobile typecheck", "npm", ["run", "typecheck"], path.join(root, "mobile"));
run("npm audit (high/critical)", "npm", ["audit", "--audit-level=high"], root);

if (process.env.CI_LOCAL_SMOKE === "1") {
  run("Smoke (running Next)", "npm", ["run", "test:smoke"], path.join(root, "fundingpro"));
} else {
  console.log("\n==> Smoke skipped (set CI_LOCAL_SMOKE=1 when Next is on :3000)");
}

console.log("\nAll local CI checks passed.");
