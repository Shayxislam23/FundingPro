import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, code: string) {
  return resend.emails.send({
    from: "FundingPro <info@fundingpro.uz>",
    to,
    subject: `${code} — ваш код для входа в FundingPro`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#020703;color:#fff;border-radius:16px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
          <div style="background:#008A2E;color:#fff;font-weight:900;font-size:12px;width:32px;height:32px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">FP</div>
          <span style="font-weight:700;font-size:16px;color:#fff;">Funding<span style="color:#12B94F">Pro</span></span>
        </div>
        <p style="color:#A7B8AA;font-size:14px;margin:0 0 16px;">Ваш код подтверждения:</p>
        <div style="letter-spacing:0.25em;font-size:40px;font-weight:900;color:#fff;background:rgba(0,138,46,0.12);border:1px solid rgba(0,138,46,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          ${code}
        </div>
        <p style="color:#A7B8AA;font-size:13px;margin:0 0 8px;">Код действителен <strong style="color:#fff;">10 минут</strong>.</p>
        <p style="color:rgba(167,184,170,0.5);font-size:11px;margin:0;">Если вы не запрашивали код — проигнорируйте это письмо.</p>
      </div>
    `,
  });
}
