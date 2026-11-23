import { after } from "next/server";
import { convexInternalMutation, convexInternalQuery, internal } from "@/lib/convex-server";
import { resend } from "@/lib/resend";
import { maskEmail, maskName, maskPhone } from "@/convex/lib/partnerApi";
import type { Id } from "@/convex/_generated/dataModel";
import { notifySalesTelegram } from "@/lib/telegram/notify";
import { createWithPartner, type BeginRequestResult, type PartnerEnvironment } from "./with-partner";

export function partnerApiEnvironment(): PartnerEnvironment {
  return process.env.PARTNER_API_ENV === "sandbox" ? "sandbox" : "production";
}

export const withPartner = createWithPartner({
  environment: partnerApiEnvironment,
  beginRequest: async (keyHash, environment) =>
    (await convexInternalMutation(internal.partnerApi.beginRequest, {
      keyHash,
      environment,
    })) as BeginRequestResult,
  logRequest: async (entry) => {
    await convexInternalMutation(internal.partnerApi.logRequest, {
      ...entry,
      partnerId: entry.partnerId as Id<"apiPartners">,
    });
  },
  defer: (task) => {
    try {
      after(task);
    } catch {
      void task();
    }
  },
});

export { convexInternalMutation, convexInternalQuery, internal };

/**
 * Notifies the FundingPro sales inbox about a new partner lead. Personal data is
 * masked — the full record is only visible in the admin panel.
 */
export async function notifyNewPartnerLead(args: {
  partnerCode: string;
  leadId: string;
  grantTitle: string;
  fullName: string;
  phone?: string;
  email?: string;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://fundingpro.uz";
  const contact = [maskPhone(args.phone), maskEmail(args.email)].filter(Boolean).join(", ");
  await notifySalesTelegram(
    `🤝 Лид от партнёра ${escapeHtml(args.partnerCode)}\nГрант: ${escapeHtml(args.grantTitle)}\nКонтакт: ${escapeHtml(contact)}\nОткрыть: ${appUrl}/admin/partners`
  );
  const to = process.env.PARTNER_LEADS_NOTIFY_EMAIL?.trim();
  if (!to || !process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: "FundingPro <info@fundingpro.uz>",
    to,
    subject: `Новый партнёрский лид (${args.partnerCode})`,
    html: `
      <p>Новый лид от партнёра <b>${escapeHtml(args.partnerCode)}</b>.</p>
      <p>Грант: ${escapeHtml(args.grantTitle)}<br/>
      Клиент: ${escapeHtml(maskName(args.fullName) ?? "")} (${escapeHtml(contact)})<br/>
      ID: ${escapeHtml(args.leadId)}</p>
      <p><a href="${appUrl}/admin/partners">Открыть в админке</a> — свяжитесь с клиентом в течение 24 часов.</p>
    `,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
