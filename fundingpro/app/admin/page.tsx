"use client";

import { DashboardCard } from "@/components/design/DashboardCard";
import { SectionLabel } from "@/components/design/SectionLabel";
import { StatusBadge } from "@/components/design/StatusBadge";
import { Users, BookOpen, CreditCard, Bot, TrendingUp, BarChart3, Building2, Shield } from "lucide-react";

const recentPayments = [
  { user: "Ташкентская НКО 'Экосфера'", plan: "Pro", amount: "$50", date: "17.05.2025", status: "success" },
  { user: "ООО Агросервис", plan: "Business Starter", amount: "$90", date: "16.05.2025", status: "success" },
  { user: "Ферганский образовательный центр", plan: "Basic", amount: "$30", date: "15.05.2025", status: "pending" },
];

const zoomradRevenue = {
  totalTransactions: 847,
  gross: "$42,350",
  zoomradShare: "$11,046 (26.1%)",
  fundingproShare: "$31,304 (73.9%)",
  bucket: "500–1,500 транзакций",
  rate: "ZOOMRAD 28% / FundingPro 72%",
};

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Администрирование</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Панель управления</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard title="Пользователей" value="1,248" icon={Users} trend={{ value: "+32 сегодня", positive: true }} />
        <DashboardCard title="Грантов в базе" value="1,073" icon={BookOpen} />
        <DashboardCard title="Платежей (май)" value="847" icon={CreditCard} trend={{ value: "+12%", positive: true }} />
        <DashboardCard title="AI-запросов" value="3,421" icon={Bot} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ZOOMRAD Revenue Share */}
        <div>
          <h2 className="font-bold text-funding-black mb-3">ZOOMRAD Revenue Share — май 2025</h2>
          <div
            className="rounded-2xl p-6 border"
            style={{ background: "#020703", borderColor: "rgba(0,138,46,0.3)" }}
          >
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: "rgba(0,138,46,0.2)", color: "#12B94F" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#12B94F" }} />
              {zoomradRevenue.bucket}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Транзакций", value: zoomradRevenue.totalTransactions.toString() },
                { label: "Валовая выручка", value: zoomradRevenue.gross },
                { label: "Доля ZOOMRAD", value: zoomradRevenue.zoomradShare },
                { label: "Доля FundingPro", value: zoomradRevenue.fundingproShare },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs" style={{ color: "#A7B8AA" }}>{label}</p>
                  <p className="font-bold text-white text-sm mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div
              className="mt-4 pt-4 border-t text-xs"
              style={{ borderColor: "rgba(255,255,255,0.05)", color: "#A7B8AA" }}
            >
              Текущая ставка: <strong className="text-funding-accent">{zoomradRevenue.rate}</strong>
            </div>
          </div>
        </div>

        {/* Recent payments */}
        <div>
          <h2 className="font-bold text-funding-black mb-3">Последние платежи</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {recentPayments.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 hover:bg-funding-light-bg transition-colors"
                style={{ borderBottom: i < recentPayments.length - 1 ? "1px solid #f3f4f6" : "none" }}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-xs font-medium text-funding-black truncate">{p.user}</p>
                  <p className="text-[10px] text-gray-400">{p.plan} · {p.date}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-funding-green">{p.amount}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={p.status === "success" ? { background: "#D9F7DD", color: "#008A2E" } : { background: "#FEF3C7", color: "#D97706" }}
                  >
                    {p.status === "success" ? "Успешно" : "Ожидает"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
