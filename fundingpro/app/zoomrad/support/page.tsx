"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ZoomradShell } from "@/components/partners/ZoomradShell";

export default function ZoomradSupportPage() {
  const searchParams = useSearchParams();
  const locale = searchParams.get("lang") === "uz" ? "uz" : "ru";

  return (
    <ZoomradShell
      title={locale === "uz" ? "Yordam" : "Поддержка"}
      subtitle={locale === "uz" ? "Savollar bo‘yicha murojaat" : "Обращения по вопросам сервиса"}
    >
      <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 text-sm shadow-sm">
        <p className="text-neutral-700">
          {locale === "uz"
            ? "Texnik yordam va grant bo‘yicha savollar uchun ticketing tizimidan foydalaning."
            : "Для технической поддержки и вопросов по грантам используйте тикет-систему."}
        </p>
        <Link
          href={`/auth?redirect=${encodeURIComponent("/dashboard/support")}`}
          className="block rounded-xl bg-funding-green px-4 py-3 text-center font-semibold text-white"
        >
          {locale === "uz" ? "Murojaat yaratish" : "Создать обращение"}
        </Link>
      </div>
    </ZoomradShell>
  );
}
