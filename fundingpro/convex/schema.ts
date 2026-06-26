import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const timestamps = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    emailVerified: v.boolean(),
    isActive: v.boolean(),
    isBanned: v.boolean(),
    platformRole: v.union(v.literal("user"), v.literal("admin")),
    ...timestamps,
    deletedAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  userIdentities: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerId: v.string(),
    ...timestamps,
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["provider", "providerId"]),

  organizations: defineTable({
    name: v.string(),
    legalName: v.optional(v.string()),
    type: v.string(),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    sector: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    registrationNo: v.optional(v.string()),
    isVerified: v.boolean(),
    ...timestamps,
    deletedAt: v.optional(v.number()),
  })
    .index("by_verified", ["isVerified"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.string(),
    ...timestamps,
  })
    .index("by_user", ["userId"])
    .index("by_org", ["organizationId"])
    .index("by_org_user", ["organizationId", "userId"]),

  donors: defineTable({
    name: v.string(),
    nameRu: v.optional(v.string()),
    shortName: v.optional(v.string()),
    country: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    isActive: v.boolean(),
    ...timestamps,
  }).index("by_active", ["isActive"]),

  grants: defineTable({
    title: v.string(),
    titleRu: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionRu: v.optional(v.string()),
    donorId: v.id("donors"),
    sectors: v.array(v.string()),
    countryScope: v.array(v.string()),
    applicantTypes: v.array(v.string()),
    amountMin: v.optional(v.number()),
    amountMax: v.optional(v.number()),
    currency: v.string(),
    deadline: v.optional(v.number()),
    openDate: v.optional(v.number()),
    sourceUrl: v.optional(v.string()),
    status: v.string(),
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    lastUpdatedAt: v.number(),
    ...timestamps,
  })
    .index("by_donor", ["donorId"])
    .index("by_active", ["isActive"])
    .index("by_deadline", ["deadline"])
    .index("by_featured", ["isFeatured"]),

  grantRequirements: defineTable({
    grantId: v.id("grants"),
    requirementType: v.string(),
    text: v.string(),
    required: v.boolean(),
    ...timestamps,
  }).index("by_grant", ["grantId"]),

  savedGrants: defineTable({
    userId: v.id("users"),
    grantId: v.id("grants"),
    ...timestamps,
  })
    .index("by_user", ["userId"])
    .index("by_grant", ["grantId"])
    .index("by_user_grant", ["userId", "grantId"]),

  eligibilityChecks: defineTable({
    userId: v.id("users"),
    grantId: v.optional(v.id("grants")),
    answers: v.any(),
    score: v.number(),
    status: v.string(),
    strengths: v.array(v.string()),
    gaps: v.array(v.string()),
    nextSteps: v.array(v.string()),
    aiRequestId: v.optional(v.id("aiRequests")),
    ...timestamps,
  })
    .index("by_user", ["userId"])
    .index("by_grant", ["grantId"]),

  proposalProjects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    grantId: v.optional(v.id("grants")),
    donorFormat: v.optional(v.string()),
    status: v.string(),
    ...timestamps,
  }).index("by_user", ["userId"]),

  proposalSections: defineTable({
    projectId: v.id("proposalProjects"),
    sectionType: v.string(),
    content: v.string(),
    version: v.number(),
    aiRequestId: v.optional(v.id("aiRequests")),
    ...timestamps,
  }).index("by_project", ["projectId"]),

  applications: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    grantId: v.id("grants"),
    status: v.string(),
    notes: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
    ...timestamps,
  })
    .index("by_user", ["userId"])
    .index("by_grant", ["grantId"])
    .index("by_status", ["status"]),

  documents: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    storageKey: v.string(),
    docType: v.string(),
    status: v.string(),
    ...timestamps,
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  plans: defineTable({
    slug: v.string(),
    name: v.string(),
    nameRu: v.optional(v.string()),
    targetType: v.string(),
    priceUsd: v.number(),
    priceUzs: v.optional(v.number()),
    billingPeriod: v.string(),
    features: v.any(),
    isActive: v.boolean(),
    ...timestamps,
  })
    .index("by_slug", ["slug"])
    .index("by_target", ["targetType"])
    .index("by_active", ["isActive"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    status: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    ...timestamps,
  })
    .index("by_user", ["userId"])
    .index("by_plan", ["planId"])
    .index("by_user_status", ["userId", "status"]),

  subscriptionRequests: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    status: v.string(),
    paymentId: v.optional(v.id("payments")),
    ...timestamps,
  }).index("by_user", ["userId"]),

  payments: defineTable({
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("subscriptions")),
    amountUsd: v.number(),
    currency: v.string(),
    status: v.string(),
    provider: v.string(),
    providerRefId: v.optional(v.string()),
    idempotencyKey: v.string(),
    serviceType: v.string(),
    metadata: v.optional(v.any()),
    activatedAt: v.optional(v.number()),
    ...timestamps,
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_provider_ref", ["providerRefId"]),

  paymentEvents: defineTable({
    paymentId: v.id("payments"),
    eventType: v.string(),
    payload: v.any(),
    source: v.string(),
    createdAt: v.number(),
  }).index("by_payment", ["paymentId"]),

  uzumTransactions: defineTable({
    transId: v.string(),
    paymentId: v.id("payments"),
    serviceId: v.string(),
    state: v.string(),
    amountTiyin: v.number(),
    createTime: v.optional(v.number()),
    confirmTime: v.optional(v.number()),
    reverseTime: v.optional(v.number()),
    ...timestamps,
  }).index("by_transId", ["transId"]),

  aiRequests: defineTable({
    userId: v.id("users"),
    requestType: v.string(),
    model: v.string(),
    promptVersion: v.optional(v.string()),
    inputTokens: v.number(),
    outputTokens: v.number(),
    hasPersonalData: v.boolean(),
    redactionApplied: v.boolean(),
    status: v.string(),
    latencyMs: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["requestType"])
    .index("by_created", ["createdAt"]),

  consultantProfiles: defineTable({
    organizationId: v.id("organizations"),
    bio: v.optional(v.string()),
    specialties: v.array(v.string()),
    country: v.optional(v.string()),
    rating: v.number(),
    reviewCount: v.number(),
    isVerified: v.boolean(),
    verifiedAt: v.optional(v.number()),
    isActive: v.boolean(),
    ...timestamps,
  })
    .index("by_org", ["organizationId"])
    .index("by_active", ["isActive"]),

  consultantOrders: defineTable({
    clientUserId: v.id("users"),
    consultantId: v.id("consultantProfiles"),
    packageName: v.string(),
    amountUsd: v.number(),
    status: v.string(),
    notes: v.optional(v.string()),
    disputeStatus: v.optional(v.string()),
    ...timestamps,
  })
    .index("by_client", ["clientUserId"])
    .index("by_consultant", ["consultantId"]),

  supportTickets: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    message: v.string(),
    status: v.string(),
    priority: v.string(),
    resolvedAt: v.optional(v.number()),
    ...timestamps,
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  userConsents: defineTable({
    userId: v.id("users"),
    consentType: v.string(),
    documentVersion: v.string(),
    locale: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "consentType"]),

  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_created", ["createdAt"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
    category: v.string(),
    ...timestamps,
  }).index("by_key", ["key"]),

  pushTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android")),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),
});
