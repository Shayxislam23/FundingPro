"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import type { OnboardingStepId } from "@/lib/db/onboarding";

const STEPS: {
  id: OnboardingStepId;
  label: string;
  href: string;
}[] = [
  { id: "profile", label: "Создать профиль НКО", href: "/dashboard/profile" },
  { id: "documents", label: "Загрузить устав или регистрацию", href: "/dashboard/documents" },
  { id: "saved_grant", label: "Сохранить первый грант", href: "/dashboard/grants" },
  { id: "eligibility", label: "Пройти проверку соответствия", href: "/dashboard/eligibility" },
  { id: "ai_proposal", label: "Сгенерировать AI-черновик", href: "/dashboard/ai-writer" },
];

type OnboardingChecklistProps = {
  steps: Record<OnboardingStepId, boolean>;
  completedCount: number;
  totalSteps: number;
};

export function OnboardingChecklist({ steps, completedCount, totalSteps }: OnboardingChecklistProps) {
  if (completedCount === totalSteps) return null;

  const nextStep = STEPS.find((s) => !steps[s.id]);

  return (
    <div className="rounded-2xl border border-funding-green/20 bg-funding-light-green/40 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-funding-black">Первые шаги в FundingPro</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {completedCount}/{totalSteps} выполнено
            {nextStep ? ` · далее: ${nextStep.label.toLowerCase()}` : ""}
          </p>
        </div>
        <div className="text-xs font-bold text-funding-green bg-white px-2.5 py-1 rounded-full border border-funding-green/20">
          {Math.round((completedCount / totalSteps) * 100)}%
        </div>
      </div>
      <div className="space-y-2">
        {STEPS.map((step) => {
          const done = steps[step.id];
          return (
            <Link
              key={step.id}
              href={step.href}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                done
                  ? "bg-white/60 border-gray-100 opacity-70"
                  : "bg-white border-funding-green/30 hover:border-funding-green/50"
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-funding-green flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
              )}
              <span
                className={`text-sm flex-1 ${done ? "text-gray-500 line-through" : "text-funding-black font-medium"}`}
              >
                {step.label}
              </span>
              {!done && <ChevronRight className="w-4 h-4 text-gray-400" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
