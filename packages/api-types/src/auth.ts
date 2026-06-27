import { z } from "zod";
import { subscriptionSchema } from "./payments";

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  country: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  verified: z.boolean().optional(),
});

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
