export const dynamic = "force-dynamic";
import { apiError, apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { submitLabPaymentProof } from "@/lib/db/lab";

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const documentId = String(body.documentId ?? "");
  if (!documentId) return apiError("documentId required", 400, "MISSING_FIELDS");

  const access = await submitLabPaymentProof(documentId, authUser.accessToken);
  return apiSuccess(access);
});
