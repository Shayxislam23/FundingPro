export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { ensureInternalUser } from "@/lib/db/users";
import { createSupportTicket, listUserSupportTickets } from "@/lib/db/support-tickets";

const NOTIFY_EMAIL = process.env.SUPPORT_NOTIFY_EMAIL ?? "shayxislam-ceo@supa-ai.net";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "FundingPro <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidReplyEmail(email: string): boolean {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) && email.length <= 254;
}

async function sendEmailNotification(
  subject: string,
  message: string,
  userEmail: string | null,
  ticketId: string
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const safeTicketId = escapeHtml(ticketId);
  const safeEmail = userEmail ? escapeHtml(userEmail) : "—";
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#008A2E">Новый запрос — FundingPro</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px;color:#6b7280;width:120px">ID тикета</td><td style="padding:8px;font-weight:600">${safeTicketId}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">От</td><td style="padding:8px">${safeEmail}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Тема</td><td style="padding:8px;font-weight:600">${safeSubject}</td></tr>
      </table>
      <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;white-space:pre-wrap;font-size:14px">${safeMessage}</div>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af">FundingPro · fundingpro.uz</p>
    </div>
  `;

  const replyTo =
    userEmail && isValidReplyEmail(userEmail.trim()) ? userEmail.trim() : undefined;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      reply_to: replyTo,
      subject: `[FundingPro] ${subject.slice(0, 200)}`,
      html,
    }),
  });
}

export const GET = withActiveUser(async (req, authUser) => {
  await ensureInternalUser(
    {
      email: authUser.email,
      provider: "clerk",
    },
    authUser.accessToken
  );

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  const { tickets, total } = await listUserSupportTickets(page, limit, authUser.accessToken);
  return apiSuccess({ tickets, total, page, limit });
});

export const POST = withActiveUser(async (req, authUser) => {
  const body = await req.json();
  const { subject, message, priority } = body;

  if (!subject?.trim() || !message?.trim()) {
    return apiError("subject and message required", 400, "MISSING_FIELDS");
  }
  if (subject.length > 200) return apiError("Subject too long (max 200)", 400, "SUBJECT_TOO_LONG");
  if (message.length > 5000) return apiError("Message too long (max 5000)", 400, "MESSAGE_TOO_LONG");

  const allowed = ["low", "normal", "high", "urgent"];
  const ticketPriority = allowed.includes(priority) ? priority : "normal";

  await ensureInternalUser(
    {
      email: authUser.email,
      provider: "clerk",
    },
    authUser.accessToken
  );

  const { ticketId, status } = await createSupportTicket(
    {
      subject: subject.trim(),
      message: message.trim(),
      priority: ticketPriority,
    },
    authUser.accessToken
  );

  sendEmailNotification(subject.trim(), message.trim(), authUser.email, ticketId).catch((e) =>
    console.error("Email notification failed:", e)
  );

  return apiSuccess({ ticketId, status }, 201);
});
