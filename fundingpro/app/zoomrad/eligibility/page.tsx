"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ZoomradShell } from "@/components/partners/ZoomradShell";

export default function ZoomradEligibilityPage() {
  const searchParams = useSearchParams();
  const locale = searchParams.get("lang") === "uz" ? "uz" : "ru";
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

  return (
    <ZoomradShell
      title={locale === "uz" ? "Moslik tekshiruvi" : "Проверка соответствия"}
      subtitle={
        locale === "uz"
          ? "Grant talablariga mosligingizni baholang"
          : "Оцените соответствие требованиям донора"
      }
    >
      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-neutral-700 shadow-sm">
        <p>
          {locale === "uz"
            ? "To‘liq tekshiruv uchun avval grant tanlang va profilingizni to‘ldiring."
            : "Для полной проверки выберите грант и заполните профиль."}
        </p>
        <Link
          href={`/zoomrad/grants${suffix}`}
          className="block rounded-xl border border-emerald-200 px-4 py-3 text-center font-semibold text-emerald-800"
        >
          {locale === "uz" ? "Grantlarga o‘tish" : "Перейти к грантам"}
        </Link>
        <Link
          href={`/auth?redirect=${encodeURIComponent(`/zoomrad/eligibility${suffix}`)}`}
          className="block rounded-xl bg-[#008A2E] px-4 py-3 text-center font-semibold text-white"
        >
          {locale === "uz" ? "Kirish / ro‘yxatdan o‘tish" : "Войти / зарегистрироваться"}
        </Link>
      </div>
    </ZoomradShell>
  );
}
