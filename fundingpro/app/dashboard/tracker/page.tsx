"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { StatusBadge } from "@/components/design/StatusBadge";
import { EmptyState } from "@/components/design/EmptyState";
import { BarChart3, Plus, Calendar, DollarSign, ChevronDown, Filter } from "lucide-react";

type ApplicationStatus =
  | "saved" | "preparing" | "drafting" | "ready" | "submitted"
  | "under_review" | "shortlisted" | "won" | "lost" | "reporting" | "closed";

const mockApplications = [
  { id: "1", grantTitle: "UNDP Small Grants Programme", donor: "UNDP Узбекистан", amount: "до $50,000", deadline: "30.06.2025", status: "drafting" as ApplicationStatus, updatedAt: "15.05.2025" },
  { id: "2", grantTitle: "GIZ CCD — Климат", donor: "GIZ / BMZ", amount: "до $100,000", deadline: "01.08.2025", status: "submitted" as ApplicationStatus, updatedAt: "10.05.2025" },
  { id: "3", grantTitle: "World Bank BETF — Образование", donor: "World Bank", amount: "$20,000 – $80,000", deadline: "20.07.2025", status: "shortlisted" as ApplicationStatus, updatedAt: "01.05.2025" },
  { id: "4", grantTitle: "EU EIDHR — Права человека", donor: "Европейский Союз", amount: "€30,000 – €150,000", deadline: "15.07.2025", status: "preparing" as ApplicationStatus, updatedAt: "20.05.2025" },
];

const allStatuses: ApplicationStatus[] = ["saved", "preparing", "drafting", "ready", "submitted", "under_review", "shortlisted", "won", "lost", "reporting", "closed"];

export default function TrackerDashboard() {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = mockApplications.filter((a) => filterStatus === "all" || a.status === filterStatus);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>CRM</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Трекер заявок</h1>
        </div>
        <Link
          href="/dashboard/grants"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ background: "#008A2E" }}
        >
          <Plus className="w-4 h-4" />
          Добавить заявку
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Всего", value: mockApplications.length, color: "#050505" },
          { label: "Активных", value: mockApplications.filter((a) => !["won", "lost", "closed"].includes(a.status)).length, color: "#008A2E" },
          { label: "Получено", value: mockApplications.filter((a) => a.status === "won").length, color: "#12B94F" },
          { label: "Шортлист", value: mockApplications.filter((a) => a.status === "shortlisted").length, color: "#d97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={filterStatus === "all" ? { background: "#008A2E", color: "#fff" } : { background: "#F7FAF7", color: "#4A5A4D", border: "1px solid #e5e7eb" }}
          >
            Все
          </button>
          {allStatuses.slice(0, 6).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={filterStatus === s ? { background: "#008A2E", color: "#fff" } : { background: "#F7FAF7", color: "#4A5A4D", border: "1px solid #e5e7eb" }}
            >
              <StatusBadge status={s as ApplicationStatus} className="!px-0 !py-0 !bg-transparent !text-inherit" />
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Нет заявок"
          description="Начните с поиска подходящего гранта"
          action={
            <Link href="/dashboard/grants" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#008A2E" }}>
              Найти грант
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Грант / Донор", "Сумма", "Дедлайн", "Статус", "Обновлено", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, i) => (
                  <tr
                    key={app.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f9fafb" : "none" }}
                    className="hover:bg-funding-light-bg transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-funding-black">{app.grantTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{app.donor}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{app.amount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{app.deadline}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{app.updatedAt}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-semibold" style={{ color: "#008A2E" }}>
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
