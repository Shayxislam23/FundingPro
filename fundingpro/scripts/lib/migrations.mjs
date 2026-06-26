import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/** @deprecated Legacy Postgres migration helpers — not used by Convex runtime. */

/** Legacy PG migrations that require a `storage` schema. */
export function isStorageSchemaMigration(filename) {
  return /storage/i.test(filename);
}

/** Legacy PG migrations that are RLS-only and require auth roles. */
export function isRlsAuthMigration(filename) {
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

export async function hasAuthRoles(pool) {
  const result = await pool.query(
    `SELECT 1 FROM pg_roles WHERE rolname IN ('authenticated', 'anon', 'service_role') LIMIT 1`
  );
  return (result.rowCount ?? 0) > 0;
}

export async function shouldSkipMigration(pool, filename) {
  if (isStorageSchemaMigration(filename)) {
    return !(await hasStorageSchema(pool));
  }
  if (isRlsAuthMigration(filename)) {
    return !(await hasAuthRoles(pool));
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
      const reason = isStorageSchemaMigration(file)
        ? "no storage schema"
        : "no auth roles";
      console.log(`  skip ${file} (${reason} — legacy PG migrations no longer used)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`  ${file}`);
    await pool.query(sql);
  }
}
