import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOtpEmail(to: string, code: string) {
  const from = process.env.SMTP_FROM ?? "FundingPro <noreply@fundingpro.uz>";
  const transporter = createTransport();

  await transporter.sendMail({
    from,
    to,
    subject: `${code} — ваш код для входа в FundingPro`,
    text: `Ваш код подтверждения: ${code}\n\nКод действителен 10 минут.\n\nЕсли вы не запрашивали код — проигнорируйте это письмо.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#020703;color:#fff;border-radius:16px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
          <div style="background:#008A2E;color:#fff;font-weight:900;font-size:12px;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;">FP</div>
          <span style="font-weight:700;font-size:16px;">Funding<span style="color:#12B94F">Pro</span></span>
        </div>
        <p style="color:#A7B8AA;font-size:14px;margin:0 0 16px;">Ваш код подтверждения:</p>
        <div style="letter-spacing:0.25em;font-size:36px;font-weight:900;color:#fff;background:rgba(0,138,46,0.12);border:1px solid rgba(0,138,46,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          ${code}
        </div>
        <p style="color:#A7B8AA;font-size:13px;margin:0 0 8px;">Код действителен <strong style="color:#fff;">10 минут</strong>.</p>
        <p style="color:rgba(167,184,170,0.5);font-size:11px;margin:0;">Если вы не запрашивали код — проигнорируйте это письмо.</p>
      </div>
    `,
  });
}
