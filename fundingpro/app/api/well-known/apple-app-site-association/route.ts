import { NextResponse } from "next/server";
import {
  appLinksConfigStatus,
  getIosAppId,
} from "@/lib/mobile-app-links";

const association = (appId: string) => ({
  applinks: {
    apps: [],
    details: [
      {
        appIDs: [appId],
        components: [
          { "/": "/mobile/auth/callback" },
          { "/": "/mobile/subscription/return*" },
          { "/": "/mobile/*" },
        ],
      },
    ],
  },
});

/** Canonical handler — also rewritten from `/.well-known/apple-app-site-association`. */
export function GET() {
  const status = appLinksConfigStatus();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Set Cache-Control here (not only in next.config.mjs headers()) so caching applies
    // reliably through Vercel edge even when the request goes via the rewrite path.
    "Cache-Control": "public, max-age=3600",
  };
  if (!status.iosReady) {
    headers["X-App-Links-Config"] = "incomplete";
    headers["X-App-Links-Missing"] = status.missing.join(",");
  }

  return NextResponse.json(association(getIosAppId()), { headers });
}
