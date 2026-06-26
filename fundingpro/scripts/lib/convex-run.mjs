#!/usr/bin/env node
/**
 * Run Convex internal functions from Node scripts (E2E, tooling).
 * Requires `npx convex dev` or a deployed Convex backend.
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
export const fundingproRoot = join(scriptsDir, "..");

export function loadEnvFiles(root = fundingproRoot) {
  const merged = { ...process.env };
  for (const file of [".env.local", ".env"]) {
    const p = join(root, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (merged[m[1]] === undefined) merged[m[1]] = v;
    }
  }
  return merged;
}

/**
 * @param {string} functionPath e.g. "e2eTest:seedUzumPayment"
 * @param {Record<string, unknown>} [args]
 */
export function convexRun(functionPath, args = {}) {
  const payload = JSON.stringify(args);
  const output = execSync(`npx convex run ${functionPath} '${payload.replace(/'/g, "'\\''")}'`, {
    cwd: fundingproRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
  });
  const trimmed = output.trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed);
}

export function requireConvexUrl(env = loadEnvFiles()) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL required. Is `npx convex dev` running?");
  }
  return url;
}
