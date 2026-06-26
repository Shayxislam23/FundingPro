export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { getConsentManifest } from "@/lib/db/consents";

// GET /api/v1/legal — public legal document manifest
export const GET = withPublic(async () => {
  return apiSuccess(getConsentManifest());
});
