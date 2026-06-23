export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { hasCurrentConsents, listUserConsents } from "@/lib/db/consents";
import { getConsentVersion } from "@/lib/legal/documents";

export const GET = withActiveUser(async (_req, authUser) => {
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
});
