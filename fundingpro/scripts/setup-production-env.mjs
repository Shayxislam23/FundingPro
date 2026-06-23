#!/usr/bin/env node
/**
 * Generate .env.production.local from .env.production.example + local Resend config.
 * Fill Supabase keys from dashboard before running deploy:production.
 *
 * Dashboard: https://supabase.com/dashboard/project/xgvwfnfifzsgscwvtcnz/settings/api
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, ".env.production.local");
const examplePath = join(root, ".env.production.example");
const localPath = join(root, ".env.local");

function parseEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
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

const local = parseEnv(localPath);
let template = readFileSync(examplePath, "utf8");

template = template.replace(
  'NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"',
  'NEXT_PUBLIC_SUPABASE_URL="https://xgvwfnfifzsgscwvtcnz.supabase.co"'
);

if (local.RESEND_API_KEY) {
  template = template.replace(/RESEND_API_KEY=".*"/, `RESEND_API_KEY="${local.RESEND_API_KEY}"`);
}
if (local.RESEND_FROM_EMAIL) {
  template = template.replace(
    /RESEND_FROM_EMAIL=".*"/,
    `RESEND_FROM_EMAIL="${local.RESEND_FROM_EMAIL}"`
  );
}
if (local.ADMIN_EMAILS) {
  template = template.replace(/ADMIN_EMAILS=".*"/, `ADMIN_EMAILS="${local.ADMIN_EMAILS}"`);
}

const placeholders = `
# --- Fill from Supabase Dashboard (Settings → API / Database) ---
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
DATABASE_URL=""
DIRECT_URL=""
`;

if (!template.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=\"\"")) {
  template += placeholders;
}

writeFileSync(outPath, template, "utf8");
console.log(`Created ${outPath}`);
console.log("\nNext:");
console.log("  1. Open https://supabase.com/dashboard/project/xgvwfnfifzsgscwvtcnz/settings/api");
console.log("  2. Paste anon + service_role keys into .env.production.local");
console.log("  3. Add DATABASE_URL + DIRECT_URL from Settings → Database");
console.log("  4. After Uzum contract — fill UZUM_* in .env.production.local");
console.log("  5. If project is paused — restore it in Dashboard first");
console.log("  6. npm run deploy:production");
console.log("  7. npm run uzum:check && npm run uzum:webhooks");
