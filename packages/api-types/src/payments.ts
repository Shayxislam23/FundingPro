import { z } from "zod";

export { PAYMENTS_STATUS_FIXTURE, PLANS_FIXTURE } from "./fixtures";

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

export const subscriptionSchema = z.object({
  id: z.string().optional(),
  planId: z.string().optional(),
  status: z.string().optional(),
  plan: planSchema.partial().optional(),
}).passthrough();
