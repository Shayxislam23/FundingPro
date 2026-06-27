import { api, convexQuery } from "@/lib/convex-server";
import { getProviderStatus } from "@/lib/payments/providers/registry";
import {
  getPaymentIntegrationStatus,
  isPaymentsEnabled,
} from "@/lib/payments/config";

const COMMISSION_TIERS = [
  { range: "0–50", platform: 15 },
  { range: "51–200", platform: 12 },
  { range: "201–500", platform: 10 },
  { range: "500+", platform: 8 },
];

export async function getAdminPaymentsReport(
  accessToken: string,
  options?: { provider?: "uzum" | "payme" | "click" | "all" }
) {
  const provider = options?.provider ?? "all";
  const report = await convexQuery(
    api.payments.adminReport,
    { provider },
    accessToken
  );

  return {
    commissionTiers: COMMISSION_TIERS.map((tier, i) => ({
      ...tier,
      current: i === 1,
    })),
    ...report,
    integrationStatus: getPaymentIntegrationStatus(),
    paymentsEnabled: isPaymentsEnabled(),
    providers: getProviderStatus(),
    message: isPaymentsEnabled()
      ? "Мульти-провайдерная интеграция: Uzum, Payme, Click."
      : "Онлайн-оплата отключена. Пользователи отправляют запросы на подключение тарифа.",
  };
}
