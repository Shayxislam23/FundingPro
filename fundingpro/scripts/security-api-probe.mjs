#!/usr/bin/env node
/**
 * Dynamic API security probes — auth boundaries, headers, public routes.
 * Usage:
 *   node scripts/security-api-probe.mjs
 *   SMOKE_BASE_URL=https://www.fundingpro.uz node scripts/security-api-probe.mjs
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.TEST_PORT ?? 3099);
const BASE = process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const USE_EXTERNAL = Boolean(process.env.SMOKE_BASE_URL);
const IS_PROD = BASE.includes("fundingpro.uz");

let serverProc = null;
const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(pass ? `  ✓ ${name}` : `  ✗ ${name}${detail ? `: ${detail}` : ""}`);
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    signal: AbortSignal.timeout(Number(process.env.PROBE_TIMEOUT_MS ?? 20_000)),
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 200) };
  }
  return { status: res.status, json, headers: res.headers };
}

async function waitForServer(maxMs = 90_000) {
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
  throw new Error(`Server not ready at ${BASE}`);
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
  await waitForServer();
}

async function stopServer() {
  if (!serverProc || serverProc.killed) return;
  serverProc.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 2000));
  if (!serverProc.killed) serverProc.kill("SIGKILL");
}

async function runProbes() {
  console.log(`Security API probe → ${BASE}${IS_PROD ? " (production read-only)" : ""}\n`);

  // Auth boundaries
  const me = await fetchJson("/api/v1/me");
  record("GET /me without auth → 401", me.status === 401);

  const admin = await fetchJson("/api/v1/admin/dashboard");
  record("GET /admin/dashboard without auth → 401", admin.status === 401);

  const apps = await fetchJson("/api/v1/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grantId: "00000000-0000-0000-0000-000000000001" }),
  });
  record("POST /applications without auth → 401", apps.status === 401);

  const docs = await fetchJson("/api/v1/documents/upload", { method: "POST" });
  record("POST /documents/upload without auth → 401", docs.status === 401);

  const ai = await fetchJson("/api/v1/ai/proposal/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grantId: "00000000-0000-0000-0000-000000000001" }),
  });
  record("POST /ai/proposal/generate without auth → 401", ai.status === 401);

  // Public routes
  const grants = await fetchJson("/api/v1/grants?limit=1");
  record("GET /grants public → 200", grants.status === 200);

  const plans = await fetchJson("/api/v1/plans");
  record("GET /plans public → 200", plans.status === 200);

  const health = await fetchJson("/api/v1/health");
  record("GET /health → 200 or 503", [200, 503].includes(health.status));
  if (IS_PROD && health.json?.database?.error) {
    record("Production health does not leak dbError", false, JSON.stringify(health.json.database));
  } else {
    record("Production health does not leak dbError", true);
  }

  const webhook = await fetchJson("/api/v1/payments/webhook", { method: "POST" });
  record("Legacy webhook → 410", webhook.status === 410);

  // BOLA without auth should be 401 not 200
  const bolaApp = await fetchJson("/api/v1/applications/00000000-0000-0000-0000-000000000099", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "saved" }),
  });
  record("PATCH /applications/[id] without auth → 401", bolaApp.status === 401);

  const bolaDoc = await fetchJson("/api/v1/documents/00000000-0000-0000-0000-000000000099/download");
  record("GET /documents/[id]/download without auth → 401", bolaDoc.status === 401);

  const uzum = await fetchJson("/api/v1/payments/uzum/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  record(
    "POST /payments/uzum/check without auth → 401 or 500 if unconfigured",
    uzum.status === 401 || uzum.status === 500,
    String(uzum.status)
  );

  // Security headers (page)
  try {
    const pageRes = await fetch(`${BASE}/`, {
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
    const h = pageRes.headers;
    const hasFrame = h.get("x-frame-options") || h.get("content-security-policy")?.includes("frame-ancestors");
    record("Homepage has clickjacking protection", Boolean(hasFrame), hasFrame ? "" : "missing X-Frame-Options/CSP frame-ancestors");
    record("Homepage has X-Content-Type-Options", h.get("x-content-type-options") === "nosniff");
  } catch (e) {
    record("Homepage headers fetch", false, e instanceof Error ? e.message : String(e));
  }

  // CORS preflight
  try {
    const corsRes = await fetch(`${BASE}/api/v1/grants`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.example.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    const acao = corsRes.headers.get("access-control-allow-origin");
    record(
      "CORS does not reflect evil origin",
      acao !== "https://evil.example.com" && acao !== "*",
      acao ?? "no ACAO header"
    );
  } catch (e) {
    record("CORS preflight", false, e instanceof Error ? e.message : String(e));
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} probes passed`);
  if (failed.length) {
    console.error("\nFailed probes:");
    for (const f of failed) console.error(`  - ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
    process.exit(1);
  }
}

const skipBuild =
  USE_EXTERNAL ||
  process.env.SKIP_PROBE_BUILD === "true" ||
  existsSync(resolve(root, ".next", "BUILD_ID"));

try {
  if (!skipBuild) {
    console.log("Building for probe...");
    const build = spawn("npm", ["run", "build"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NEXT_PUBLIC_CONVEX_URL:
          process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_placeholder",
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "sk_test_placeholder",
        RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_placeholder",
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "info@fundingpro.uz",
        ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "admin@fundingpro.uz",
      },
    });
    await new Promise((resolve, reject) => {
      build.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`build ${code}`))));
    });
  }

  await startServer();
  await runProbes();
} catch (err) {
  console.error("\n✗", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await stopServer();
}
