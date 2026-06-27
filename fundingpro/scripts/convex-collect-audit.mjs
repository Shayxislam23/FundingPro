#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const convexDir = path.resolve(__dirname, "../convex");

const allowlistBasenames = new Set(["seed.ts", "importData.ts"]);

function isAllowlisted(relPath) {
  const base = path.basename(relPath);
  if (allowlistBasenames.has(base)) return true;
  if (base.endsWith(".test.ts")) return true;
  return false;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      if (entry.isFile() && fullPath.endsWith(".ts")) return [fullPath];
      return [];
    })
  );
  return files.flat();
}

async function main() {
  const files = await walk(convexDir);
  const violations = [];

  for (const file of files) {
    const rel = path.relative(convexDir, file);
    if (isAllowlisted(rel)) continue;

    const content = await fs.readFile(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.includes(".collect(") || line.includes(".collect();")) {
        violations.push(`${rel}:${i + 1}: ${line.trim()}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error("Found disallowed .collect() usage in Convex runtime files:");
    for (const row of violations) console.error(` - ${row}`);
    console.error(
      "Allowlisted: seed.ts, importData.ts, and *.test.ts only."
    );
    process.exit(1);
  }

  console.log("convex-collect-audit passed: no disallowed .collect() usage.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
