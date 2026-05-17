"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Search, UserCheck, UserX, MoreHorizontal } from "lucide-react";

const mockUsers = [
  { id: "1", name: "Ахмед Карахонов", org: "ЭкоНКО Узбекистан", email: "ahmed@...", plan: "Pro", status: "active", joined: "10.04.2025" },
  { id: "2", name: "Малика Юсупова", org: "Центр образования", email: "malika@...", plan: "Basic", status: "active", joined: "15.04.2025" },
  { id: "3", name: "Тимур Назаров", org: "АгроКонсалт ООО", email: "timur@...", plan: "Business Starter", status: "active", joined: "20.04.2025" },
  { id: "4", name: "Дилноза Рашидова", org: "—", email: "dilnoza@...", plan: "Basic", status: "pending", joined: "01.05.2025" },
  { id: "5", name: "Санжар Мирзаев", org: "ГражданФорум", email: "sanzhar@...", plan: "Consulting", status: "active", joined: "05.05.2025" },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const filtered = mockUsers.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.org.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Управление</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Пользователи</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск пользователей..."
              className="w-full pl-9 pr-4 py-2 bg-funding-light-bg rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["Пользователь", "Организация", "Тариф", "Статус", "Дата регистрации", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f9fafb" : "none" }} className="hover:bg-funding-light-bg transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-funding-green text-white font-bold text-sm flex items-center justify-center">{u.name[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-funding-black">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.org}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#D9F7DD", color: "#008A2E" }}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={u.status === "active" ? { background: "#D9F7DD", color: "#008A2E" } : { background: "#FEF3C7", color: "#D97706" }}
                    >
                      {u.status === "active" ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                      {u.status === "active" ? "Активен" : "Ожидает"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{u.joined}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
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
