import { v } from "convex/values";

/** Resolved mode exposed to clients (legacy DB values normalized). */
export const resolvedUserModeValidator = v.union(
  v.literal("individual"),
  v.literal("mentor"),
  v.literal("admin")
);

/** Stored on users.userMode — includes legacy values until backfill. */
export const userModeValidator = v.union(
  v.literal("individual"),
  v.literal("organization"),
  v.literal("lab_student"),
  v.literal("mentor"),
  v.literal("admin")
);

const flexibleScalarValidator = v.union(v.string(), v.number(), v.boolean(), v.null());
const flexibleValueValidator = v.union(
  flexibleScalarValidator,
  v.array(flexibleScalarValidator)
);

/** Eligibility questionnaire answers keyed by question id. */
export const eligibilityAnswersValidator = v.record(v.string(), flexibleValueValidator);

/** Plan feature bullet list stored on plans.features. */
export const planFeaturesValidator = v.array(v.string());

/** Optional metadata attached to payment records. */
export const paymentMetadataValidator = v.optional(
  v.object({
    planId: v.optional(v.string()),
    planName: v.optional(v.string()),
    amountUzs: v.optional(v.number()),
    amountTiyin: v.optional(v.number()),
    platformShareUsd: v.optional(v.number()),
    orderId: v.optional(v.string()),
    packageName: v.optional(v.string()),
    checkoutMock: v.optional(v.boolean()),
    checkoutOrderId: v.optional(v.string()),
    labEnrollmentId: v.optional(v.string()),
    labCohortId: v.optional(v.string()),
    labCohortSlug: v.optional(v.string()),
    serviceName: v.optional(v.string()),
  })
);

/** Webhook / provider event payloads stored on paymentEvents.payload. */
export const paymentEventPayloadValidator = v.union(
  v.object({
    transId: v.optional(v.string()),
    paymeTransId: v.optional(v.string()),
    clickTransId: v.optional(v.string()),
    amount: v.optional(v.number()),
    state: v.optional(v.union(v.string(), v.number())),
  }),
  v.record(v.string(), flexibleValueValidator)
);

/** Input for audit.write — coerced to string values in handler. */
export const auditMetadataInputValidator = v.optional(
  v.record(v.string(), flexibleValueValidator)
);

/** Stored audit log metadata (string values only). */
export const auditMetadataValidator = v.optional(v.record(v.string(), v.string()));

/** Grant matching profile from client. */
export const grantMatchProfileValidator = v.object({
  sector: v.optional(v.string()),
  country: v.optional(v.string()),
  applicantType: v.optional(v.string()),
});
