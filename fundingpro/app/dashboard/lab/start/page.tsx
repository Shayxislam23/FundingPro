"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Loader2, Lock } from "lucide-react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { getAuthHeaders } from "@/lib/client-auth";
import type { LabAccess } from "@/lib/db/lab";

export default function LabStartPage() {
  const [access, setAccess] = useState<LabAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/lab/access", { headers });
        const data = await res.json();
        setAccess(data.data ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
      </div>
    );
  }

  if (!access?.hasPaidAccess) {
    const action = access?.nextAction;
    return (
      <div className="max-w-xl bg-white rounded-2xl border border-gray-100 p-6">
        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-amber-700" />
        </div>
        <SectionLabel>Мой путь</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black mt-1">Доступ после оплаты</h1>
        <p className="text-sm text-gray-500 mt-2">
          {action?.description ?? "Первый урок откроется после подтверждения оплаты курса."}
        </p>
        <Link
          href={action?.href ?? "/dashboard/lab/checkout"}
          className="inline-flex mt-5 px-5 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#008A2E" }}
        >
          {action?.label ?? "Перейти к оплате"}
        </Link>
      </div>
    );
  }

  const lessonDate = access.cohort.firstLessonAt
    ? new Date(access.cohort.firstLessonAt).toLocaleString("ru-RU", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "5 июля 2026, 19:00";

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <SectionLabel>Мой путь</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Первый урок</h1>
        <p className="text-sm text-gray-500 mt-1">{access.cohort.name}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-funding-light-green flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-funding-green" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Дата и время</p>
            <p className="text-xl font-black text-funding-black">{lessonDate}</p>
            <p className="text-xs text-gray-400 mt-1">Asia/Tashkent timezone</p>
          </div>
        </div>

        <div className="rounded-xl bg-funding-light-bg p-4">
          <p className="text-sm font-semibold text-funding-black mb-3">Подготовьте до урока</p>
          <div className="space-y-2">
            {[
              "Заполните Lab profile",
              "Выберите интересы",
              "Подготовьте CV или отметьте Need CV help",
              "Добавьте LinkedIn, если есть",
              "Откройте dashboard Lab во время урока",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-funding-green" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {access.cohort.firstLessonUrl && (
          <a
            href={access.cohort.firstLessonUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex px-5 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#008A2E" }}
          >
            Open lesson link
          </a>
        )}
      </div>
    </div>
  );
}
