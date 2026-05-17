// In-memory OTP store. For production use Redis.
type OtpEntry = { code: string; expiresAt: number; attempts: number };
const store = new Map<string, OtpEntry>();

export function saveOtp(email: string, code: string) {
  store.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });
}

export function verifyOtp(email: string, code: string): "ok" | "invalid" | "expired" | "too_many" {
  const entry = store.get(email.toLowerCase());
  if (!entry) return "invalid";
  if (Date.now() > entry.expiresAt) { store.delete(email.toLowerCase()); return "expired"; }
  if (entry.attempts >= 5) return "too_many";
  if (entry.code !== code) { entry.attempts++; return "invalid"; }
  store.delete(email.toLowerCase());
  return "ok";
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
