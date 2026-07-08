"use client";

import Link from "next/link";
import { ArrowRight, Award, CheckCircle2, Circle, Clock3, FileWarning, Send } from "lucide-react";
import type { OnboardingProgressState, OnboardingStepId, OnboardingStatus } from "@/lib/db/onboarding";

const STEPS: {
  id: OnboardingStepId;
  label: string;
  hint: string;
  href: string;
}[] = [
  { id: "registration", label: "Регистрация", hint: "Аккаунт активен.", href: "/dashboard" },
  { id: "profile", label: "Заполнить профиль", hint: "Укажите имя, город и контакты.", href: "/dashboard/lab" },
  { id: "interests", label: "Выбрать интересы", hint: "Отметьте, какие возможности вам интересны.", href: "/dashboard/lab" },
  { id: "cv", label: "Добавить CV", hint: "Загрузите резюме или отметьте, что нужна помощь.", href: "/dashboard/documents" },
  { id: "linkedin", label: "Добавить LinkedIn", hint: "Ссылка на профиль усилит заявку.", href: "/dashboard/lab" },
  { id: "opportunities_10", label: "Выбрать 10 возможностей", hint: "Подберите 10 грантов или программ под себя.", href: "/dashboard/grants" },
  { id: "motivation_letter", label: "Мотивационное письмо", hint: "Загрузите мотивационное письмо.", href: "/dashboard/documents" },
  { id: "chosen_opportunity", label: "Выбрать 1 реальную возможность", hint: "Определитесь с одной заявкой для подачи.", href: "/dashboard/tracker" },
  { id: "application_submitted", label: "Подать заявку", hint: "Подайте минимум одну реальную заявку.", href: "/dashboard/tracker" },
  { id: "proof_uploaded", label: "Загрузить подтверждение", hint: "Загрузите proof подачи заявки.", href: "/dashboard/documents" },
];

const STATE_LABELS: Record<OnboardingProgressState, string> = {
  not_started: "Не начато",
  in_progress: "В процессе",
  submitted: "Отправлено",
  needs_revision: "Нужна доработка",
  completed: "Завершено",
};

function stateStyle(state: OnboardingProgressState) {
  if (state === "completed") return "bg-funding-light-green text-funding-green";
  if (state === "submitted") return "bg-blue-50 text-blue-600";
  if (state === "needs_revision") return "bg-amber-50 text-amber-700";
  if (state === "in_progress") return "bg-gray-100 text-gray-600";
  return "bg-gray-50 text-gray-400";
}

function StepIcon({ state }: { state: OnboardingProgressState }) {
  if (state === "completed") return <CheckCircle2 className="w-5 h-5 text-funding-green flex-shrink-0" />;
  if (state === "submitted") return <Send className="w-5 h-5 text-blue-500 flex-shrink-0" />;
  if (state === "needs_revision") return <FileWarning className="w-5 h-5 text-amber-600 flex-shrink-0" />;
  if (state === "in_progress") return <Clock3 className="w-5 h-5 text-gray-500 flex-shrink-0" />;
  return <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />;
}

type OnboardingChecklistProps = OnboardingStatus;

export function OnboardingChecklist({
  steps,
  stepStates,
  completedCount,
  totalSteps,
  progressPercent,
  certificateEligible,
  attendancePercent,
  nextAction,
}: OnboardingChecklistProps) {
  const requiredForCertificate = [
    { label: "Профиль заполнен", done: steps.profile },
    { label: "CV одобрен ментором", done: steps.cv },
    { label: "Мотивационное письмо одобрено", done: steps.motivation_letter },
    { label: "LinkedIn добавлен", done: steps.linkedin },
    { label: "10 возможностей одобрены", done: steps.opportunities_10 },
    { label: "Выбрана реальная возможность", done: steps.chosen_opportunity },
    { label: "Proof заявки одобрен", done: steps.proof_uploaded },
    {
      label: "Посещаемость от 70%",
      done: attendancePercent === null || attendancePercent >= 70,
      optional: attendancePercent === null,
    },
  ];

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5 mb-6">
      <div className="rounded-2xl border border-funding-green/20 bg-funding-light-green/35 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-funding-black">Мой путь к заявке</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {completedCount}/{totalSteps} завершено · {nextAction.hint}
            </p>
          </div>
          <div className="text-xs font-bold text-funding-green bg-white px-2.5 py-1 rounded-full border border-funding-green/20 w-fit">
            {progressPercent}%
          </div>
        </div>

        <div className="h-2 bg-white rounded-full overflow-hidden mb-4">
          <div className="h-full bg-funding-green rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          {STEPS.map((step) => {
            const state = stepStates[step.id];
            const done = steps[step.id];
            return (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  done
                    ? "bg-white/70 border-gray-100"
                    : "bg-white border-funding-green/25 hover:border-funding-green/50"
                }`}
              >
                <StepIcon state={state} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${done ? "text-gray-500" : "text-funding-black font-medium"}`}>
                    {step.label}
                  </span>
                  <span className="block text-[11px] text-gray-400 leading-snug mt-0.5">{step.hint}</span>
                </span>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${stateStyle(state)}`}>
                  {STATE_LABELS[state]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Следующий шаг</p>
          <h3 className="font-bold text-funding-black">{nextAction.title}</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{nextAction.description}</p>
          <Link
            href={nextAction.href}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#008A2E" }}
          >
            {nextAction.buttonLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Прогресс сертификата</p>
              <p className="font-bold text-funding-black mt-1">
                {certificateEligible ? "Готов к выдаче" : "Пока не готов"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-funding-light-green flex items-center justify-center">
              <Award className="w-5 h-5 text-funding-green" />
            </div>
          </div>
          <div className="space-y-2">
            {requiredForCertificate.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-gray-500">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-funding-green" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300" />
                )}
                <span>
                  {item.label}
                  {item.optional ? " (позже вручную)" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
