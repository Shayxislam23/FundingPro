#!/usr/bin/env node
/**
 * API auth boundary integration tests against a running Next.js server.
 * Usage: npm run test:integration
 *
 * Starts `next start` on TEST_PORT (default 3099) if SMOKE_BASE_URL is not set.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.TEST_PORT ?? 3099);
const BASE = process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const USE_EXTERNAL = Boolean(process.env.SMOKE_BASE_URL);

let serverProc = null;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    signal: AbortSignal.timeout(Number(process.env.INTEGRATION_FETCH_TIMEOUT_MS ?? 15_000)),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function assert(name, condition, detail = "") {
  if (!condition) {
    throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`  ✓ ${name}`);
}

async function waitForServer(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/v1/health`);
      if (res.ok || res.status === 503) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server not ready at ${BASE} after ${maxMs}ms`);
}

async function startServer() {
  if (USE_EXTERNAL) return;

  serverProc = spawn("npx", ["next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
    cwd: root,
    stdio: "ignore",
    env: {
      ...process.env,
      PORT: String(PORT),
      USE_LOCAL_DATABASE: process.env.USE_LOCAL_DATABASE ?? "true",
    },
  });

  serverProc.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`next start exited with code ${code}`);
    }
  });

  await waitForServer(Number(process.env.INTEGRATION_SERVER_TIMEOUT_MS ?? 90_000));
}

function stopServer() {
  if (serverProc && !serverProc.killed) {
    serverProc.kill("SIGTERM");
  }
}

async function runTests() {
  console.log(`API auth integration → ${BASE}\n`);

  // Auth boundary checks — do not require database for these
  const me = await request("/api/v1/me");
  assert("GET /me without auth → 401", me.status === 401);

  const adminDash = await request("/api/v1/admin/dashboard");
  assert("GET /admin/dashboard without auth → 401", adminDash.status === 401);

  const postApp = await request("/api/v1/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grantId: "00000000-0000-0000-0000-000000000001" }),
  });
  assert("POST /applications without auth → 401", postApp.status === 401);

  const webhook = await request("/api/v1/payments/webhook", { method: "POST" });
  assert("POST legacy /payments/webhook → 410", webhook.status === 410);
  assert("webhook redirect hint present", typeof webhook.json?.redirect === "string");

  const health = await request("/api/v1/health");
  assert("GET /health → 200 or 503", [200, 503].includes(health.status));

  const grants = await request("/api/v1/grants?limit=3");
  assert("GET /grants public → 200 or 500", [200, 500].includes(grants.status));
  if (grants.status === 200) {
    assert("grants returns array", Array.isArray(grants.json?.data?.grants));
  }

  console.log("\nAll API auth integration checks passed.");
}

const skipBuild =
  USE_EXTERNAL ||
  process.env.SKIP_INTEGRATION_BUILD === "true" ||
  existsSync(resolve(root, ".next", "BUILD_ID"));

try {
  if (!skipBuild) {
    console.log("Building Next.js app...");
    const build = spawn("npm", ["run", "build"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        USE_LOCAL_DATABASE: process.env.USE_LOCAL_DATABASE ?? "true",
        NEXT_PUBLIC_SUPABASE_URL:
          process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
      },
    });
    await new Promise((resolve, reject) => {
      build.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${code}`))));
    });
  }

  await startServer();
  await runTests();
} catch (err) {
  console.error("\n✗", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  stopServer();
}
