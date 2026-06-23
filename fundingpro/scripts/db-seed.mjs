#!/usr/bin/env node
/**
 * Apply supabase/seed.sql to DATABASE_URL or LOCAL_DATABASE_URL.
 * Usage: npm run db:seed
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const connectionString =
  process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Set DATABASE_URL or LOCAL_DATABASE_URL");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "../supabase/seed.sql"), "utf8");
const pool = new pg.Pool({ connectionString });

try {
  await pool.query(sql);
  console.log("Seed completed successfully.");
} catch (err) {
  console.error("Seed failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
