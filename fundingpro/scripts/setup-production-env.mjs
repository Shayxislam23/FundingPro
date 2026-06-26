#!/usr/bin/env node
/**
 * Generate .env.production.local from .env.production.example + local Resend config.
 * Fill Convex and Clerk keys before running deploy:production.
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
if (local.NEXT_PUBLIC_CONVEX_URL) {
  template = template.replace(
    /NEXT_PUBLIC_CONVEX_URL=".*"/,
    `NEXT_PUBLIC_CONVEX_URL="${local.NEXT_PUBLIC_CONVEX_URL}"`
  );
}

writeFileSync(outPath, template, "utf8");
console.log(`Created ${outPath}`);
console.log("\nNext:");
console.log("  1. Set NEXT_PUBLIC_CONVEX_URL and CONVEX_DEPLOY_KEY from Convex Dashboard");
console.log("  2. Set Clerk keys from https://dashboard.clerk.com");
console.log("  3. After Uzum contract — fill UZUM_* in .env.production.local");
console.log("  4. npm run deploy:production");
console.log("  5. npm run uzum:check && npm run uzum:webhooks");
