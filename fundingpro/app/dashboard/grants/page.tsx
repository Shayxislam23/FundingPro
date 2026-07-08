"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { GrantCard } from "@/components/design/GrantCard";
import { Search, Loader2 } from "lucide-react";
import { translateSector } from "@fundingpro/shared";
import { getAuthHeaders } from "@/lib/client-auth";
import { buildMatchScoreDetails, type MatchScoreDetails } from "@/lib/match-score";
import { trackEvent } from "@/lib/analytics";
import {
  formatGrantAmount,
  formatDeadlineDisplay,
  getDeadlineUrgency,
  isDeadlineExpired,
} from "@fundingpro/shared";

async function authHeaders(): Promise<Record<string, string>> {
  return getAuthHeaders();
}

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

type ListMode = "active" | "all";

const sectorFilters = [
  "Все",
  "Экология",
  "Образование",
  "Здравоохранение",
  "Климат",
  "Права человека",
  "Гражданское общество",
  "Экономика",
  "Исследования",
  "Биотехнологии",
  "Водные ресурсы",
] as const;

const SECTOR_SLUGS: Record<(typeof sectorFilters)[number], string | undefined> = {
  Все: undefined,
  Экология: "environment",
  Образование: "education",
  Здравоохранение: "healthcare",
  Климат: "climate",
  "Права человека": "human_rights",
  "Гражданское общество": "civil_society",
  Экономика: "economics",
  Исследования: "research",
  Биотехнологии: "biotechnology",
  "Водные ресурсы": "water_resources",
};

function getSector(sectors: string[]): string {
  if (!sectors?.length) return "—";
  return translateSector(sectors[0]);
}

export default function DashboardGrantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      }
    >
      <GrantsPageContent />
    </Suspense>
  );
}

function GrantsPageContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState<(typeof sectorFilters)[number]>("Все");
  const [listMode, setListMode] = useState<ListMode>("active");
  const [showExpired, setShowExpired] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [orgProfile, setOrgProfile] = useState<Record<string, unknown> | null>(null);
  const [matchScores, setMatchScores] = useState<Map<string, MatchScoreDetails>>(new Map());

  const [grants, setGrants] = useState<Grant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchGrants = useCallback(
    async (pg: number, append = false) => {
      if (pg === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const params = new URLSearchParams({ page: String(pg), limit: "12" });
        if (search) params.set("search", search);
        if (listMode === "active") params.set("activeOnly", "true");
        const sectorSlug = SECTOR_SLUGS[activeSector];
        if (sectorSlug) params.set("sector", sectorSlug);

        const res = await fetch(`/api/v1/grants?${params}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const list: Grant[] = data.data?.grants ?? [];
        setTotal(data.data?.total ?? 0);
        setHasMore(pg < (data.data?.pages ?? 1));
        setGrants((prev) => (append ? [...prev, ...list] : list));
      } catch {
        if (!append) setGrants([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, listMode, activeSector]
  );

  useEffect(() => {
    setPage(1);
    fetchGrants(1, false);
  }, [fetchGrants]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    authHeaders()
      .then((headers) => fetch("/api/v1/me", { headers }))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.data?.savedGrantIds) setSaved(d.data.savedGrantIds);
        if (d?.data?.organization) setOrgProfile(d.data.organization);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!orgProfile || grants.length === 0) {
      setMatchScores(new Map());
      return;
    }
    setMatchScores(
      buildMatchScoreDetails(
        grants.map((g) => ({
          id: g.id,
          sectors: g.sectors,
          country_scope: g.country_scope,
          deadline: g.deadline,
        })),
        orgProfile
      )
    );
  }, [orgProfile, grants]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchGrants(next, true);
  };

  const toggleSave = async (id: string) => {
    const isSaved = saved.includes(id);
    setSaved((prev) => (isSaved ? prev.filter((s) => s !== id) : [...prev, id]));
    try {
      const headers = await authHeaders();
      const method = isSaved ? "DELETE" : "POST";
      const res = await fetch(`/api/v1/grants/${id}/save`, { method, headers });
      if (!res.ok) {
        setSaved((prev) => (isSaved ? [...prev, id] : prev.filter((s) => s !== id)));
      } else if (!isSaved) {
        trackEvent("onboarding_step_saved_grant", { grant_id: id });
      }
    } catch {
      setSaved((prev) => (isSaved ? [...prev, id] : prev.filter((s) => s !== id)));
    }
  };

  const filtered = grants.filter((g) => {
    if (listMode === "active") return true;
    const expired = isDeadlineExpired(g.deadline);
    return showExpired ? true : !expired;
  });

  const activeCount = grants.filter((g) => !isDeadlineExpired(g.deadline)).length;
  const expiredCount = grants.filter((g) => isDeadlineExpired(g.deadline)).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>База грантов</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Поиск грантов</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex gap-2 mb-4">
          {(["active", "all"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setListMode(mode);
                if (mode === "active") setShowExpired(false);
              }}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors border"
              style={
                listMode === mode
                  ? { background: "#008A2E", color: "#fff", borderColor: "#008A2E" }
                  : { background: "#F7FAF7", color: "#4A5A4D", borderColor: "#e5e7eb" }
              }
            >
              {mode === "active" ? "Активные" : "Все гранты"}
            </button>
          ))}
        </div>

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
          {listMode === "all" && (
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
          )}
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
            {listMode === "active" ? (
              <>
                Активных: <strong className="text-funding-black">{total}</strong>
              </>
            ) : (
              <>
                Показано: <strong className="text-funding-black">{filtered.length}</strong> из{" "}
                <strong>{total}</strong> грантов
                {!showExpired && expiredCount > 0 && (
                  <span className="text-gray-400"> · {activeCount} с действующим дедлайном</span>
                )}
              </>
            )}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-gray-500 text-sm font-medium mb-1">Грантов не найдено</p>
              <p className="text-gray-400 text-xs max-w-sm mx-auto">
                {listMode === "active"
                  ? "Сейчас нет открытых грантов по выбранным фильтрам. Попробуйте другой сектор или переключитесь на «Все гранты»."
                  : "Попробуйте изменить поиск, сектор или включите показ истёкших дедлайнов."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((g) => {
                const expired = isDeadlineExpired(g.deadline);
                const urgency = getDeadlineUrgency(g.deadline);
                return (
                  <Link key={g.id} href={`/dashboard/grants/${g.id}`}>
                    <div className="relative">
                      {(expired || urgency === "soon") && (
                        <div className="absolute top-3 right-10 z-10 flex gap-1">
                          {expired && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-400">
                              Дедлайн истёк
                            </span>
                          )}
                          {!expired && urgency === "soon" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Скоро закрывается
                            </span>
                          )}
                        </div>
                      )}
                      <GrantCard
                        id={g.id}
                        title={g.title_ru ?? g.title}
                        donor={g.donor.name_ru ?? g.donor.name ?? "—"}
                        amount={formatGrantAmount(g.amount_min, g.amount_max)}
                        deadline={formatDeadlineDisplay(g.deadline)}
                        deadlineUrgency={expired ? null : urgency}
                        country={g.country_scope.join(", ")}
                        sector={getSector(g.sectors)}
                        matchScore={matchScores.get(g.id)?.score}
                        matchReasons={matchScores.get(g.id)?.reasons}
                        isSaved={saved.includes(g.id)}
                        onSave={toggleSave}
                        variant="light"
                        className={expired ? "opacity-60" : ""}
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
