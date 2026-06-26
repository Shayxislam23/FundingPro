export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { recordConsents } from "@/lib/db/consents";
import { getConsentVersion } from "@/lib/legal/documents";
import type { ConsentType, LegalLocale } from "@/lib/legal/types";

const VALID_TYPES: ConsentType[] = ["terms", "privacy", "ai_processing", "payment_terms"];

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const locale = (body.locale === "uz" ? "uz" : "ru") as LegalLocale;
  const types: ConsentType[] = Array.isArray(body.consents)
    ? body.consents.filter((t: string) => VALID_TYPES.includes(t as ConsentType))
    : [];

  if (types.length === 0) {
    if (body.acceptTerms) types.push("terms");
    if (body.acceptPrivacy) types.push("privacy");
    if (body.acceptAi) types.push("ai_processing");
    if (body.acceptPaymentTerms) types.push("payment_terms");
  }

  if (types.length === 0) {
    return apiError("No consents provided", 400, "MISSING_FIELDS");
  }

  const toRecord = types.map((consentType) => ({
    consentType,
    documentVersion: getConsentVersion(consentType),
    locale,
  }));

  await recordConsents(toRecord, authUser.accessToken);

  for (const c of toRecord) {
    await writeAuditLog({
      userId: authUser.userId,
      action: "legal_consent_accepted",
      entityType: "user_consent",
      metadata: { consentType: c.consentType, version: c.documentVersion, locale },
    });
  }

  return apiSuccess({ recorded: toRecord.length, consents: toRecord });
});
