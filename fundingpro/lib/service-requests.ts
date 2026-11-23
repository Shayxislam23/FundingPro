import { z } from "zod";
import { normalizeEmail, normalizePhone } from "@/convex/lib/partnerApi";

export const SERVICE_CONSENT_VERSION = "v1.0";

export const UZ_REGIONS = [
  "Ташкент",
  "Ташкентская область",
  "Андижанская область",
  "Бухарская область",
  "Джизакская область",
  "Кашкадарьинская область",
  "Навоийская область",
  "Наманганская область",
  "Самаркандская область",
  "Сурхандарьинская область",
  "Сырдарьинская область",
  "Ферганская область",
  "Хорезмская область",
  "Республика Каракалпакстан",
] as const;

export const SERVICE_APPLICANT_TYPES = {
  business: "Бизнес (ООО, ИП)",
  startup: "Стартап",
  ngo: "НКО",
  individual: "Частное лицо / молодёжь",
} as const;

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""));

export const serviceRequestSchema = z
  .object({
    full_name: text(120).refine((s) => s.length >= 2, "Укажите имя"),
    phone: z.string().trim().max(32).optional().or(z.literal("")),
    email: z.string().trim().max(254).optional().or(z.literal("")),
    organization_name: text(200).optional(),
    applicant_type: z.enum(["business", "startup", "ngo", "individual"]),
    region: z.enum(UZ_REGIONS).optional().or(z.literal("")),
    grant_interest: text(300).optional(),
    message: text(2000).optional(),
    preferred_language: z.enum(["uz", "ru"]).optional(),
    consent: z.literal(true, { errorMap: () => ({ message: "Нужно согласие на обработку данных" }) }),
    utm_source: text(100).optional(),
    utm_medium: text(100).optional(),
    utm_campaign: text(100).optional(),
    /** Honeypot: real users never fill this hidden field. */
    website: z.string().max(200).optional(),
  })
  .strict()
  .transform((b, ctx) => {
    const phone = b.phone ? normalizePhone(b.phone) : null;
    const email = b.email ? normalizeEmail(b.email) : null;
    if (b.phone && !phone) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Неверный телефон" });
    if (b.email && !email) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Неверный email" });
    if (!b.phone && !b.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Укажите телефон или email" });
    }
    return { ...b, phone: phone ?? undefined, email: email ?? undefined, region: b.region || undefined };
  });

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;
