"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ZoomradShell } from "@/components/partners/ZoomradShell";
import { signInUrl } from "@/lib/auth/paths";

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
      <Link
        href={signInUrl("/dashboard/onboarding")}
        className="block rounded-xl bg-zoomrad-green px-4 py-3 text-center text-sm font-semibold text-white"
      >
        {locale === "uz" ? "Profilni to‘ldirish" : "Заполнить профиль"}
      </Link>
      <Link
        href={`/zoomrad/grants${suffix}`}
        className="mt-3 block text-center text-sm text-emerald-700"
      >
        {locale === "uz" ? "Grantlarni ko‘rish" : "Смотреть гранты"}
      </Link>
    </ZoomradShell>
  );
}
