"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ZoomradShell } from "@/components/partners/ZoomradShell";

export default function ZoomradWelcomePage() {
  const searchParams = useSearchParams();
  const locale = searchParams.get("lang") === "uz" ? "uz" : "ru";
  const q = searchParams.toString();
  const suffix = q ? `?${q}` : "";

  const copy =
    locale === "uz"
      ? {
          title: "FundingPro — grantlar va arizalar",
          subtitle: "ZOOMRAD Mini ilovasi orqali grant toping, moslikni tekshiring va ariza tayyorlang.",
          ctaGrants: "Grantlarni ko‘rish",
          ctaPricing: "Tariflar",
          note: "Bu xizmat kredit yoki qarz emas — faqat grantlar va moliyalashtirish imkoniyatlari.",
        }
      : {
          title: "FundingPro — гранты и заявки",
          subtitle:
            "Через Mini App ZOOMRAD найдите грант, проверьте соответствие и подготовьте заявку с AI.",
          ctaGrants: "Смотреть гранты",
          ctaPricing: "Тарифы",
          note: "Это не кредит и не займ — только гранты и возможности финансирования.",
        };

  return (
    <ZoomradShell title={copy.title} subtitle={copy.subtitle}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <ul className="space-y-2 text-sm text-neutral-700">
            <li>• {locale === "uz" ? "Grant katalogi va filtrlash" : "Каталог грантов и фильтры"}</li>
            <li>• {locale === "uz" ? "Moslik tekshiruvi" : "Проверка соответствия"}</li>
            <li>• {locale === "uz" ? "AI ariza loyihasi" : "AI-черновик заявки"}</li>
            <li>• {locale === "uz" ? "Ariza holati trekeri" : "Трекер статуса заявки"}</li>
          </ul>
        </div>

        <div className="grid gap-3">
          <Link
            href={`/zoomrad/grants${suffix}`}
            className="rounded-xl bg-funding-green px-4 py-3 text-center text-sm font-semibold text-white"
          >
            {copy.ctaGrants}
          </Link>
          <Link
            href={`/zoomrad/pricing${suffix}`}
            className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-semibold text-emerald-800"
          >
            {copy.ctaPricing}
          </Link>
        </div>

        <p className="text-xs leading-relaxed text-neutral-500">{copy.note}</p>
      </div>
    </ZoomradShell>
  );
}
