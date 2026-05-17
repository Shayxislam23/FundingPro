"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { DashboardCard } from "@/components/design/DashboardCard";
import { CreditCard, TrendingUp, BarChart3 } from "lucide-react";

const commissionTiers = [
  { range: "0–500", platform: 70 },
  { range: "500–1,500", platform: 72, current: true },
  { range: "1,500–5,000", platform: 75 },
  { range: "5,000–10,000", platform: 78 },
  { range: "10,000+", platform: 80 },
];

const mockPayments = [
  { id: "pay_001", user: "ЭкоНКО Узбекистан", plan: "Pro", amount: "$50", fp: "$36", date: "17.05.2025", status: "success" },
  { id: "pay_002", user: "АгроКонсалт ООО", plan: "Business Starter", amount: "$90", fp: "$64.80", date: "16.05.2025", status: "success" },
  { id: "pay_003", user: "Центр образования", plan: "Basic", amount: "$30", fp: "$21.60", date: "15.05.2025", status: "pending" },
  { id: "pay_004", user: "ГражданФорум", plan: "Consulting", amount: "$100", fp: "$72", date: "14.05.2025", status: "success" },
];

export default function AdminPaymentsPage() {
  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Финансы</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Платежи и Revenue Share</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard title="Транзакций (май)" value="847" icon={CreditCard} trend={{ value: "+12%", positive: true }} />
        <DashboardCard title="Валовая выручка" value="$42,350" icon={TrendingUp} />
        <DashboardCard title="Доля FundingPro" value="$31,304" icon={BarChart3} trend={{ value: "73.9%", positive: true }} />
        <DashboardCard title="Доля партнёра" value="$11,046" icon={BarChart3} />
      </div>

      {/* Commission tiers */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-funding-black mb-4">Шкала комиссий</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["Транзакций/мес", "FundingPro %", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissionTiers.map((tier, i) => (
                <tr
                  key={i}
                  style={
                    tier.current
                      ? { background: "rgba(0,138,46,0.06)", borderBottom: "1px solid #f3f4f6" }
                      : { borderBottom: "1px solid #f9fafb" }
                  }
                >
                  <td className="px-4 py-3 text-sm font-medium text-funding-black">{tier.range}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#008A2E" }}>{tier.platform}%</td>
                  <td className="px-4 py-3">
                    {tier.current && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#D9F7DD", color: "#008A2E" }}>
                        Текущий
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Ставки хранятся в базе данных как конфигурируемые правила (partner_commission_rules). Не захардкожены.
        </p>
      </div>

      {/* Payment list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-funding-black">Последние платежи</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["ID", "Пользователь", "Тариф", "Сумма", "FundingPro", "Дата", "Статус"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockPayments.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < mockPayments.length - 1 ? "1px solid #f9fafb" : "none" }} className="hover:bg-funding-light-bg">
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{p.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-funding-black">{p.user}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.plan}</td>
                  <td className="px-4 py-3 text-sm font-bold text-funding-green">{p.amount}</td>
                  <td className="px-4 py-3 text-sm text-funding-green">{p.fp}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{p.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={p.status === "success" ? { background: "#D9F7DD", color: "#008A2E" } : { background: "#FEF3C7", color: "#D97706" }}
                    >
                      {p.status === "success" ? "Успешно" : "Ожидает"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
