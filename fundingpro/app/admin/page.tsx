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
