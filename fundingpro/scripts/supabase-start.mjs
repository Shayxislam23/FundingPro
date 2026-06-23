#!/usr/bin/env node
/**
 * Start local Supabase with env from .env.local (RESEND_API_KEY for real OTP emails).
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠ RESEND_API_KEY not set — OTP emails may fail. Add it to .env.local");
} else {
  console.log("✓ RESEND_API_KEY loaded — auth emails will go to real inboxes via Resend");
}

const args = process.argv.slice(2);
const cmd = args[0] === "stop" ? ["supabase", "stop"] : ["supabase", "start"];

const result = spawnSync("npx", cmd, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
