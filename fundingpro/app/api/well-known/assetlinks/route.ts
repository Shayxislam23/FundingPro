import { NextResponse } from "next/server";
import {
  appLinksConfigStatus,
  getAndroidPackage,
  getAndroidReleaseSha256Fingerprints,
} from "@/lib/mobile-app-links";

/** Canonical handler — also rewritten from `/.well-known/assetlinks.json`. */
export function GET() {
  const status = appLinksConfigStatus();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (!status.androidReady) {
    headers["X-App-Links-Config"] = "incomplete";
    headers["X-App-Links-Missing"] = status.missing.join(",");
  }

  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: getAndroidPackage(),
        sha256_cert_fingerprints: getAndroidReleaseSha256Fingerprints(),
      },
    },
  ];

  return NextResponse.json(assetLinks, { headers });
}
