import { z } from "zod";
import {
  aiProposalsListSchema,
  applicationDetailSchema,
  applicationsListSchema,
  applicationUpdateResultSchema,
  checkoutSessionSchema,
  consentStatusSchema,
  consultantsListSchema,
  donorsListSchema,
  documentsListSchema,
  eligibilityResultSchema,
  grantDetailSchema,
  healthResponseSchema,
  listGrantsResultSchema,
  meResponseSchema,
  onboardingStatusSchema,
  organizationSchema,
  parseApiResponse,
  paymentConfigSchema,
  paymentIntentSchema,
  paymentReturnSchema,
  planUsageSchema,
  plansResponseSchema,
  storiesListSchema,
  supportTicketsListSchema,
  type HealthResponse,
  type ListGrantsResult,
} from "@fundingpro/api-types";
import { getApiBaseUrl, getAppVersion } from "../config";
import { getAccessToken } from "../clerk";

const savedGrantSchema = z.object({ saved: z.boolean() });
const applicationCreateSchema = z.object({
  applicationId: z.string(),
  status: z.string(),
  alreadyExists: z.boolean().optional(),
});
const orgResponseSchema = z.object({ organization: organizationSchema.nullable() });
const orgUpdateSchema = z.object({ organization: organizationSchema });
const ordersSchema = z.object({ orders: z.array(z.record(z.unknown())) });
const uploadResultSchema = z.object({ documentId: z.string(), fileName: z.string() });
const downloadSchema = z.object({ url: z.string().optional(), downloadUrl: z.string().optional() });
const consentResultSchema = z.object({ recorded: z.number(), consents: z.array(z.unknown()).optional() });
const genericRecordSchema = z.record(z.unknown());
const matchGrantItemSchema = z.object({
  grantId: z.string(),
  title: z.string().optional(),
  score: z.number().optional(),
  reason: z.string().optional(),
  donorName: z.string().optional(),
  deadline: z.string().nullable().optional(),
});
const pushTokenResultSchema = z.object({
  id: z.string(),
  token: z.string(),
  platform: z.enum(["ios", "android"]),
  updatedAt: z.string(),
});
const matchGrantsResultSchema = z.object({
  matches: z.array(matchGrantItemSchema),
  source: z.string().optional(),
  isMockAi: z.boolean().optional(),
}).passthrough();
const proposalGenerateResultSchema = z.object({
  proposalId: z.string(),
  sections: z.record(z.string()).optional(),
  isDraft: z.boolean().optional(),
  saved: z.boolean().optional(),
  disclaimer: z.string().optional(),
  isMockAi: z.boolean().optional(),
  aiProvider: z.string().optional(),
}).passthrough();

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "X-Client-Version": `mobile-${getAppVersion()}`,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
}

export type GrantsListParams = {
  limit?: number;
  page?: number;
  /** @deprecated Prefer `search` — kept for backward compatibility */
  q?: string;
  search?: string;
  sector?: string;
  country?: string;
  donor?: string;
  activeOnly?: boolean;
  featured?: boolean;
};

async function parseResponse<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  const json: unknown = await res.json();
  if (!res.ok) {
    const err = json as { error?: { message?: string; code?: string } };
    throw new Error(err.error?.message ?? `HTTP ${res.status}`);
  }
  return parseApiResponse(json, schema);
}

export const api = {
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

  async grants(params?: GrantsListParams): Promise<ListGrantsResult> {
    const search = new URLSearchParams();
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.page) search.set("page", String(params.page));
    const searchText = params?.search ?? params?.q;
    if (searchText) search.set("search", searchText);
    if (params?.sector) search.set("sector", params.sector);
    if (params?.country) search.set("country", params.country);
    if (params?.donor) search.set("donor", params.donor);
    if (params?.activeOnly) search.set("activeOnly", "true");
    if (params?.featured) search.set("featured", "true");
    const qs = search.toString();
    const res = await apiFetch(`/grants${qs ? `?${qs}` : ""}`);
    const json: unknown = await res.json();
    return parseApiResponse(json, listGrantsResultSchema);
  },

  async grant(id: string) {
    const res = await apiFetch(`/grants/${id}`);
    const json: unknown = await res.json();
    return parseApiResponse(json, grantDetailSchema);
  },

  async saveGrant(id: string) {
    return parseResponse(await apiFetch(`/grants/${id}/save`, { method: "POST" }), savedGrantSchema);
  },

  async unsaveGrant(id: string) {
    return parseResponse(await apiFetch(`/grants/${id}/save`, { method: "DELETE" }), savedGrantSchema);
  },

  async checkEligibility(grantId: string) {
    return parseResponse(
      await apiFetch("/eligibility/check", { method: "POST", body: JSON.stringify({ grantId }) }),
      eligibilityResultSchema
    );
  },

  async applications(params?: { status?: string; page?: number; limit?: number }) {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.page) search.set("page", String(params.page));
    if (params?.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    const res = await apiFetch(`/applications${qs ? `?${qs}` : ""}`);
    const json: unknown = await res.json();
    return parseApiResponse(json, applicationsListSchema);
  },

  async createApplication(grantId: string, notes?: string) {
    return parseResponse(
      await apiFetch("/applications", { method: "POST", body: JSON.stringify({ grantId, notes }) }),
      applicationCreateSchema
    );
  },

  async getApplication(id: string) {
    return parseResponse(await apiFetch(`/applications/${id}`), applicationDetailSchema);
  },

  async updateApplication(id: string, body: { status?: string; notes?: string | null }) {
    return parseResponse(
      await apiFetch(`/applications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      applicationUpdateResultSchema
    );
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

  async consultants() {
    const res = await apiFetch("/consultants");
    const json: unknown = await res.json();
    return parseApiResponse(json, consultantsListSchema);
  },

  async consultantOrders() {
    return parseResponse(await apiFetch("/consultant-orders"), ordersSchema);
  },

  async createConsultantOrder(consultantId: string, message: string) {
    return parseResponse(
      await apiFetch("/consultant-orders", {
        method: "POST",
        body: JSON.stringify({ consultantId, message }),
      }),
      genericRecordSchema
    );
  },

  async documents() {
    const res = await apiFetch("/documents");
    const json: unknown = await res.json();
    return parseApiResponse(json, documentsListSchema);
  },

  async uploadDocument(file: { uri: string; name: string; mimeType: string }) {
    const form = new FormData();
    form.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
    form.append("docType", "OTHER");
    return parseResponse(await apiFetch("/documents/upload", { method: "POST", body: form }), uploadResultSchema);
  },

  async downloadDocumentUrl(id: string) {
    return parseResponse(await apiFetch(`/documents/${id}/download`), downloadSchema);
  },

  async aiProposals() {
    const res = await apiFetch("/ai/proposals");
    const json: unknown = await res.json();
    return parseApiResponse(json, aiProposalsListSchema);
  },

  async generateProposal(body: {
    grantId?: string;
    projectIdea: string;
    donorFormat?: string;
    sections?: string[];
    confirmSave?: boolean;
  }) {
    return parseResponse(
      await apiFetch("/ai/proposal/generate", {
        method: "POST",
        body: JSON.stringify({
          projectIdea: body.projectIdea,
          donorFormat: body.donorFormat ?? "UNDP",
          sections: body.sections ?? ["summary", "problem", "goal", "activities"],
          grantId: body.grantId,
          confirmSave: body.confirmSave ?? true,
        }),
      }),
      proposalGenerateResultSchema
    );
  },

  async matchGrants(organizationProfile: Record<string, unknown>) {
    return parseResponse(
      await apiFetch("/ai/match-grants", {
        method: "POST",
        body: JSON.stringify({ organizationProfile }),
      }),
      matchGrantsResultSchema
    );
  },

  async plans() {
    const res = await apiFetch("/plans");
    const json: unknown = await res.json();
    return parseApiResponse(json, plansResponseSchema);
  },

  async currentSubscription() {
    return parseResponse(await apiFetch("/subscriptions/current"), genericRecordSchema);
  },

  async planUsage() {
    return parseResponse(await apiFetch("/plan-usage"), planUsageSchema);
  },

  async paymentStatus() {
    return parseResponse(await apiFetch("/payments/status"), paymentConfigSchema);
  },

  async createPaymentIntent(planId: string, acceptedPaymentTerms: boolean) {
    return parseResponse(
      await apiFetch("/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          planId,
          acceptedPaymentTerms,
          platform: "mobile",
        }),
      }),
      paymentIntentSchema
    );
  },

  async startCheckout(paymentId: string) {
    return parseResponse(
      await apiFetch("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ paymentId, platform: "mobile" }),
      }),
      checkoutSessionSchema
    );
  },

  async pollPaymentReturn(paymentId: string) {
    return parseResponse(
      await apiFetch(`/payments/checkout/return?paymentId=${encodeURIComponent(paymentId)}`),
      paymentReturnSchema
    );
  },

  async subscriptionRequest(planId: string, planName: string) {
    return parseResponse(
      await apiFetch("/subscription-requests", {
        method: "POST",
        body: JSON.stringify({ planId, planName }),
      }),
      genericRecordSchema
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

  async donors() {
    const res = await apiFetch("/donors");
    const json: unknown = await res.json();
    return parseApiResponse(json, donorsListSchema);
  },

  async stories() {
    const res = await apiFetch("/stories");
    const json: unknown = await res.json();
    return parseApiResponse(json, storiesListSchema);
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

};
