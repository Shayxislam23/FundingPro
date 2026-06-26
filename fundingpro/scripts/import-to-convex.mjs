#!/usr/bin/env node
/**
 * Import pg-export.json into Convex via internal mutation.
 * Usage: npm run convex:import-pg
 *
 * Run convex:seed first so grants exist for application linking.
 * Users get import:<pgUuid> clerkId; real clerkId is set on first Clerk login.
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const exportPath = join(root, "data", "pg-export.json");

if (!existsSync(exportPath)) {
  console.error(`Missing ${exportPath} — run npm run convex:export-pg first.`);
  process.exit(1);
}

const payload = JSON.parse(readFileSync(exportPath, "utf8"));

const args = JSON.stringify({
  users: payload.users ?? [],
  organizations: payload.organizations ?? [],
  organizationMembers: payload.organizationMembers ?? [],
  applications: payload.applications ?? [],
  payments: payload.payments ?? [],
  userConsents: payload.userConsents ?? [],
});

const result = spawnSync("npx", ["convex", "run", "importData:importBatch", args], {
  cwd: root,
  encoding: "utf8",
});

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status !== 0) {
  console.error("Convex import failed. Is `npx convex dev` running?");
  process.exit(result.status ?? 1);
}

try {
  const parsed = JSON.parse(result.stdout.trim());
  if (parsed.skipped) {
    console.log("Import skipped — imported users already exist in Convex.");
  } else {
    console.log("Convex import completed:", parsed);
  }
} catch {
  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
}
