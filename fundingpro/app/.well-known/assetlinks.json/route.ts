import { NextResponse } from "next/server";

/** Replace SHA256 fingerprint with EAS/Play signing cert before enabling autoVerify. */
const ANDROID_PACKAGE = "uz.fundingpro.app";

const assetLinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: ANDROID_PACKAGE,
      sha256_cert_fingerprints: ["REPLACE_WITH_SHA256_CERT_FINGERPRINT"],
    },
  },
];

export function GET() {
  return NextResponse.json(assetLinks, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
