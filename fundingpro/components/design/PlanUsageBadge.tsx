"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/client-auth";

type UsageData = {
  planName: string;
  limits: { eligibilityChecks: number | null; aiProposals: number | null };
  used: { eligibilityChecks: number; aiProposals: number };
};

function formatLimit(used: number, max: number | null): string {
  if (max === null) return `${used} · без лимита`;
  return `${used}/${max}`;
}

export function PlanUsageBadge({ compact }: { compact?: boolean }) {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/plan-usage", { headers });
        if (!res.ok) return;
        const json = await res.json();
        setUsage(json.data);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!usage) return null;

  const elig = formatLimit(usage.used.eligibilityChecks, usage.limits.eligibilityChecks);
  const ai = formatLimit(usage.used.aiProposals, usage.limits.aiProposals);

  if (compact) {
    return (
      <Link
        href="/dashboard/subscription"
        className="hidden sm:block text-[10px] font-medium text-gray-500 hover:text-funding-green truncate max-w-[140px]"
        title={`${usage.planName}: проверки ${elig}, AI ${ai}`}
      >
        {usage.planName}: {elig} проверок
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/subscription"
      className="block rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs hover:border-funding-green/30 transition-colors"
    >
      <p className="font-semibold text-funding-black">{usage.planName}</p>
      <p className="text-gray-500 mt-0.5">
        Проверки: {elig} · AI: {ai}
      </p>
    </Link>
  );
}

export function PlanLimitUpgrade({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="mb-2">{message}</p>
      <Link href="/dashboard/subscription" className="font-semibold text-funding-green underline">
        Обновить тариф →
      </Link>
    </div>
  );
}
