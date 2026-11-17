export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { withPublic } from "@/lib/api-route";
import { convexInternalMutation, internal } from "@/lib/convex-server";
import { resend } from "@/lib/resend";
import { maskEmail, maskName, maskPhone } from "@/convex/lib/partnerApi";
import { SERVICE_APPLICANT_TYPES, SERVICE_CONSENT_VERSION, serviceRequestSchema } from "@/lib/service-requests";

/** POST /api/v1/service-requests — "Заявка под ключ" from the public /business form. Rate-limited in middleware. */
export const POST = withPublic(async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  const parsed = serviceRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError(first?.message ?? "Проверьте поля формы", 400, "INVALID_REQUEST");
  }
  const body = parsed.data;
  // Honeypot filled → pretend success, store nothing.
  if (body.website) return apiSuccess({ received: true });

  let result: { id: string; duplicate: boolean };
  try {
    result = await convexInternalMutation(internal.serviceRequests.create, {
      fullName: body.full_name,
      phone: body.phone,
      email: body.email,
      organizationName: body.organization_name || undefined,
      applicantType: body.applicant_type,
      region: body.region,
      grantInterest: body.grant_interest || undefined,
      message: body.message || undefined,
      preferredLanguage: body.preferred_language,
      consentTextVersion: SERVICE_CONSENT_VERSION,
      utmSource: body.utm_source || undefined,
      utmMedium: body.utm_medium || undefined,
      utmCampaign: body.utm_campaign || undefined,
    });
  } catch (err) {
    console.error("[service-requests] store failed", String(err).slice(0, 200));
    return apiError(
      "Не удалось отправить заявку. Напишите нам на info@fundingpro.uz — ответим в течение рабочего дня.",
      503,
      "UNAVAILABLE"
    );
  }

  const to = (process.env.SALES_NOTIFY_EMAIL ?? process.env.PARTNER_LEADS_NOTIFY_EMAIL)?.trim();
  if (to && process.env.RESEND_API_KEY && !result.duplicate) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fundingpro.uz";
    await resend.emails
      .send({
        from: "FundingPro <info@fundingpro.uz>",
        to,
        subject: `Заявка под ключ: ${SERVICE_APPLICANT_TYPES[body.applicant_type]}${body.region ? `, ${body.region}` : ""}`,
        html: `<p>Новая заявка «под ключ».</p>
<p>Клиент: ${maskName(body.full_name)} (${[maskPhone(body.phone), maskEmail(body.email)].filter(Boolean).join(", ")})<br/>
Тип: ${SERVICE_APPLICANT_TYPES[body.applicant_type]}</p>
<p><a href="${appUrl}/admin/service-requests">Открыть в админке</a> — позвоните в течение рабочего дня.</p>`,
      })
      .catch((err) => console.error("[service-requests] notify failed", String(err).slice(0, 200)));
  }

  return apiSuccess({ received: true, duplicate: result.duplicate }, 201);
});
