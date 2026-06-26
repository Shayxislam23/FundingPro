#!/usr/bin/env node
/**
 * Seed Convex catalog from convex/seed.ts (idempotent).
 * Usage: npm run convex:seed
 * Requires: npx convex dev running (or deployed Convex backend).
 */
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

try {
  const output = execSync("npx convex run seed:run", {
    cwd: root,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
  const result = JSON.parse(output.trim());
  if (result.skipped) {
    console.log("Seed skipped — donors already exist in Convex.");
  } else {
    console.log("Convex seed completed:", result);
  }
} catch (err) {
  console.error("Convex seed failed. Is `npx convex dev` running?");
  if (err instanceof Error) {
    console.error(err.message);
  }
  process.exit(1);
}
