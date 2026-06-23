export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-helpers";
import { COMPANY } from "@/lib/company-info";

// GET /api/v1/admin/settings — returns safe, non-secret config info
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return e as Response;
  }

  const aiProvider = process.env.AI_PROVIDER ?? "mock";
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true";
  const hasWebhookSecret = !!(process.env.PAYMENT_WEBHOOK_SECRET);
  const hasResendKey = !!(process.env.RESEND_API_KEY);
  const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    hasServiceKey,
    adminEmailsConfigured: adminEmails.trim().length > 0,
    nodeEnv: process.env.NODE_ENV ?? "development",
  });
}
