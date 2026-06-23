export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { resend } from "@/lib/resend";
import { checkRateLimitAsync } from "@/lib/ai-rate-limit";

// POST /api/v1/lead-magnet — email capture for grant digest PDF
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    if (!(await checkRateLimitAsync(`lead-magnet:${ip}`))) {
      return apiError("Too many requests. Try again later.", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const source = String(body.source ?? "landing");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError("Valid email required", 400, "INVALID_EMAIL");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fundingpro.uz";

    await resend.emails.send({
      from: "FundingPro <info@fundingpro.uz>",
      to: email,
      subject: "FundingPro — подборка грантов для НКО Узбекистана",
      html: `
        <p>Здравствуйте!</p>
        <p>Спасибо за интерес к FundingPro. Начните с каталога актуальных грантов:</p>
        <p><a href="${appUrl}/grants?utm_source=lead_magnet">${appUrl}/grants</a></p>
        <p>Бесплатно: 2 проверки соответствия и 1 AI-черновик в месяц после регистрации.</p>
        <p>— Команда FundingPro</p>
      `,
    });

    console.info("[lead-magnet]", { email, source });

    return apiSuccess({ ok: true });
  } catch (err) {
    console.error("POST /lead-magnet error:", err);
    return apiError("Failed to subscribe", 500, "INTERNAL_ERROR");
  }
}
