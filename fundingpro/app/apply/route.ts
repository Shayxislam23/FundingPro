export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from "next/server";
import { fromPublicGrantId } from "@/convex/lib/partnerApi";

/**
 * Partner referral landing: /apply?grant_id=grant_…&partner_id=…[&ref=ref_…]
 * Redirects to the grant page and remembers the referring partner (first touch, 30 days).
 * No personal data travels in this URL.
 */
export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const grantRaw = url.searchParams.get("grant_id") ?? "";
  const partner = (url.searchParams.get("partner_id") ?? "").toLowerCase();
  const ref = url.searchParams.get("ref") ?? "";
  const grantId = fromPublicGrantId(grantRaw);

  const target = new URL(grantId ? `/grants/${grantId}` : "/grants", url.origin);
  const validPartner = /^[a-z0-9][a-z0-9_]{2,62}$/.test(partner);
  if (validPartner) {
    target.searchParams.set("utm_source", partner);
    target.searchParams.set("utm_medium", "partner_api");
    if (grantId) target.searchParams.set("utm_campaign", `grant_${grantId}`);
  }

  const res = NextResponse.redirect(target, 302);
  if (validPartner && !req.cookies.get("fp_partner_ref")) {
    const value = /^ref_[a-f0-9]{8,40}$/.test(ref) ? `${partner}:${ref}` : partner;
    res.cookies.set("fp_partner_ref", value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
  }
  return res;
}
