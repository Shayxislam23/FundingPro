export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse } from "@/lib/auth-helpers";
import { hasCurrentConsents, listUserConsents } from "@/lib/db/consents";
import { getConsentVersion } from "@/lib/legal/documents";

// GET /api/v1/legal/consent/status
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const [status, records] = await Promise.all([
      hasCurrentConsents(authUser.userId),
      listUserConsents(authUser.userId),
    ]);

    return apiSuccess({
      ...status,
      currentVersions: {
        terms: getConsentVersion("terms"),
        privacy: getConsentVersion("privacy"),
        ai_processing: getConsentVersion("ai_processing"),
        payment_terms: getConsentVersion("payment_terms"),
      },
      records: records.slice(0, 20),
    });
  } catch (err) {
    console.error("GET /legal/consent/status error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
