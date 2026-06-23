import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/** Migrations that require Supabase `storage` schema (not plain Postgres / CI). */
export function isSupabaseStorageMigration(filename) {
  return /storage/i.test(filename);
}

/** Migrations that are RLS-only and require Supabase auth roles. */
export function isSupabaseRlsMigration(filename) {
  return (
    /_rls\.sql$/i.test(filename) ||
    /rls_sensitive/i.test(filename) ||
    /rls_user_tables_extend/i.test(filename)
  );
}

export async function hasStorageSchema(pool) {
  const result = await pool.query(
    `SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage' LIMIT 1`
  );
  return (result.rowCount ?? 0) > 0;
}

export async function hasSupabaseAuthRoles(pool) {
  const result = await pool.query(
    `SELECT 1 FROM pg_roles WHERE rolname IN ('authenticated', 'anon', 'service_role') LIMIT 1`
  );
  return (result.rowCount ?? 0) > 0;
}

export async function shouldSkipMigration(pool, filename) {
  if (isSupabaseStorageMigration(filename)) {
    return !(await hasStorageSchema(pool));
  }
  if (isSupabaseRlsMigration(filename)) {
    return !(await hasSupabaseAuthRoles(pool));
  }
  return false;
}

export function listMigrationFiles(migrationsDir) {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export async function applyMigrations(pool, migrationsDir) {
  for (const file of listMigrationFiles(migrationsDir)) {
    if (await shouldSkipMigration(pool, file)) {
      const reason = isSupabaseStorageMigration(file)
        ? "no storage schema"
        : "no Supabase auth roles";
      console.log(`  skip ${file} (${reason} — use supabase db push on hosted Supabase)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`  ${file}`);
    await pool.query(sql);
  }
}
