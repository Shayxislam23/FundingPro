#!/usr/bin/env node
/**
 * Export users/orgs/applications from legacy Postgres to JSON for Convex import.
 *
 * DEPRECATED for normal development — use `npm run convex:seed` for catalog data.
 * One-time migration tool only (requires legacy DATABASE_URL in .env.local).
 *
 * Usage: npm run convex:export-pg
 *
 * Reads LOCAL_DATABASE_URL (or DATABASE_URL) from .env.local.
 * Output: data/pg-export.json
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const merged = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const p = join(root, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (merged[m[1]] === undefined) merged[m[1]] = v;
    }
  }
  return merged;
}

function toMs(value) {
  if (!value) return null;
  return new Date(value).getTime();
}

const env = loadEnv();
const connectionString =
  env.LOCAL_DATABASE_URL ?? env.DATABASE_URL ?? process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "No LOCAL_DATABASE_URL or DATABASE_URL — skipping PG export. Convex can still start with seed catalog only."
  );
  process.exit(0);
}

const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5000 });

try {
  await pool.query("SELECT 1");
} catch (err) {
  console.warn(
    "Postgres not reachable — skipping export.",
    err instanceof Error ? err.message : err
  );
  console.warn(
    "Start local PG (docker compose) or export from your legacy database manually."
  );
  process.exit(0);
}

try {
  const [usersRes, orgsRes, membersRes, appsRes, paymentsRes, consentsRes] =
    await Promise.all([
      pool.query(`
        SELECT id, email, phone, email_verified, is_active, is_banned,
               COALESCE(platform_role, 'user') AS platform_role,
               created_at, updated_at, deleted_at
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at
      `),
      pool.query(`
        SELECT id, name, legal_name, type, country, city, sector,
               description, website, registration_no, is_verified,
               created_at, updated_at, deleted_at
        FROM organizations
        WHERE deleted_at IS NULL
        ORDER BY created_at
      `),
      pool.query(`
        SELECT organization_id, user_id, role, created_at, updated_at
        FROM organization_members
        ORDER BY created_at
      `),
      pool.query(`
        SELECT a.user_id, a.organization_id, g.title AS grant_title,
               a.status, a.notes, a.submitted_at, a.created_at, a.updated_at
        FROM applications a
        JOIN grants g ON g.id = a.grant_id
        ORDER BY a.created_at
      `),
      pool.query(`
        SELECT user_id, amount_usd, currency, status, provider,
               provider_ref_id, idempotency_key, service_type, metadata,
               activated_at, created_at, updated_at
        FROM payments
        ORDER BY created_at
      `),
      pool.query(`
        SELECT user_id, consent_type, document_version, locale, accepted_at
        FROM user_consents
        ORDER BY accepted_at
      `),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    source: connectionString.replace(/:[^:@/]+@/, ":***@"),
    users: usersRes.rows.map((r) => ({
      id: r.id,
      email: r.email,
      phone: r.phone,
      emailVerified: r.email_verified,
      isActive: r.is_active,
      isBanned: r.is_banned,
      platformRole: r.platform_role === "admin" ? "admin" : "user",
      createdAt: toMs(r.created_at),
      updatedAt: toMs(r.updated_at),
      deletedAt: toMs(r.deleted_at),
    })),
    organizations: orgsRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      legalName: r.legal_name,
      type: r.type,
      country: r.country,
      city: r.city,
      sector: r.sector,
      description: r.description,
      website: r.website,
      registrationNo: r.registration_no,
      isVerified: r.is_verified,
      createdAt: toMs(r.created_at),
      updatedAt: toMs(r.updated_at),
      deletedAt: toMs(r.deleted_at),
    })),
    organizationMembers: membersRes.rows.map((r) => ({
      organizationId: r.organization_id,
      userId: r.user_id,
      role: r.role,
      createdAt: toMs(r.created_at),
      updatedAt: toMs(r.updated_at),
    })),
    applications: appsRes.rows.map((r) => ({
      userId: r.user_id,
      organizationId: r.organization_id,
      grantTitle: r.grant_title,
      status: r.status,
      notes: r.notes,
      submittedAt: toMs(r.submitted_at),
      createdAt: toMs(r.created_at),
      updatedAt: toMs(r.updated_at),
    })),
    payments: paymentsRes.rows.map((r) => ({
      userId: r.user_id,
      amountUsd: Number(r.amount_usd),
      currency: r.currency,
      status: r.status,
      provider: r.provider,
      providerRefId: r.provider_ref_id,
      idempotencyKey: r.idempotency_key,
      serviceType: r.service_type,
      metadata: r.metadata ?? undefined,
      activatedAt: toMs(r.activated_at),
      createdAt: toMs(r.created_at),
      updatedAt: toMs(r.updated_at),
    })),
    userConsents: consentsRes.rows.map((r) => ({
      userId: r.user_id,
      consentType: r.consent_type,
      documentVersion: r.document_version,
      locale: r.locale,
      createdAt: toMs(r.accepted_at),
    })),
  };

  const outDir = join(root, "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "pg-export.json");
  writeFileSync(outPath, JSON.stringify(payload, null, 2));

  console.log("Export completed:", outPath);
  console.log({
    users: payload.users.length,
    organizations: payload.organizations.length,
    organizationMembers: payload.organizationMembers.length,
    applications: payload.applications.length,
    payments: payload.payments.length,
    userConsents: payload.userConsents.length,
  });
} catch (err) {
  console.error("Export failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
