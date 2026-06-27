export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import { COMPANY } from "@/lib/company-info";
import {
  isClickConfigured,
  isPaymeConfigured,
  isPaymentsEnabled,
  isUzumCheckoutConfigured,
  isUzumMerchantConfigured,
} from "@/lib/payments/config";
import { getProviderStatus } from "@/lib/payments/providers/registry";

export const GET = withAdmin(async () => {
  const aiProvider = process.env.AI_PROVIDER ?? "mock";
  const paymentsEnabled = isPaymentsEnabled();
  const hasWebhookSecret = !!(
    process.env.UZUM_WEBHOOK_SECRET ?? process.env.PAYMENT_WEBHOOK_SECRET
  );
  const hasResendKey = !!(process.env.RESEND_API_KEY);
  const hasConvexUrl = !!(process.env.NEXT_PUBLIC_CONVEX_URL);
  const hasClerkKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
  const adminEmails = process.env.ADMIN_EMAILS ?? "";

  return apiSuccess({
    platform: "FundingPro v1.0",
    company: {
      legalNameRu: COMPANY.legalNameRu,
      legalNameUz: COMPANY.legalNameUz,
      stir: COMPANY.stir,
      dguNumber: COMPANY.dguNumber,
      dguRegisteredAt: COMPANY.dguRegisteredAt,
      entityRegisteredAt: COMPANY.entityRegisteredAt,
      founder: COMPANY.founder,
      email: COMPANY.email,
      addressUz: COMPANY.addressUz,
    },
    aiProvider,
    aiProviderConfigured: aiProvider !== "mock",
    paymentsEnabled,
    hasWebhookSecret,
    hasResendKey,
    hasConvexUrl,
    hasClerkKeys,
    adminEmailsConfigured: adminEmails.trim().length > 0,
    nodeEnv: process.env.NODE_ENV ?? "development",
    paymentProviders: getProviderStatus(),
    uzumMerchantConfigured: isUzumMerchantConfigured(),
    uzumCheckoutConfigured: isUzumCheckoutConfigured(),
    paymeConfigured: isPaymeConfigured(),
    clickConfigured: isClickConfigured(),
  });
});
