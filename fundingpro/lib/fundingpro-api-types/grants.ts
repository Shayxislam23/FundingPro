import { z } from "zod";

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

/** Query params for grants catalog (web lib/db + mobile API). */
export const listGrantsParamsSchema = z.object({
  search: z.string().optional(),
  sector: z.string().optional(),
  country: z.string().optional(),
  donorId: z.string().optional(),
  deadlineBefore: z.string().optional(),
  deadlineAfter: z.string().optional(),
  activeOnly: z.boolean().optional(),
  featured: z.boolean().optional(),
  today: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  cursor: z.string().nullable().optional(),
});

export type ListGrantsParams = z.infer<typeof listGrantsParamsSchema>;
/** @deprecated Use ListGrantsParams — kept for legacy imports. */
export type GrantListParams = ListGrantsParams;

export const grantRequirementSchema = z.object({
  id: z.string(),
  requirement_type: z.string(),
  text: z.string(),
  required: z.boolean(),
});

export type GrantRequirement = z.infer<typeof grantRequirementSchema>;

export const grantDetailDonorSchema = donorSchema.extend({
  website: z.string().nullable().optional(),
});

export const grantDetailSchema = grantListItemSchema.extend({
  description_ru: z.string().nullable().optional(),
  grant_requirements: z.array(grantRequirementSchema).optional(),
  donor: grantDetailDonorSchema,
});

export type GrantDetail = z.infer<typeof grantDetailSchema>;

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
