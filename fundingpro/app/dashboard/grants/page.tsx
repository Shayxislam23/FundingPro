"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { GrantCard } from "@/components/design/GrantCard";
import { Search, SlidersHorizontal } from "lucide-react";

const mockGrants = [
  { id: "1", title: "UNDP Small Grants Programme — Центральная Азия 2025", donor: "UNDP Узбекистан", amount: "до $50,000", deadline: "30.06.2025", country: "Узбекистан", sector: "Экология", matchScore: 87 },
  { id: "2", title: "EU EIDHR — Права человека и демократическое управление", donor: "Европейский Союз", amount: "€30,000 – €150,000", deadline: "15.07.2025", country: "Узбекистан / Казахстан", sector: "Права человека", matchScore: 72 },
  { id: "3", title: "GIZ CCD — Климат и устойчивое развитие", donor: "GIZ / BMZ", amount: "до $100,000", deadline: "01.08.2025", country: "Центральная Азия", sector: "Климат", matchScore: 65 },
  { id: "4", title: "World Bank BETF — Образование и технологии", donor: "World Bank", amount: "$20,000 – $80,000", deadline: "20.07.2025", country: "Узбекистан", sector: "Образование", matchScore: 91 },
  { id: "5", title: "USAID CDCS — Гражданское общество Узбекистана", donor: "USAID", amount: "$50,000 – $250,000", deadline: "10.08.2025", country: "Узбекистан", sector: "Гражданское общество", matchScore: 58 },
  { id: "6", title: "Aga Khan Foundation — Здравоохранение и питание", donor: "Aga Khan Foundation", amount: "до $75,000", deadline: "25.07.2025", country: "Таджикистан / Узбекистан", sector: "Здравоохранение" },
  { id: "7", title: "EU Erasmus+ — Академическое сотрудничество", donor: "Европейский Союз", amount: "€50,000 – €200,000", deadline: "05.09.2025", country: "Весь мир", sector: "Образование", matchScore: 44 },
  { id: "8", title: "Swiss Development Cooperation — Частный сектор", donor: "SDC / SECO", amount: "$30,000 – $120,000", deadline: "15.08.2025", country: "Центральная Азия", sector: "Экономика" },
];

const sectors = ["Все", "Экология", "Образование", "Здравоохранение", "Климат", "Права человека", "Гражданское общество", "Экономика"];

export default function DashboardGrantsPage() {
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState("Все");
  const [saved, setSaved] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("match");

  const filtered = mockGrants
    .filter((g) => {
      const ms = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.donor.toLowerCase().includes(search.toLowerCase());
      const mf = activeSector === "Все" || g.sector === activeSector;
      return ms && mf;
    })
    .sort((a, b) => {
      if (sortBy === "match") return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      return 0;
    });

  const toggleSave = (id: string) => setSaved((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>База грантов</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Поиск грантов</h1>
        </div>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или донору..."
              className="w-full pl-9 pr-4 py-2.5 bg-funding-light-bg rounded-xl text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-funding-green/20"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-funding-light-bg rounded-xl text-sm text-gray-700 outline-none border-none"
          >
            <option value="match">По совпадению</option>
            <option value="deadline">По дедлайну</option>
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSector(s)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={
                activeSector === s
                  ? { background: "#008A2E", color: "#fff" }
                  : { background: "#F7FAF7", color: "#4A5A4D", border: "1px solid #e5e7eb" }
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Найдено: <strong className="text-funding-black">{filtered.length}</strong> грантов
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((g) => (
          <Link key={g.id} href={`/dashboard/grants/${g.id}`}>
            <GrantCard {...g} isSaved={saved.includes(g.id)} onSave={toggleSave} variant="light" />
          </Link>
        ))}
      </div>
    </div>
  );
}
