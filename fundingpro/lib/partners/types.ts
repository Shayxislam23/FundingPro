/** Bank / super-app distribution channel (ZOOMRAD first; more partners later). */
export type PartnerChannelSlug = "zoomrad" | (string & {});

export type PartnerAuthMode = "partner_sso" | "clerk" | "public";

export interface PartnerChannelConfig {
  slug: PartnerChannelSlug;
  displayNameRu: string;
  displayNameUz: string;
  webViewPath: string;
  authMode: PartnerAuthMode;
  primaryColor: string;
  badgeLabelRu: string;
  badgeLabelUz: string;
  isActive: boolean;
}

export interface RevenueShareTier {
  minTransactions: number;
  maxTransactions: number | null;
  partnerPercent: number;
  fundingProPercent: number;
}

export interface RevenueShareSplit {
  partnerPercent: number;
  fundingProPercent: number;
  tierLabel: string;
  monthlyCompletedTransactions: number;
}

export type PartnerSessionStatus = "pending" | "active" | "expired";

export interface PartnerAuthInitResult {
  sessionId: string;
  sessionToken: string;
  expiresAt: string;
  launchUrl: string;
  channel: PartnerChannelSlug;
}

export interface PartnerAuthCallbackResult {
  sessionId: string;
  status: PartnerSessionStatus;
  channel: PartnerChannelSlug;
  externalUserId: string | null;
}

export type ZoomradPaymentStatus = "pending" | "success" | "failed";

export interface ZoomradPaymentCreateResult {
  paymentId: string;
  status: ZoomradPaymentStatus;
  idempotencyKey: string;
  partnerSharePercent: number;
  fundingProSharePercent: number;
  amountTiyin: number;
  serviceType: string;
}
