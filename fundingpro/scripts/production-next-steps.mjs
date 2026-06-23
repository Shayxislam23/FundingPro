#!/usr/bin/env node
/**
 * Production deploy orchestration (steps after deploy:prep).
 * 1. Validate .env.production.local
 * 2. Push env to Vercel
 * 3. Optional: remote DB migrate + seed (DATABASE_URL)
 * 4. vercel --prod
 *
 * Usage: node scripts/production-next-steps.mjs [--skip-db] [--skip-deploy]
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const skipDb = args.includes("--skip-db");
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
  console.error("Supabase project ref: xgvwfnfifzsgscwvtcnz");
  console.error("Dashboard: https://supabase.com/dashboard/project/xgvwfnfifzsgscwvtcnz");
  process.exit(1);
}

const env = parseEnv(prodEnvPath);
if (env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1")) {
  console.error("NEXT_PUBLIC_SUPABASE_URL must be the hosted Supabase URL, not localhost.");
  process.exit(1);
}

run("npm", ["run", "deploy:prep"], {
  env: { ...process.env, ...env },
});

run("node", ["scripts/vercel-env-push.mjs"]);

if (!skipDb && env.DATABASE_URL) {
  console.log("\nApplying migrations to remote database...");
  const migrationFiles = readdirSync(join(root, "supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  try {
    await pool.query("SELECT 1");
    for (const file of migrationFiles) {
      const sql = readFileSync(join(root, "supabase/migrations", file), "utf8");
      console.log(`  Applying ${file}...`);
      await pool.query(sql);
    }
    const seedSql = readFileSync(join(root, "supabase/seed.sql"), "utf8");
    console.log("  Seeding...");
    await pool.query(seedSql);
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM grants");
    console.log(`  Grants in DB: ${rows[0]?.n ?? 0}`);
  } catch (err) {
    console.error("Remote DB step failed:", err instanceof Error ? err.message : err);
    console.error("If project is paused, restore it in Supabase Dashboard, then retry.");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (!skipDeploy) {
  run("npx", ["vercel", "--prod", "--yes"]);
}

console.log("\n✓ Production next steps completed.");
console.log("Manual: Supabase Dashboard → Authentication → SMTP (Resend) if not configured.");
