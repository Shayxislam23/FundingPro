"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { GrantCard } from "@/components/design/GrantCard";
import { Search, Loader2 } from "lucide-react";
import { translateSector } from "@/lib/sector-labels";

type Grant = {
  id: string;
  title: string;
  title_ru: string | null;
  deadline: string | null;
  amount_min: number | null;
  amount_max: number | null;
  sectors: string[];
  country_scope: string[];
  donor: { name: string | null; name_ru: string | null };
};

const TODAY = new Date();

const sectorFilters = ["Все", "Экология", "Образование", "Здравоохранение", "Климат", "Права человека", "Гражданское общество", "Экономика", "Исследования", "Биотехнологии", "Водные ресурсы"];

function formatAmount(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (max) return `до $${max.toLocaleString()}`;
  return `от $${min!.toLocaleString()}`;
}

function formatDeadline(d: string | null): { text: string; expired: boolean } {
  if (!d) return { text: "—", expired: false };
  const date = new Date(d);
  const expired = date < TODAY;
  const text = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  return { text, expired };
}

function getSector(sectors: string[]): string {
  if (!sectors?.length) return "—";
  return translateSector(sectors[0]);
}

export default function DashboardGrantsPage() {
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState("Все");
  const [showExpired, setShowExpired] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);

  const [grants, setGrants] = useState<Grant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchGrants = useCallback(async (pg: number, append = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "12" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/v1/grants?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const list: Grant[] = data.data?.grants ?? [];
      setTotal(data.data?.total ?? 0);
      setHasMore(pg < (data.data?.pages ?? 1));
      setGrants((prev) => append ? [...prev, ...list] : list);
    } catch {
      if (!append) setGrants([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search]);

  useEffect(() => {
    setPage(1);
    fetchGrants(1, false);
  }, [fetchGrants]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchGrants(next, true);
  };

  const toggleSave = (id: string) =>
    setSaved((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  // Client-side sector filter + expired filter
  const filtered = grants.filter((g) => {
    const sectorMatch = activeSector === "Все" ||
      g.sectors.some((s) => translateSector(s) === activeSector);
    const { expired } = formatDeadline(g.deadline);
    const expiredMatch = showExpired ? true : !expired;
    return sectorMatch && expiredMatch;
  });

  const expiredCount = grants.filter((g) => formatDeadline(g.deadline).expired).length;

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
          <button
            onClick={() => setShowExpired((v) => !v)}
            className="flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors border"
            style={
              showExpired
                ? { background: "#FEF3C7", color: "#D97706", borderColor: "#FCD34D" }
                : { background: "#F7FAF7", color: "#6B7280", borderColor: "#e5e7eb" }
            }
          >
            {showExpired ? "Все дедлайны" : `Скрыть истёкшие (${expiredCount})`}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {sectorFilters.map((s) => (
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Показано: <strong className="text-funding-black">{filtered.length}</strong> из <strong>{total}</strong> грантов
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              Грантов не найдено. Попробуйте изменить фильтры.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((g) => {
                const dl = formatDeadline(g.deadline);
                return (
                  <Link key={g.id} href={`/dashboard/grants/${g.id}`}>
                    <div className="relative">
                      {dl.expired && (
                        <div className="absolute top-3 right-10 z-10">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-400">
                            Дедлайн истёк
                          </span>
                        </div>
                      )}
                      <GrantCard
                        id={g.id}
                        title={g.title_ru ?? g.title}
                        donor={g.donor.name_ru ?? g.donor.name ?? "—"}
                        amount={formatAmount(g.amount_min, g.amount_max) ?? undefined}
                        deadline={dl.text}
                        country={g.country_scope.join(", ")}
                        sector={getSector(g.sectors)}
                        isSaved={saved.includes(g.id)}
                        onSave={toggleSave}
                        variant="light"
                        className={dl.expired ? "opacity-60" : ""}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Загрузить ещё
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
