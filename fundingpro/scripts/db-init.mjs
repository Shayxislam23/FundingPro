#!/usr/bin/env node
/**
 * Initialize local Postgres: migration + seed + dev user.
 * Usage: npm run db:init
 */
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const connectionString =
  process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Set LOCAL_DATABASE_URL or DATABASE_URL");
  process.exit(1);
}

const migrationFiles = readdirSync(join(root, "supabase/migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort();

const seedSql = readFileSync(join(root, "supabase/seed.sql"), "utf8");

const devUserSql = `
INSERT INTO users (id, email, email_verified, is_active)
VALUES ('c0000001-0000-4000-8000-000000000001', 'info@info.uz', true, true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, email_verified = true, is_active = true;

INSERT INTO user_identities (user_id, provider, provider_id)
VALUES ('c0000001-0000-4000-8000-000000000001', 'local_dev', 'info@info.uz')
ON CONFLICT (provider, provider_id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('d3000001-0000-4000-8000-000000000001', 'c0000001-0000-4000-8000-000000000001', 'ADMIN')
ON CONFLICT (organization_id, user_id) DO NOTHING;
`;

const pool = new pg.Pool({ connectionString });

async function waitForDb(maxAttempts = 30) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch {
      if (i === maxAttempts) throw new Error("Database not reachable");
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

const fresh = process.env.DB_FRESH !== "false";

try {
  console.log("Waiting for database...");
  await waitForDb();

  if (fresh) {
    console.log("Resetting public schema (set DB_FRESH=false to skip)...");
    await pool.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);
  }

  console.log("Applying migrations...");
  for (const file of migrationFiles) {
    const sql = readFileSync(join(root, "supabase/migrations", file), "utf8");
    console.log(`  ${file}`);
    await pool.query(sql);
  }
  console.log("Seeding data...");
  await pool.query(seedSql);
  console.log("Creating dev user (info@info.uz)...");
  await pool.query(devUserSql);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM grants");
  console.log(`Done. Grants in DB: ${rows[0]?.n ?? 0}`);
} catch (err) {
  console.error("db-init failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
