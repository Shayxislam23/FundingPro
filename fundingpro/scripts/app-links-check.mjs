#!/usr/bin/env node
/**
 * Validate Universal Links / App Links env and optional live .well-known routes.
 *
 * Usage:
 *   npm run app-links:check
 *   SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check
 */
import { loadEnvFiles } from "./lib/convex-run.mjs";

const env = loadEnvFiles();
const BASE = process.env.SMOKE_BASE_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PLACEHOLDER_TEAM = "TEAM_ID";
const PLACEHOLDER_SHA = "REPLACE_WITH_SHA256_CERT_FINGERPRINT";

function check(name, ok, detail = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`  ${mark} ${name}${detail ? `: ${detail}` : ""}`);
  return ok;
}

function isValidAppleTeamId(teamId) {
  return /^[A-Z0-9]{10}$/i.test(teamId);
}

function normalizeSha256(raw) {
  return raw
    .split(",")
    .map((f) => f.trim().replace(/:/g, "").toUpperCase())
    .filter(Boolean);
}

function isValidSha256Fingerprint(fp) {
  return /^[0-9A-F]{64}$/.test(fp);
}

let allOk = true;

console.log("App Links check\n");

const teamId = env.APPLE_TEAM_ID?.trim() ?? "";
const shaRaw = env.ANDROID_RELEASE_SHA256?.trim() ?? "";
const iosBundle = env.IOS_BUNDLE_ID?.trim() || "uz.fundingpro.app";
const androidPackage = env.ANDROID_PACKAGE?.trim() || "uz.fundingpro.app";

allOk = check("APPLE_TEAM_ID set", !!teamId, teamId || "missing") && allOk;
if (teamId) {
  allOk = check("APPLE_TEAM_ID format (10 chars)", isValidAppleTeamId(teamId), teamId) && allOk;
  allOk =
    check("APPLE_TEAM_ID not placeholder", teamId !== PLACEHOLDER_TEAM, teamId === PLACEHOLDER_TEAM ? "placeholder" : "ok") &&
    allOk;
}

allOk = check("ANDROID_RELEASE_SHA256 set", !!shaRaw, shaRaw ? "present" : "missing") && allOk;
const fingerprints = normalizeSha256(shaRaw);
if (fingerprints.length > 0) {
  for (const fp of fingerprints) {
    allOk = check(`SHA256 fingerprint valid`, isValidSha256Fingerprint(fp), fp.slice(0, 16) + "…") && allOk;
  }
  allOk =
    check(
      "ANDROID_RELEASE_SHA256 not placeholder",
      !fingerprints.includes(PLACEHOLDER_SHA),
      fingerprints.includes(PLACEHOLDER_SHA) ? "placeholder" : `${fingerprints.length} fingerprint(s)`
    ) && allOk;
}

console.log("\n  Resolved identifiers:");
console.log(`    iOS appID: ${teamId || PLACEHOLDER_TEAM}.${iosBundle}`);
console.log(`    Android package: ${androidPackage}`);

const liveCheck = process.argv.includes("--live") || process.env.APP_LINKS_LIVE === "1";
if (liveCheck || BASE.startsWith("https://")) {
  console.log(`\n  Live .well-known (${BASE.replace(/\/$/, "")})`);
  for (const path of ["/.well-known/apple-app-site-association", "/.well-known/assetlinks.json"]) {
    try {
      const res = await fetch(`${BASE.replace(/\/$/, "")}${path}`);
      const incomplete = res.headers.get("X-App-Links-Config") === "incomplete";
      const missing = res.headers.get("X-App-Links-Missing") ?? "";
      allOk = check(`GET ${path}`, res.ok && !incomplete, incomplete ? `incomplete (${missing})` : "ready") && allOk;
      if (path.endsWith("apple-app-site-association") && res.ok) {
        const json = await res.json();
        const appId = json?.applinks?.details?.[0]?.appIDs?.[0] ?? "";
        if (teamId && appId && !appId.startsWith(`${teamId}.`)) {
          allOk = check("AASA appID matches APPLE_TEAM_ID", false, appId) && allOk;
        }
      }
    } catch (err) {
      allOk =
        check(`GET ${path}`, false, err instanceof Error ? err.message : "fetch failed") && allOk;
    }
  }
} else {
  console.log("\n  Tip: set SMOKE_BASE_URL=https://www.fundingpro.uz for live .well-known verification");
}

console.log(allOk ? "\nAll checks passed" : "\nSome checks failed");

console.log("\n--- O3 App Links next steps ---");
if (!liveCheck) {
  console.log("  Local only — set env then redeploy Vercel:");
  console.log("  1. Vercel → APPLE_TEAM_ID + ANDROID_RELEASE_SHA256 (Production)");
  console.log("  2. Redeploy production");
  console.log("  3. SMOKE_BASE_URL=https://www.fundingpro.uz npm run app-links:check -- --live");
} else {
  console.log("  Live check ran — if failed, fix Vercel env and redeploy.");
}
console.log("  4. Device smoke: mobile/docs/EAS-SMOKE.md");
console.log("  5. Mark M-02 Resolved in docs/SECURITY-ROADMAP.md");
console.log("  Env: APPLE_TEAM_ID, ANDROID_RELEASE_SHA256, IOS_BUNDLE_ID, ANDROID_PACKAGE");
console.log("-----------------------------------\n");

process.exit(allOk ? 0 : 1);
