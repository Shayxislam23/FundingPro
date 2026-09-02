import { z } from "zod";

export const partnerChannelSlugSchema = z.string().min(1).max(64);

export const zoomradAuthInitRequestSchema = z.object({
  channel: partnerChannelSlugSchema.default("zoomrad"),
  externalUserId: z.string().min(1).max(128),
  displayName: z.string().max(256).optional(),
  locale: z.enum(["ru", "uz"]).default("ru"),
  returnPath: z.string().max(256).optional(),
});

export const zoomradAuthInitResponseSchema = z.object({
  sessionId: z.string(),
  sessionToken: z.string(),
  expiresAt: z.string(),
  launchUrl: z.string(),
  channel: z.string(),
});

export const zoomradAuthCallbackRequestSchema = z.object({
  channel: partnerChannelSlugSchema.default("zoomrad"),
  sessionToken: z.string().min(16),
  externalUserId: z.string().min(1).max(128).optional(),
});

export const zoomradAuthCallbackResponseSchema = z.object({
  sessionId: z.string(),
  status: z.enum(["pending", "active", "expired"]),
  channel: z.string(),
  externalUserId: z.string().nullable(),
});

export const zoomradPaymentCreateRequestSchema = z.object({
  channel: partnerChannelSlugSchema.default("zoomrad"),
  sessionToken: z.string().min(16).optional(),
  planId: z.string().min(1),
  serviceType: z
    .enum([
      "subscription",
      "success_fee",
      "consultant_order",
      "ai_service",
      "grant_pack",
      "enterprise",
      "proposal_review",
    ])
    .default("subscription"),
  idempotencyKey: z.string().min(8).max(128),
  amountTiyin: z.number().int().positive(),
  amountUsd: z.number().positive().optional(),
});

export const zoomradPaymentCreateResponseSchema = z.object({
  paymentId: z.string(),
  status: z.enum(["pending", "success", "failed"]),
  idempotencyKey: z.string(),
  partnerSharePercent: z.number(),
  fundingProSharePercent: z.number(),
  amountTiyin: z.number(),
  serviceType: z.string(),
});

export const zoomradPaymentWebhookSchema = z.object({
  channel: partnerChannelSlugSchema.default("zoomrad"),
  paymentId: z.string().min(1),
  externalTransactionId: z.string().min(1),
  status: z.enum(["success", "failed", "pending"]),
  amountTiyin: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(128),
});

export type ZoomradAuthInitRequest = z.infer<typeof zoomradAuthInitRequestSchema>;
export type ZoomradPaymentCreateRequest = z.infer<typeof zoomradPaymentCreateRequestSchema>;
export type ZoomradPaymentWebhookPayload = z.infer<typeof zoomradPaymentWebhookSchema>;
