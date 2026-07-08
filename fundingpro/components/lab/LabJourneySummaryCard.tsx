"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";
import { LAB_STEPS } from "@/components/lab/labSteps";

type OnboardingStatusShape = {
  progressPercent: number;
  nextStepId: string | null;
};

/**
 * Compact Opportunities Lab progress card for the main dashboard.
 * Self-contained (fetches its own data via /api/v1/onboarding/status).
 */
export function LabJourneySummaryCard() {
  const [status, setStatus] = useState<OnboardingStatusShape | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuthHeaders()
      .then((headers) => fetch("/api/v1/onboarding/status", { headers }))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.data) {
          setStatus({
            progressPercent: d.data.progressPercent ?? 0,
            nextStepId: d.data.nextStepId ?? null,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) return null;

  const nextMeta = LAB_STEPS.find((s) => s.id === status.nextStepId);

  return (
    <Link
      href="/dashboard/lab"
      className="block rounded-2xl border border-funding-green/20 bg-white p-5 mb-6 hover:border-funding-green/50 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-funding-light-green flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-funding-green" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-funding-black">Мой путь к заявке</p>
            <p className="text-xs text-gray-500 truncate">
              {nextMeta ? `Далее: ${nextMeta.label.toLowerCase()}` : "Все шаги выполнены — проверьте сертификат"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-bold text-funding-green">{status.progressPercent}%</span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-funding-light-bg overflow-hidden mt-3">
        <div
          className="h-full rounded-full bg-funding-green transition-all"
          style={{ width: `${status.progressPercent}%` }}
        />
      </div>
    </Link>
  );
}
