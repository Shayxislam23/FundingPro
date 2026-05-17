"use client";

import { useState } from "react";
import Link from "next/link";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { GrantCard } from "@/components/design/GrantCard";
import { Search, SlidersHorizontal } from "lucide-react";

const mockGrants = [
  {
    id: "1",
    title: "UNDP Small Grants Programme — Центральная Азия 2025",
    donor: "UNDP Узбекистан",
    amount: "до $50,000",
    deadline: "30.06.2025",
    country: "Узбекистан",
    sector: "Экология",
    matchScore: 87,
  },
  {
    id: "2",
    title: "EU EIDHR — Права человека и демократическое управление",
    donor: "Европейский Союз",
    amount: "€30,000 – €150,000",
    deadline: "15.07.2025",
    country: "Узбекистан / Казахстан",
    sector: "Права человека",
    matchScore: 72,
  },
  {
    id: "3",
    title: "GIZ CCD — Климат и устойчивое развитие",
    donor: "GIZ / BMZ",
    amount: "до $100,000",
    deadline: "01.08.2025",
    country: "Центральная Азия",
    sector: "Климат",
    matchScore: 65,
  },
  {
    id: "4",
    title: "World Bank BETF — Образование и технологии",
    donor: "World Bank",
    amount: "$20,000 – $80,000",
    deadline: "20.07.2025",
    country: "Узбекистан",
    sector: "Образование",
    matchScore: 91,
  },
  {
    id: "5",
    title: "USAID CDCS — Гражданское общество Узбекистана",
    donor: "USAID",
    amount: "$50,000 – $250,000",
    deadline: "10.08.2025",
    country: "Узбекистан",
    sector: "Гражданское общество",
    matchScore: 58,
  },
  {
    id: "6",
    title: "Aga Khan Foundation — Здравоохранение и питание",
    donor: "Aga Khan Foundation",
    amount: "до $75,000",
    deadline: "25.07.2025",
    country: "Таджикистан / Узбекистан",
    sector: "Здравоохранение",
  },
];

const sectors = ["Все", "Экология", "Образование", "Здравоохранение", "Климат", "Права человека"];

export default function ZoomradGrantsPage() {
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState("Все");
  const [saved, setSaved] = useState<string[]>([]);

  const filtered = mockGrants.filter((g) => {
    const matchSearch =
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.donor.toLowerCase().includes(search.toLowerCase());
    const matchSector = activeSector === "Все" || g.sector === activeSector;
    return matchSearch && matchSector;
  });

  const toggleSave = (id: string) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  return (
    <ZoomradShell variant="light" title="Гранты" showBack showNotifications>
      <div className="px-4 pt-4 pb-6">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск грантов..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-funding-green"
          />
        </div>

        {/* Sector filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSector(s)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={
                activeSector === s
                  ? { background: "#008A2E", color: "#fff" }
                  : { background: "#fff", color: "#4A5A4D", border: "1px solid #e5e7eb" }
              }
            >
              {s}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs mb-3" style={{ color: "#4A5A4D" }}>
          Найдено: <strong>{filtered.length}</strong> грантов
        </p>

        {/* Grant cards */}
        <div className="space-y-3">
          {filtered.map((grant) => (
            <Link key={grant.id} href={`/zoomrad/grants/${grant.id}`}>
              <GrantCard
                {...grant}
                isSaved={saved.includes(grant.id)}
                onSave={(id) => {
                  toggleSave(id);
                }}
                variant="light"
              />
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#4A5A4D" }}>
              Гранты не найдены. Измените фильтры.
            </p>
          </div>
        )}
      </div>
    </ZoomradShell>
  );
}
