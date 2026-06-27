import { existsSync, readFileSync } from "fs";
import { join } from "path";

/** Must match `mobile/app.json` → expo.ios.bundleIdentifier / expo.android.package */
const DEFAULT_IOS_BUNDLE_ID = "uz.fundingpro.app";
const DEFAULT_ANDROID_PACKAGE = "uz.fundingpro.app";

/** Placeholder when env vars are not configured (dev / pre-submit). */
export const APP_LINKS_PLACEHOLDER_TEAM_ID = "TEAM_ID";
export const APP_LINKS_PLACEHOLDER_SHA256 = "REPLACE_WITH_SHA256_CERT_FINGERPRINT";

function readMobileAppJson(): { bundleId: string; packageName: string } | null {
  const candidates = [
    join(process.cwd(), "..", "mobile", "app.json"),
    join(process.cwd(), "mobile", "app.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      const json = JSON.parse(readFileSync(path, "utf8")) as {
        expo?: { ios?: { bundleIdentifier?: string }; android?: { package?: string } };
      };
      const bundleId = json.expo?.ios?.bundleIdentifier;
      const packageName = json.expo?.android?.package;
      if (bundleId || packageName) {
        return {
          bundleId: bundleId ?? packageName ?? DEFAULT_IOS_BUNDLE_ID,
          packageName: packageName ?? bundleId ?? DEFAULT_ANDROID_PACKAGE,
        };
      }
    } catch {
      // ignore parse errors — fall through to defaults
    }
  }
  return null;
}

/** iOS bundle id — env `IOS_BUNDLE_ID`, else `mobile/app.json`, else default. */
export function getIosBundleId(): string {
  if (process.env.IOS_BUNDLE_ID?.trim()) {
    return process.env.IOS_BUNDLE_ID.trim();
  }
  return readMobileAppJson()?.bundleId ?? DEFAULT_IOS_BUNDLE_ID;
}

/** Android package name — env `ANDROID_PACKAGE`, else `mobile/app.json`, else default. */
export function getAndroidPackage(): string {
  if (process.env.ANDROID_PACKAGE?.trim()) {
    return process.env.ANDROID_PACKAGE.trim();
  }
  return readMobileAppJson()?.packageName ?? DEFAULT_ANDROID_PACKAGE;
}

/** Apple Developer Team ID for AASA `appIDs`. Set `APPLE_TEAM_ID` in Vercel production. */
export function getAppleTeamId(): string | null {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  return teamId || null;
}

export function getIosAppId(): string {
  const teamId = getAppleTeamId() ?? APP_LINKS_PLACEHOLDER_TEAM_ID;
  return `${teamId}.${getIosBundleId()}`;
}

/** Release signing cert SHA-256 for Android App Links. Set `ANDROID_RELEASE_SHA256` in Vercel. */
export function getAndroidReleaseSha256Fingerprints(): string[] {
  const raw = process.env.ANDROID_RELEASE_SHA256?.trim();
  if (!raw) {
    return [APP_LINKS_PLACEHOLDER_SHA256];
  }
  return raw
    .split(",")
    .map((f) => f.trim().replace(/:/g, "").toUpperCase())
    .filter(Boolean);
}

export function appLinksConfigStatus(): {
  iosReady: boolean;
  androidReady: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!getAppleTeamId()) missing.push("APPLE_TEAM_ID");
  if (!process.env.ANDROID_RELEASE_SHA256?.trim()) missing.push("ANDROID_RELEASE_SHA256");
  return {
    iosReady: Boolean(getAppleTeamId()),
    androidReady: Boolean(process.env.ANDROID_RELEASE_SHA256?.trim()),
    missing,
  };
}
