#!/usr/bin/env node
/**
 * Post-deploy verification: confirms the live site actually reflects the
 * commit that was just pushed to main, instead of assuming "merged" means
 * "deployed". Polls health, checks landing copy (individuals-first), and
 * validates .well-known App Links routes.
 *
 * Usage: PROD_BASE_URL=https://www.fundingpro.uz node scripts/production-content-check.mjs
 */
const BASE = (process.env.PROD_BASE_URL ?? "https://www.fundingpro.uz").replace(/\/$/, "");
const MAX_WAIT_MS = Number(process.env.PROD_CHECK_MAX_WAIT_MS ?? 8 * 60_000);
const POLL_INTERVAL_MS = 15_000;
const REQUIRE_COMPLETE_APP_LINKS = process.env.REQUIRE_COMPLETE_APP_LINKS === "1";

const STALE_MARKERS = [
  "Для бизнеса и молодёжи Узбекистана",
  "Для НКО Узбекистана",
];
const FRESH_MARKER = "Для физических лиц в Узбекистане";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealthy() {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/v1/health`);
      if (res.status === 200 || res.status === 503) {
        console.log(`Health check responded ${res.status} — site is reachable.`);
        return true;
      }
    } catch (err) {
      console.log(`Health check unreachable yet (${err.message}), retrying...`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return false;
}

async function checkAppleAppSiteAssociation() {
  const res = await fetch(`${BASE}/.well-known/apple-app-site-association`);
  const contentType = res.headers.get("content-type") ?? "";

  if (res.status !== 200) {
    console.error(`FAIL: GET /.well-known/apple-app-site-association returned ${res.status}`);
    return false;
  }

  if (!contentType.includes("application/json")) {
    console.error(
      `FAIL: AASA content-type is "${contentType}" — expected application/json`
    );
    return false;
  }

  if (REQUIRE_COMPLETE_APP_LINKS) {
    const config = res.headers.get("X-App-Links-Config");
    if (config === "incomplete") {
      const missing = res.headers.get("X-App-Links-Missing") ?? "";
      console.error(
        `FAIL: X-App-Links-Config is incomplete (${missing || "set APPLE_TEAM_ID on Vercel"})`
      );
      return false;
    }
  }

  console.log("OK — apple-app-site-association returns 200 with JSON content-type.");
  return true;
}

async function main() {
  console.log(`Verifying production deploy at ${BASE}\n`);

  const healthy = await waitForHealthy();
  if (!healthy) {
    console.error(`FAIL: ${BASE} did not become reachable within ${MAX_WAIT_MS / 1000}s.`);
    process.exit(1);
  }

  const aasaOk = await checkAppleAppSiteAssociation();
  if (!aasaOk) {
    process.exit(1);
  }

  const res = await fetch(BASE);
  const html = await res.text();

  const staleFound = STALE_MARKERS.filter((marker) => html.includes(marker));
  const hasFresh = html.includes(FRESH_MARKER);

  if (staleFound.length > 0 || !hasFresh) {
    console.error(
      "FAIL: production landing page does not reflect the latest merge to main.\n" +
        `  Stale markers found: ${staleFound.length > 0 ? staleFound.join(", ") : "none"}\n` +
        `  Fresh marker ("${FRESH_MARKER}") present: ${hasFresh}\n` +
        "This means main was updated but the deployed site was not — check the " +
        "Vercel project's GitHub integration and production branch setting."
    );
    process.exit(1);
  }

  console.log("OK — production reflects the latest individuals-first copy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
