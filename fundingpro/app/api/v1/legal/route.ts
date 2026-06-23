export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { getConsentManifest } from "@/lib/db/consents";

// GET /api/v1/legal — public legal document manifest
export async function GET() {
  return apiSuccess(getConsentManifest());
}
