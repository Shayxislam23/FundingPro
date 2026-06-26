import { apiError } from "@/lib/api";
import { api, convexMutation, convexQuery } from "@/lib/convex-server";
import { getLegalManifest } from "@/lib/legal/documents";

export type ConsentType =
  | "terms_of_service"
  | "privacy_policy"
  | "ai_disclosure"
  | "payment_terms";

export type ConsentRecord = {
  consentType: string;
  documentVersion: string;
  locale: string | null;
  createdAt: string;
};

export function getRequiredConsentTypes(): ConsentType[] {
  return ["terms_of_service", "privacy_policy", "ai_disclosure"];
}

export async function recordConsents(
  consents: Array<{ consentType: string; documentVersion: string; locale?: string }>,
  accessToken: string
) {
  return convexMutation(api.consents.record, { consents }, accessToken);
}

export async function listUserConsents(accessToken: string): Promise<ConsentRecord[]> {
  return convexQuery(api.consents.listForUser, {}, accessToken);
}

export async function hasCurrentConsents(accessToken: string) {
  return convexQuery(api.consents.hasCurrent, {}, accessToken);
}

export async function assertPaymentConsents(accessToken: string): Promise<void> {
  const ok = await convexQuery(api.consents.assertPayment, {}, accessToken);
  if (!ok) {
    throw apiError("Legal consent required", 403, "LEGAL_CONSENT_REQUIRED");
  }
}

export function getConsentManifest() {
  return getLegalManifest();
}
