export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { ensureLabEnrollment } from "@/lib/db/lab";
import { getPublicPaymentConfig } from "@/lib/payments";

export const GET = withActiveUser(async (_req, authUser) => {
  const access = await ensureLabEnrollment(authUser.accessToken);
  return apiSuccess({
    ...access,
    paymentConfig: getPublicPaymentConfig(),
    manualPayment: {
      enabled: true,
      amountUzs: access.cohort.priceUzs,
      instructions:
        "Оплатите 150 000 сум через карту/банк и загрузите скриншот оплаты как Proof of payment. Админ подтвердит доступ вручную.",
    },
  });
});

export const POST = GET;
