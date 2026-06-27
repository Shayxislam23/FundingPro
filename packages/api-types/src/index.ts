import { z } from "zod";

/** Standard API error envelope from fundingpro/lib/api.ts */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
});

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

export function parseApiResponse<T extends z.ZodTypeAny>(
  json: unknown,
  dataSchema: T
): z.infer<ReturnType<typeof apiSuccessSchema<T>>>["data"] {
  const successSchema = apiSuccessSchema(dataSchema);
  const parsed = successSchema.safeParse(json);
  if (!parsed.success) {
    const errParsed = apiErrorSchema.safeParse(json);
    if (errParsed.success) {
      throw new Error(`${errParsed.data.error.code}: ${errParsed.data.error.message}`);
    }
    throw new Error("Invalid API response");
  }
  return parsed.data.data;
}

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.string(),
  version: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const donorSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_ru: z.string().nullable(),
});

export const publicDonorSchema = donorSchema.extend({
  description: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

export const donorsListSchema = z.object({
  donors: z.array(publicDonorSchema),
  total: z.number(),
});

export type PublicDonor = z.infer<typeof publicDonorSchema>;
export type DonorsListResult = z.infer<typeof donorsListSchema>;

export const storySchema = z.object({
  id: z.string(),
  org: z.string(),
  sector: z.string(),
  city: z.string(),
  summary: z.string(),
  outcome: z.string(),
  status: z.enum(["pilot", "published"]).optional(),
});

export const storiesListSchema = z.object({
  stories: z.array(storySchema),
  total: z.number(),
});

export type Story = z.infer<typeof storySchema>;
export type StoriesListResult = z.infer<typeof storiesListSchema>;

export const grantListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  title_ru: z.string().nullable(),
  description: z.string().nullable().optional(),
  sectors: z.array(z.string()),
  country_scope: z.array(z.string()),
  amount_min: z.number().nullable(),
  amount_max: z.number().nullable(),
  deadline: z.string().nullable(),
  donor: donorSchema,
});

export const listGrantsResultSchema = z.object({
  grants: z.array(grantListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
  continueCursor: z.string().nullable().optional(),
  isDone: z.boolean().optional(),
});

export type GrantListItem = z.infer<typeof grantListItemSchema>;
export type ListGrantsResult = z.infer<typeof listGrantsResultSchema>;

export const grantDetailSchema = grantListItemSchema.extend({
  description: z.string().nullable().optional(),
  eligibility_criteria: z.string().nullable().optional(),
  application_url: z.string().nullable().optional(),
  requirements: z.array(z.unknown()).optional(),
});

export type GrantDetail = z.infer<typeof grantDetailSchema>;

export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameRu: z.string(),
  targetType: z.string(),
  priceUsd: z.number(),
  priceUzs: z.number(),
  features: z.array(z.string()),
  highlighted: z.boolean(),
});

export const plansResponseSchema = z.object({
  plans: z.array(planSchema),
  grouped: z.record(z.array(planSchema)),
  total: z.number(),
  usdUzsRate: z.number(),
});

export type Plan = z.infer<typeof planSchema>;

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  country: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  verified: z.boolean().optional(),
});

export const subscriptionSchema = z.object({
  id: z.string().optional(),
  planId: z.string().optional(),
  status: z.string().optional(),
  plan: planSchema.partial().optional(),
}).passthrough();

export const meResponseSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  platformRole: z.string().nullable(),
  isAdmin: z.boolean(),
  organization: organizationSchema.nullable(),
  subscription: subscriptionSchema.nullable(),
  savedGrantIds: z.array(z.string()),
  paymentPendingIntegration: z.boolean().optional(),
  paymentIntegrationStatus: z.string().optional(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const adminCheckSchema = z.object({
  isAdmin: z.boolean(),
});

export const consentStatusSchema = z.object({
  needsReconsent: z.boolean(),
  missingConsents: z.array(z.string()).optional(),
  currentVersions: z.record(z.string()).optional(),
  records: z.array(z.unknown()).optional(),
});

export const onboardingStepIdSchema = z.enum([
  "profile",
  "documents",
  "saved_grant",
  "eligibility",
  "ai_proposal",
]);

export const onboardingStepsSchema = z.object({
  profile: z.boolean(),
  documents: z.boolean(),
  saved_grant: z.boolean(),
  eligibility: z.boolean(),
  ai_proposal: z.boolean(),
});

export const onboardingStatusSchema = z.object({
  steps: onboardingStepsSchema,
  completedCount: z.number(),
  totalSteps: z.number(),
  isComplete: z.boolean(),
});

export type OnboardingStepId = z.infer<typeof onboardingStepIdSchema>;
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export const applicationSchema = z.object({
  id: z.string(),
  grantId: z.string(),
  status: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  grant: grantListItemSchema.partial().optional(),
}).passthrough();

export const applicationsListSchema = z.object({
  applications: z.array(applicationSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
});

export const applicationGrantSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  title_ru: z.union([z.string(), z.null()]),
  deadline: z.union([z.string(), z.null()]),
  amount_min: z.union([z.number(), z.null()]),
  amount_max: z.union([z.number(), z.null()]),
  donor: z.object({
    name: z.union([z.string(), z.null()]),
    name_ru: z.union([z.string(), z.null()]),
  }),
});

export const applicationDetailSchema = z.object({
  id: z.string(),
  status: z.string(),
  notes: z.union([z.string(), z.null()]),
  created_at: z.string(),
  updated_at: z.string(),
  grant: z.union([applicationGrantSummarySchema, z.null()]),
});

export type ApplicationDetail = z.infer<typeof applicationDetailSchema>;

export const applicationUpdateResultSchema = z.object({
  applicationId: z.string(),
  status: z.string(),
});

export const eligibilityResultSchema = z.object({
  eligible: z.boolean(),
  score: z.number().optional(),
  reasons: z.array(z.string()).optional(),
  missingRequirements: z.array(z.string()).optional(),
}).passthrough();

export const consultantSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  specialties: z.array(z.string()).optional(),
  hourlyRateUsd: z.number().nullable().optional(),
}).passthrough();

export const consultantsListSchema = z.object({
  consultants: z.array(consultantSchema),
  total: z.number().optional(),
});

export const consultantOrderSchema = z.object({
  id: z.string(),
  consultantId: z.string(),
  status: z.string(),
  message: z.string().nullable().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const documentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().optional(),
  docType: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const documentsListSchema = z.object({
  documents: z.array(documentSchema),
  total: z.number().optional(),
});

export const aiProposalSchema = z.object({
  id: z.string(),
  grantId: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const aiProposalsListSchema = z.object({
  proposals: z.array(aiProposalSchema),
  total: z.number().optional(),
});

export const paymentConfigSchema = z.object({
  paymentsEnabled: z.boolean(),
  integrationStatus: z.string(),
  provider: z.string().optional(),
  merchantConfigured: z.boolean().optional(),
  checkoutConfigured: z.boolean().optional(),
  message: z.string().optional(),
});

export const paymentIntentSchema = z.object({
  paymentId: z.string(),
  subscriptionId: z.string().optional(),
  planId: z.string(),
  planName: z.string().optional(),
  amountUsd: z.number().optional(),
  amountUzs: z.number().optional(),
  amountTiyin: z.number().optional(),
  currency: z.string().optional(),
  provider: z.string().optional(),
  uzumAppUrl: z.string().nullable().optional(),
});

export const checkoutSessionSchema = z.object({
  paymentId: z.string(),
  redirectUrl: z.string(),
  checkoutOrderId: z.string().optional(),
});

export const paymentReturnSchema = z.object({
  paymentId: z.string(),
  status: z.string(),
  activated: z.boolean(),
});

export const planUsageSchema = z.object({
  planName: z.string().optional(),
  limits: z.object({
    eligibilityChecks: z.number().nullable().optional(),
    aiProposals: z.number().nullable().optional(),
  }).optional(),
  used: z.object({
    eligibilityChecks: z.number().optional(),
    aiProposals: z.number().optional(),
  }).optional(),
}).passthrough();

export const supportTicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  status: z.string(),
  priority: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export const supportTicketsListSchema = z.object({
  tickets: z.array(supportTicketSchema),
  total: z.number().optional(),
});

export const adminDashboardSchema = z.object({
  stats: z.record(z.number()).optional(),
}).passthrough();

export const paginatedUsersSchema = z.object({
  users: z.array(z.record(z.unknown())),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
}).passthrough();
