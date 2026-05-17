"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { CheckCircle2, Calendar, MapPin, DollarSign, ExternalLink, Bookmark, FileText, ArrowLeft } from "lucide-react";

const mockGrant = {
  id: "1",
  title: "UNDP Small Grants Programme — Центральная Азия 2025",
  donor: "UNDP Узбекистан",
  amount: "до $50,000",
  deadline: "30.06.2025",
  country: "Узбекистан",
  sector: "Экология",
  matchScore: 87,
  description: "Программа малых грантов ПРООН поддерживает инициативы местных организаций по охране окружающей среды и устойчивому управлению природными ресурсами в Центральной Азии. Приоритет — проекты с реальным участием местных сообществ.",
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

export default function GrantDetailDashboard({ params }: { params: { id: string } }) {
  return (
    <div>
      <Link
        href="/dashboard/grants"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-funding-green mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        К списку грантов
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {mockGrant.matchScore && (
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: "#D9F7DD", color: "#008A2E" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B94F" }} />
                {mockGrant.matchScore}% совпадение с профилем
              </div>
            )}
            <h1 className="text-xl font-black text-funding-black mb-2">{mockGrant.title}</h1>
            <p className="font-semibold" style={{ color: "#008A2E" }}>{mockGrant.donor}</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-funding-black mb-3">О гранте</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{mockGrant.description}</p>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-funding-black mb-4">Требования</h2>
            <ul className="space-y-3">
              {mockGrant.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-funding-green mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Eligible applicants */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-funding-black mb-3">Кто может подать</h2>
            <div className="flex flex-wrap gap-2">
              {mockGrant.eligibleApplicants.map((a) => (
                <span
                  key={a}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: "#D9F7DD", color: "#008A2E" }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Key info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-sm text-funding-black mb-4">Ключевые данные</h3>
            <div className="space-y-3">
              {[
                { icon: DollarSign, label: "Сумма", value: mockGrant.amount },
                { icon: Calendar, label: "Дедлайн", value: mockGrant.deadline },
                { icon: MapPin, label: "Страна", value: mockGrant.country },
                { icon: FileText, label: "Сектор", value: mockGrant.sector },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#D9F7DD" }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: "#008A2E" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-funding-black">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
              Последнее обновление: {mockGrant.lastUpdated}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Link
              href="/dashboard/eligibility"
              className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center"
              style={{ background: "#008A2E" }}
            >
              Проверить соответствие
            </Link>
            <Link
              href="/dashboard/ai-writer"
              className="block w-full py-3 rounded-xl font-semibold text-sm text-center border"
              style={{ borderColor: "#008A2E", color: "#008A2E" }}
            >
              Создать предложение
            </Link>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-600 hover:border-funding-green hover:text-funding-green transition-colors">
              <Bookmark className="w-4 h-4" />
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
