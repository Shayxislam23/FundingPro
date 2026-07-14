#!/usr/bin/env node
/**
 * Single consolidated go-live status report: is the site healthy, is the
 * catalog actually seeded (not `total: 0`), and does the live copy match
 * the current business + youth positioning? Read-only, no secrets — safe
 * to run from a scheduled monitor as well as by hand.
 *
 * Usage: PROD_BASE_URL=https://www.fundingpro.uz node scripts/go-live-check.mjs
 */
const BASE = (process.env.PROD_BASE_URL ?? "https://www.fundingpro.uz").replace(/\/$/, "");
const FRESH_MARKER = "Для бизнеса и молодёжи Узбекистана";
const STALE_MARKERS = ["Для физических лиц в Узбекистане", "Для НКО Узбекистана"];

async function checkHealth() {
  try {
    const res = await fetch(`${BASE}/api/v1/health`);
    const body = await res.json().catch(() => null);
    return { ok: res.ok && body?.status === "ok", detail: body?.status ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: err.message };
  }
}

async function checkCatalogSeeded(path) {
  try {
    const res = await fetch(`${BASE}${path}`);
    const body = await res.json().catch(() => null);
    const total = body?.data?.total ?? body?.total ?? 0;
    return { ok: total > 0, detail: `total=${total}` };
  } catch (err) {
    return { ok: false, detail: err.message };
  }
}

async function checkPositioning() {
  try {
    const res = await fetch(BASE);
    const html = await res.text();
    const staleFound = STALE_MARKERS.filter((m) => html.includes(m));
    const hasFresh = html.includes(FRESH_MARKER);
    return {
      ok: hasFresh && staleFound.length === 0,
      detail: hasFresh ? "current copy live" : `stale: ${staleFound.join(", ") || "fresh marker missing"}`,
    };
  } catch (err) {
    return { ok: false, detail: err.message };
  }
}

async function checkAppLinks() {
  try {
    const res = await fetch(`${BASE}/.well-known/apple-app-site-association`);
    const incomplete = res.headers.get("X-App-Links-Config") === "incomplete";
    return { ok: res.status === 200 && !incomplete, detail: incomplete ? "APPLE_TEAM_ID/ANDROID_RELEASE_SHA256 not set" : `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: err.message };
  }
}

function line(label, result) {
  const mark = result.ok ? "✅" : "⬜";
  console.log(`${mark} ${label} — ${result.detail}`);
  return result.ok;
}

async function main() {
  console.log(`Go-live status for ${BASE}\n`);
  console.log("P1 — blocks every real visitor:");
  const health = line("Site reachable", await checkHealth());
  const plans = line("Plans catalog seeded", await checkCatalogSeeded("/api/v1/plans"));
  const grants = line("Grants catalog seeded", await checkCatalogSeeded("/api/v1/grants?limit=1"));
  const positioning = line("Positioning is current (business + youth)", await checkPositioning());

  console.log("\nP3 — mobile App Links (not blocking web visitors):");
  const appLinks = line("App Links env complete", await checkAppLinks());

  const p1Ready = health && plans && grants && positioning;
  console.log(`\n${p1Ready ? "✅ P1 CLEAR" : "⬜ P1 NOT READY"} — ${p1Ready ? "production is live for real visitors" : "at least one P1 item still blocks real visitors"}`);
  console.log(appLinks ? "✅ App Links ready" : "⬜ App Links still incomplete");

  process.exit(p1Ready ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
