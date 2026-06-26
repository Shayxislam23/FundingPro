#!/usr/bin/env node
/**
 * Production deploy orchestration (steps after deploy:prep).
 * 1. Validate .env.production.local
 * 2. Push env to Vercel
 * 3. Optional: Convex seed (CONVEX_DEPLOY_KEY)
 * 4. vercel --prod
 *
 * Usage: node scripts/production-next-steps.mjs [--skip-seed] [--skip-deploy]
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const skipSeed = args.includes("--skip-seed") || args.includes("--skip-db");
const skipDeploy = args.includes("--skip-deploy");

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n→ ${cmd} ${cmdArgs.join(" ")}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: "inherit", ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function parseEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const prodEnvPath = join(root, ".env.production.local");
if (!existsSync(prodEnvPath)) {
  console.error("Create .env.production.local from .env.production.example first.");
  console.error("Run: npm run deploy:setup-env");
  process.exit(1);
}

const env = parseEnv(prodEnvPath);
if (!env.NEXT_PUBLIC_CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL is required in .env.production.local");
  process.exit(1);
}

run("npm", ["run", "deploy:prep"], {
  env: { ...process.env, ...env },
});

run("node", ["scripts/vercel-env-push.mjs"]);

if (!skipSeed && env.CONVEX_DEPLOY_KEY) {
  console.log("\nSeeding Convex catalog (if needed)...");
  run("npm", ["run", "convex:seed"], { env: { ...process.env, ...env } });
} else if (!skipSeed) {
  console.log("\nSkipping Convex seed — set CONVEX_DEPLOY_KEY to enable.");
}

if (!skipDeploy) {
  run("npx", ["vercel", "--prod", "--yes"]);
}

console.log("\n✓ Production next steps completed.");
console.log("Manual: verify Clerk production instance and Convex deployment in dashboards.");
