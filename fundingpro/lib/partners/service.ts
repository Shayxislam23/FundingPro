import { siteConfig } from "@/lib/seo/site";
import { convexInternalMutation, convexInternalQuery, internal } from "@/lib/convex-server";
import { ensureInternalUser } from "@/lib/db/users";
import { listPlans } from "@/lib/db/plans";
import { getUsdUzsRate } from "@/lib/legal/documents";
import {
  createPartnerLaunchCode,
  createPartnerSessionToken,
  hashPartnerToken,
  isPartnerTimestampFresh,
  parsePartnerTimestamp,
  partnerAuthSecretForChannel,
  partnerSignedPayload,
  partnerUnsignedAllowed,
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
  const launchCode = createPartnerLaunchCode();
  const launchCodeHash = hashPartnerToken(launchCode);

  const created = await convexInternalMutation(internal.partnersInternal.createSession, {
    channelSlug,
    externalUserId: input.externalUserId,
    sessionTokenHash,
    launchCodeHash,
    locale: input.locale,
    displayName: input.displayName,
  });

  const path = input.returnPath?.startsWith("/") ? input.returnPath : "/welcome";
  // One-time launch code in URL — never put the long-lived session bearer in query strings.
  const launchUrl = `${partnerLaunchUrl(channel, siteOrigin(), path)}&code=${encodeURIComponent(launchCode)}`;

  return {
    sessionId: created.sessionId,
    sessionToken: created.reused ? undefined : sessionToken,
    expiresAt: new Date(created.expiresAt).toISOString(),
    launchCodeExpiresAt: new Date(created.launchCodeExpiresAt).toISOString(),
    launchUrl,
    channel: channelSlug,
  };
}

/** WebView exchanges ?code= for a session token stored in sessionStorage (not URL). */
export async function exchangePartnerLaunchCode(input: {
  channel: string;
  launchCode: string;
}): Promise<{ sessionToken: string; sessionId: string; expiresAt: string; channel: string }> {
  const channelSlug = normalizePartnerSlug(input.channel);
  const launchCode = input.launchCode.trim();
  if (!launchCode) {
    throw new Error("Launch code required");
  }

  const sessionToken = createPartnerSessionToken();
  const exchanged = await convexInternalMutation(internal.partnersInternal.exchangeLaunchCode, {
    launchCodeHash: hashPartnerToken(launchCode),
    newSessionTokenHash: hashPartnerToken(sessionToken),
  });

  if (!exchanged) {
    throw new Error("Launch code invalid or expired");
  }

  return {
    sessionToken,
    sessionId: exchanged.sessionId,
    expiresAt: new Date(exchanged.expiresAt).toISOString(),
    channel: exchanged.channelSlug || channelSlug,
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

  // Only mint + return a rotated token when we will actually persist it (first bind).
  const existing = await convexInternalQuery(internal.partnersInternal.getSessionByTokenHash, {
    sessionTokenHash,
  });
  const shouldRotate = Boolean(linkedUserId && existing && !existing.userId);
  const rotatedToken = shouldRotate ? createPartnerSessionToken() : undefined;
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

export async function verifyPartnerSignedRequest(input: {
  channelSlug: string;
  purpose: "auth" | "webhook";
  rawBody: string;
  signature: string | null;
  timestampHeader: string | null;
  nonceHeader: string | null;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret =
    input.purpose === "webhook"
      ? partnerWebhookSecretForChannel(input.channelSlug)
      : partnerAuthSecretForChannel(input.channelSlug);

  if (!secret) {
    if (partnerUnsignedAllowed()) return { ok: true };
    return {
      ok: false,
      reason:
        input.purpose === "webhook"
          ? "ZOOMRAD_WEBHOOK_SECRET not configured"
          : "ZOOMRAD_AUTH_SECRET not configured",
    };
  }

  if (!input.signature) return { ok: false, reason: "Missing signature" };

  const timestampSec = parsePartnerTimestamp(input.timestampHeader);
  if (timestampSec === null || !isPartnerTimestampFresh(timestampSec)) {
    return { ok: false, reason: "Missing or stale timestamp" };
  }

  const nonce = input.nonceHeader?.trim() ?? "";
  if (!nonce || nonce.length < 8 || nonce.length > 128) {
    return { ok: false, reason: "Missing or invalid nonce" };
  }

  const signed = partnerSignedPayload(String(timestampSec), nonce, input.rawBody);
  if (!verifyPartnerWebhookSignature(signed, input.signature, secret)) {
    return { ok: false, reason: "Invalid signature" };
  }

  const consumed = await convexInternalMutation(internal.partnersInternal.consumeRequestNonce, {
    channelSlug: input.channelSlug,
    nonceHash: hashPartnerToken(`${input.purpose}:${nonce}`),
  });
  if (!consumed) {
    return { ok: false, reason: "Nonce already used" };
  }

  return { ok: true };
}

/** @deprecated Prefer verifyPartnerSignedRequest — kept for call-site migration. */
export function verifyPartnerServerSignature(
  channelSlug: string,
  payload: string,
  signature: string | null
): boolean {
  const secret = partnerAuthSecretForChannel(channelSlug);
  if (!secret) return partnerUnsignedAllowed();
  if (!signature) return false;
  return verifyPartnerWebhookSignature(payload, signature, secret);
}

/** @deprecated Prefer verifyPartnerSignedRequest */
export function verifyZoomradWebhook(payload: string, signature: string | null): boolean {
  const secret = partnerWebhookSecretForChannel("zoomrad");
  if (!secret) return partnerUnsignedAllowed();
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
