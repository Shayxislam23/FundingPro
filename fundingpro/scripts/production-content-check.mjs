#!/usr/bin/env node
/**
 * Post-deploy verification: confirms the live site actually reflects the
 * commit that was just pushed to main, instead of assuming "merged" means
 * "deployed". Polls health, then checks the landing page for a stale
 * marker (old NGO-first copy) vs a fresh one (current Business+Youth copy).
 *
 * Usage: PROD_BASE_URL=https://www.fundingpro.uz node scripts/production-content-check.mjs
 */
const BASE = (process.env.PROD_BASE_URL ?? "https://www.fundingpro.uz").replace(/\/$/, "");
const MAX_WAIT_MS = Number(process.env.PROD_CHECK_MAX_WAIT_MS ?? 8 * 60_000);
const POLL_INTERVAL_MS = 15_000;

const STALE_MARKER = "Для НКО Узбекистана";
const FRESH_MARKER = "Для бизнеса и молодёжи Узбекистана";

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

async function main() {
  console.log(`Verifying production deploy at ${BASE}\n`);

  const healthy = await waitForHealthy();
  if (!healthy) {
    console.error(`FAIL: ${BASE} did not become reachable within ${MAX_WAIT_MS / 1000}s.`);
    process.exit(1);
  }

  const res = await fetch(BASE);
  const html = await res.text();

  const hasStale = html.includes(STALE_MARKER);
  const hasFresh = html.includes(FRESH_MARKER);

  if (hasStale || !hasFresh) {
    console.error(
      "FAIL: production landing page does not reflect the latest merge to main.\n" +
        `  Stale marker ("${STALE_MARKER}") present: ${hasStale}\n` +
        `  Fresh marker ("${FRESH_MARKER}") present: ${hasFresh}\n` +
        "This means main was updated but the deployed site was not — check the " +
        "Vercel project's GitHub integration and production branch setting."
    );
    process.exit(1);
  }

  console.log("OK — production reflects the latest repositioning copy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
