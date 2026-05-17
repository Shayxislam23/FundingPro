"use client";

import { useState } from "react";
import Link from "next/link";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { StatusBadge } from "@/components/design/StatusBadge";
import { EmptyState } from "@/components/design/EmptyState";
import { BarChart3, Plus, Calendar } from "lucide-react";

type ApplicationStatus =
  | "saved"
  | "preparing"
  | "drafting"
  | "ready"
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "won"
  | "lost"
  | "reporting"
  | "closed";

const mockApplications = [
  {
    id: "1",
    grantTitle: "UNDP Small Grants Programme",
    donor: "UNDP Узбекистан",
    amount: "до $50,000",
    deadline: "30.06.2025",
    status: "drafting" as ApplicationStatus,
    updatedAt: "15.05.2025",
  },
  {
    id: "2",
    grantTitle: "GIZ CCD — Климат и устойчивое развитие",
    donor: "GIZ / BMZ",
    amount: "до $100,000",
    deadline: "01.08.2025",
    status: "submitted" as ApplicationStatus,
    updatedAt: "10.05.2025",
  },
  {
    id: "3",
    grantTitle: "World Bank BETF — Образование",
    donor: "World Bank",
    amount: "$20,000 – $80,000",
    deadline: "20.07.2025",
    status: "shortlisted" as ApplicationStatus,
    updatedAt: "01.05.2025",
  },
];

export default function TrackerPage() {
  const [filter, setFilter] = useState<string>("all");

  const filters = [
    { value: "all", label: "Все" },
    { value: "active", label: "Активные" },
    { value: "won", label: "Получены" },
    { value: "lost", label: "Не получены" },
  ];

  const filtered = mockApplications.filter((a) => {
    if (filter === "all") return true;
    if (filter === "active")
      return !["won", "lost", "closed"].includes(a.status);
    if (filter === "won") return a.status === "won";
    if (filter === "lost") return a.status === "lost";
    return true;
  });

  return (
    <ZoomradShell variant="light" title="Мои заявки" showBack showNotifications>
      <div className="px-4 pt-4 pb-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={
                filter === f.value
                  ? { background: "#008A2E", color: "#fff" }
                  : { background: "#fff", color: "#4A5A4D", border: "1px solid #e5e7eb" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Нет заявок"
            description="Начните с поиска подходящего гранта"
            action={
              <Link
                href="/zoomrad/grants"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#008A2E" }}
              >
                Найти грант
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-white border"
                style={{ borderColor: "#e5e7eb" }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-funding-black line-clamp-2 mb-1">
                      {app.grantTitle}
                    </h3>
                    <p className="text-xs font-medium" style={{ color: "#008A2E" }}>{app.donor}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="flex items-center gap-4 text-xs" style={{ color: "#4A5A4D" }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {app.deadline}
                  </span>
                  <span>{app.amount}</span>
                </div>

                <div
                  className="mt-3 pt-3 border-t flex items-center justify-between"
                  style={{ borderColor: "#f3f4f6" }}
                >
                  <span className="text-xs" style={{ color: "#9ca3af" }}>
                    Обновлено: {app.updatedAt}
                  </span>
                  <button
                    className="text-xs font-semibold"
                    style={{ color: "#008A2E" }}
                  >
                    Открыть →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add application */}
        <Link
          href="/zoomrad/grants"
          className="fixed bottom-5 right-5 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{ background: "#008A2E" }}
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>
    </ZoomradShell>
  );
}
