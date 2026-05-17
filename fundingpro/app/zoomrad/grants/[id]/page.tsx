"use client";

import Link from "next/link";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { StatusBadge } from "@/components/design/StatusBadge";
import {
  Calendar,
  MapPin,
  DollarSign,
  ExternalLink,
  CheckCircle2,
  FileText,
  Bookmark,
} from "lucide-react";

// Mock grant data
const mockGrant = {
  id: "1",
  title: "UNDP Small Grants Programme — Центральная Азия 2025",
  donor: "UNDP Узбекистан",
  amount: "до $50,000",
  deadline: "30.06.2025",
  country: "Узбекистан",
  sector: "Экология",
  matchScore: 87,
  description:
    "Программа малых грантов ПРООН поддерживает инициативы местных организаций по охране окружающей среды и устойчивому управлению природными ресурсами в Центральной Азии.",
  requirements: [
    "Зарегистрированная НКО в стране реализации",
    "Опыт реализации проектов в сфере экологии от 2 лет",
    "Наличие партнёра из целевого сообщества",
    "Чёткий план измерения результатов",
    "Готовность к мониторингу и отчётности",
  ],
  eligibleApplicants: ["НКО", "Общественные организации", "Исследовательские институты"],
  lastUpdated: "15.05.2025",
  sourceUrl: "#",
};

export default function GrantDetailPage({ params }: { params: { id: string } }) {
  return (
    <ZoomradShell variant="light" showBack title="Грант">
      <div className="pb-24">
        {/* Header */}
        <div className="px-5 pt-5 pb-5 border-b border-gray-100">
          {mockGrant.matchScore && (
            <div
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
              style={{ background: "#D9F7DD", color: "#008A2E" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B94F" }} />
              {mockGrant.matchScore}% совпадение с профилем
            </div>
          )}
          <h1 className="text-lg font-black leading-tight text-funding-black mb-2">
            {mockGrant.title}
          </h1>
          <p className="text-sm font-semibold" style={{ color: "#008A2E" }}>
            {mockGrant.donor}
          </p>
        </div>

        {/* Key info */}
        <div className="grid grid-cols-2 gap-3 px-5 py-4 border-b border-gray-100">
          {[
            { icon: DollarSign, label: "Сумма", value: mockGrant.amount },
            { icon: Calendar, label: "Дедлайн", value: mockGrant.deadline },
            { icon: MapPin, label: "Страна", value: mockGrant.country },
            { icon: FileText, label: "Сектор", value: mockGrant.sector },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="p-3 rounded-xl"
              style={{ background: "#F7FAF7" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3" style={{ color: "#008A2E" }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#4A5A4D" }}>
                  {label}
                </span>
              </div>
              <div className="text-sm font-semibold text-funding-black">{value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-funding-black mb-2">О гранте</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#4A5A4D" }}>
            {mockGrant.description}
          </p>
        </div>

        {/* Requirements */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-funding-black mb-3">Требования</h2>
          <ul className="space-y-2">
            {mockGrant.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#008A2E" }} />
                <span className="text-sm" style={{ color: "#4A5A4D" }}>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Eligible applicants */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-funding-black mb-3">Кто может подать</h2>
          <div className="flex flex-wrap gap-2">
            {mockGrant.eligibleApplicants.map((a) => (
              <span
                key={a}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "#D9F7DD", color: "#008A2E" }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            Последнее обновление: {mockGrant.lastUpdated}
          </p>
        </div>
      </div>

      {/* Sticky action bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 border-t"
        style={{ background: "#fff", borderColor: "#e5e7eb" }}
      >
        <div className="flex gap-3">
          <button
            className="flex-shrink-0 p-3 rounded-xl border"
            style={{ borderColor: "#e5e7eb" }}
          >
            <Bookmark className="w-5 h-5" style={{ color: "#008A2E" }} />
          </button>
          <Link
            href="/zoomrad/eligibility"
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-center text-white"
            style={{ background: "#008A2E" }}
          >
            Проверить соответствие
          </Link>
        </div>
      </div>
    </ZoomradShell>
  );
}
