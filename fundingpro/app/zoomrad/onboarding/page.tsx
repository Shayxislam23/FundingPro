"use client";

import { useSearchParams } from "next/navigation";
import { ZoomradShell } from "@/components/partners/ZoomradShell";

export default function ZoomradOnboardingPage() {
  const searchParams = useSearchParams();
  const locale = searchParams.get("lang") === "uz" ? "uz" : "ru";
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";

  return (
    <ZoomradShell
      title={locale === "uz" ? "Boshlash" : "Старт"}
      subtitle={
        locale === "uz" ? "Profil va mos grant tanlash" : "Профиль и подбор подходящих грантов"
      }
    >
      <a
        href={`/auth?redirect=${encodeURIComponent(`/dashboard/onboarding`)}`}
        className="block rounded-xl bg-[#008A2E] px-4 py-3 text-center text-sm font-semibold text-white"
      >
        {locale === "uz" ? "Profilni to‘ldirish" : "Заполнить профиль"}
      </a>
      <a
        href={`/zoomrad/grants${suffix}`}
        className="mt-3 block text-center text-sm text-emerald-700"
      >
        {locale === "uz" ? "Grantlarni ko‘rish" : "Смотреть гранты"}
      </a>
    </ZoomradShell>
  );
}
