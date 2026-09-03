import { siteConfig } from "@/lib/seo/site";
import { convexInternalMutation, convexInternalQuery, internal } from "@/lib/convex-server";
import { ensureInternalUser } from "@/lib/db/users";
import { listPlans } from "@/lib/db/plans";
import { getUsdUzsRate } from "@/lib/legal/documents";
import {
  createPartnerSessionToken,
  hashPartnerToken,
  partnerAuthSecretForChannel,
  partnerWebhookSecretForChannel,
  verifyPartnerWebhookSignature,
} from "./partner-crypto";
import { getPartnerChannel, partnerLaunchUrl, normalizePartnerSlug } from "./channels";
import {
  currentYearMonth,
  parseRevenueShareTiersJson,
  resolveRevenueShare,
} from "./revenue-share";
import type {
  PartnerAuthCallbackResult,
  PartnerAuthInitResult,
  ZoomradPaymentCreateResult,
} from "./types";

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
}

export async function initPartnerAuth(input: {
  channel: string;
  externalUserId: string;
  displayName?: string;
  locale?: "ru" | "uz";
  returnPath?: string;
}): Promise<PartnerAuthInitResult> {
  const channelSlug = normalizePartnerSlug(input.channel);
  const channel = getPartnerChannel(channelSlug);
  if (!channel) {
    throw new Error("Partner channel is not available");
  }

  const sessionToken = createPartnerSessionToken();
  const sessionTokenHash = hashPartnerToken(sessionToken);

  const { sessionId, expiresAt } = await convexInternalMutation(internal.partnersInternal.createSession, {
    channelSlug,
    externalUserId: input.externalUserId,
    sessionTokenHash,
    locale: input.locale,
    displayName: input.displayName,
  });

  const path = input.returnPath?.startsWith("/") ? input.returnPath : "/welcome";
  const launchUrl = `${partnerLaunchUrl(channel, siteOrigin(), path)}&session=${encodeURIComponent(sessionToken)}`;

  return {
    sessionId,
    sessionToken,
    expiresAt: new Date(expiresAt).toISOString(),
    launchUrl,
    channel: channelSlug,
  };
}

export async function completePartnerAuthCallback(input: {
  channel: string;
  sessionToken: string;
  externalUserId?: string;
  clerkUserId?: string;
  accessToken?: string;
}): Promise<PartnerAuthCallbackResult> {
  const channelSlug = normalizePartnerSlug(input.channel);
  const sessionTokenHash = hashPartnerToken(input.sessionToken);

  let linkedUserId: string | undefined;
  if (input.accessToken) {
    const user = await ensureInternalUser(
      { email: null, provider: "clerk" },
      input.accessToken
    );
    linkedUserId = user.id;
  }

  const rotatedToken = linkedUserId ? createPartnerSessionToken() : undefined;
  const rotatedTokenHash = rotatedToken ? hashPartnerToken(rotatedToken) : undefined;

  const session = await convexInternalMutation(internal.partnersInternal.activateSession, {
    sessionTokenHash,
    userId: linkedUserId,
    rotatedSessionTokenHash: rotatedTokenHash,
  });

  if (!session) {
    throw new Error("Partner session not found or already bound to another user");
  }

  if (input.externalUserId && input.externalUserId !== session.externalUserId) {
    throw new Error("External user mismatch");
  }

  return {
    sessionId: session.sessionId,
    status: session.status,
    channel: session.channelSlug,
    externalUserId: session.externalUserId,
    sessionToken: rotatedToken,
  };
}

export async function resolvePartnerRevenueShare(channelSlug: string) {
  const { getSettingValue } = await import("@/lib/db/settings");
  const tiersRaw = await getSettingValue("partner_revenue_share_tiers");
  const tiers = parseRevenueShareTiersJson(tiersRaw);
  const count = await convexInternalQuery(internal.partnersInternal.getMonthlyCompletedCount, {
    channelSlug,
    yearMonth: currentYearMonth(),
  });
  return resolveRevenueShare(count, tiers);
}

export async function createZoomradPayment(input: {
  channel: string;
  userId: string;
  accessToken: string;
  planId: string;
  serviceType: string;
  idempotencyKey: string;
  sessionToken?: string;
}): Promise<ZoomradPaymentCreateResult> {
  const channelSlug = normalizePartnerSlug(input.channel);
  const channel = getPartnerChannel(channelSlug);
  if (!channel) {
    throw new Error("Partner channel is not available");
  }

  if (input.sessionToken) {
    const session = await convexInternalQuery(internal.partnersInternal.getSessionByTokenHash, {
      sessionTokenHash: hashPartnerToken(input.sessionToken),
    });
    if (!session || session.status !== "active") {
      throw new Error("Partner session expired");
    }
  }

  await ensureInternalUser({ email: null, provider: "clerk" }, input.accessToken);

  const plans = await listPlans();
  const plan = plans.find((p) => p.id === input.planId);
  if (!plan) {
    throw new Error("Plan not found");
  }

  // Always price from the plan — never trust client-supplied amountTiyin.
  const usdUzs = getUsdUzsRate();
  const amountUzs = Math.round(plan.priceUsd * usdUzs);
  const amountTiyin = amountUzs * 100;
  const share = await resolvePartnerRevenueShare(channelSlug);

  const result = await convexInternalMutation(internal.partnersInternal.createPartnerPayment, {
    userId: input.userId,
    planId: plan.id,
    planName: plan.nameRu,
    amountUsd: plan.priceUsd,
    amountUzs,
    amountTiyin,
    serviceType: input.serviceType,
    idempotencyKey: input.idempotencyKey,
    channelSlug,
    partnerSharePercent: share.partnerPercent,
    fundingProSharePercent: share.fundingProPercent,
  });

  return {
    paymentId: result.paymentId,
    status: result.status === "SUCCESS" ? "success" : "pending",
    idempotencyKey: input.idempotencyKey,
    partnerSharePercent: share.partnerPercent,
    fundingProSharePercent: share.fundingProPercent,
    amountTiyin,
    serviceType: input.serviceType,
  };
}

export function verifyPartnerServerSignature(
  channelSlug: string,
  payload: string,
  signature: string | null
): boolean {
  const secret = partnerAuthSecretForChannel(channelSlug);
  if (!secret) {
    // Dev / staging without secrets — allow unsigned only when explicitly enabled.
    return process.env.PARTNER_AUTH_ALLOW_UNSIGNED === "true";
  }
  if (!signature) return false;
  return verifyPartnerWebhookSignature(payload, signature, secret);
}

export function verifyZoomradWebhook(payload: string, signature: string | null): boolean {
  // Prefer dedicated webhook secret; fall back to auth secret only when webhook unset.
  const secret =
    partnerWebhookSecretForChannel("zoomrad") ?? partnerAuthSecretForChannel("zoomrad");
  if (!secret) {
    return process.env.PARTNER_AUTH_ALLOW_UNSIGNED === "true";
  }
  if (!signature) return false;
  return verifyPartnerWebhookSignature(payload, signature, secret);
}

export async function handleZoomradPaymentWebhook(input: {
  channel: string;
  paymentId: string;
  externalTransactionId: string;
  status: "success" | "failed" | "pending";
  amountTiyin: number;
  idempotencyKey: string;
}) {
  const channelSlug = normalizePartnerSlug(input.channel);
  return convexInternalMutation(internal.partnersInternal.processPartnerWebhook, {
    paymentId: input.paymentId,
    externalTransactionId: input.externalTransactionId,
    status: input.status,
    amountTiyin: input.amountTiyin,
    idempotencyKey: input.idempotencyKey,
    channelSlug,
  });
}

export { parseRevenueShareTiersJson, resolveRevenueShare, DEFAULT_REVENUE_SHARE_TIERS } from "./revenue-share";
