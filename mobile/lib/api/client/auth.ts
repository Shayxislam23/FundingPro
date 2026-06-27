import { z } from "zod";
import {
  consentStatusSchema,
  healthResponseSchema,
  meResponseSchema,
  onboardingStatusSchema,
  organizationSchema,
  parseApiResponse,
  supportTicketsListSchema,
  type HealthResponse,
} from "@fundingpro/api-types";
import { apiFetch, genericRecordSchema, parseResponse } from "./core";

const consentResultSchema = z.object({ recorded: z.number(), consents: z.array(z.unknown()).optional() });
const orgResponseSchema = z.object({ organization: organizationSchema.nullable() });
const orgUpdateSchema = z.object({ organization: organizationSchema });
const pushTokenResultSchema = z.object({
  id: z.string(),
  token: z.string(),
  platform: z.enum(["ios", "android"]),
  updatedAt: z.string(),
});
const leadMagnetResultSchema = z.object({ ok: z.boolean() });
const accountDeletionResultSchema = z.object({
  status: z.literal("pending"),
  requestedAt: z.string(),
  userId: z.string(),
  message: z.string().optional(),
}).passthrough();

export const authApi = {
  async health(): Promise<HealthResponse> {
    const res = await apiFetch("/health");
    const json: unknown = await res.json();
    const parsed = healthResponseSchema.safeParse(json);
    if (!parsed.success) throw new Error("Invalid health response");
    return parsed.data;
  },

  async me() {
    return parseResponse(await apiFetch("/me"), meResponseSchema);
  },

  async consentStatus() {
    return parseResponse(await apiFetch("/legal/consent/status"), consentStatusSchema);
  },

  async submitConsent(body: {
    acceptTerms?: boolean;
    acceptPrivacy?: boolean;
    acceptAi?: boolean;
    acceptPaymentTerms?: boolean;
    locale?: string;
  }) {
    return parseResponse(
      await apiFetch("/legal/consent", {
        method: "POST",
        body: JSON.stringify({ ...body, locale: body.locale ?? "ru" }),
      }),
      consentResultSchema
    );
  },

  async onboardingStatus() {
    return parseResponse(await apiFetch("/onboarding/status"), onboardingStatusSchema);
  },

  async organization() {
    return parseResponse(await apiFetch("/organizations"), orgResponseSchema);
  },

  async updateOrganization(body: Record<string, string | undefined>) {
    return parseResponse(
      await apiFetch("/organizations", { method: "PATCH", body: JSON.stringify(body) }),
      orgUpdateSchema
    );
  },

  async supportTickets() {
    const res = await apiFetch("/support-tickets");
    const json: unknown = await res.json();
    return parseApiResponse(json, supportTicketsListSchema);
  },

  async createSupportTicket(subject: string, message: string) {
    return parseResponse(
      await apiFetch("/support-tickets", {
        method: "POST",
        body: JSON.stringify({ subject, message }),
      }),
      genericRecordSchema
    );
  },

  async registerPushToken(token: string, platform: "ios" | "android") {
    return parseResponse(
      await apiFetch("/me/push-token", {
        method: "POST",
        body: JSON.stringify({ token, platform }),
      }),
      pushTokenResultSchema
    );
  },

  async submitLeadMagnet(email: string, source = "mobile_landing") {
    return parseResponse(
      await apiFetch("/lead-magnet", {
        method: "POST",
        body: JSON.stringify({ email, source }),
      }),
      leadMagnetResultSchema
    );
  },

  async requestAccountDeletion() {
    return parseResponse(
      await apiFetch("/me/delete-request", { method: "POST" }),
      accountDeletionResultSchema
    );
  },
};
