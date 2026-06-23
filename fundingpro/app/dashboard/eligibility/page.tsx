"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionLabel } from "@/components/design/SectionLabel";
import { CheckCircle2, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";
import { PlanLimitUpgrade } from "@/components/design/PlanUsageBadge";

type Step = "questions" | "loading" | "result";

type EligResult = {
  checkId: string;
  score: number;
  status: string;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
};

const questions = [
  { id: "org_type", question: "Ваша организация зарегистрирована как НКО или юридическое лицо?", options: ["Да, НКО", "Да, ООО/АО", "Нет, физлицо", "В процессе регистрации"] },
  { id: "experience", question: "Есть ли у вас опыт реализации проектов в целевом секторе?", options: ["Более 3 лет", "1–3 года", "Менее 1 года", "Нет опыта"] },
  { id: "budget", question: "Есть ли у вас опыт управления грантовым бюджетом?", options: ["Да, международные гранты", "Да, местные гранты", "Только собственный бюджет", "Нет"] },
  { id: "documents", question: "Готовы ли учредительные документы организации?", options: ["Все документы готовы", "Большинство готово", "Частично готово", "Нет документов"] },
  { id: "partners", question: "Есть ли у вас местные партнёры / рекомендатели?", options: ["Да, несколько", "Один партнёр", "В процессе переговоров", "Нет"] },
];

const statusLabels: Record<string, { label: string; bg: string; color: string }> = {
  ELIGIBLE: { label: "Соответствует", bg: "#D9F7DD", color: "#008A2E" },
  PARTIALLY_ELIGIBLE: { label: "Частично соответствует", bg: "#FEF3C7", color: "#D97706" },
  NOT_ELIGIBLE: { label: "Не соответствует", bg: "#FEE2E2", color: "#DC2626" },
  PENDING: { label: "На проверке", bg: "#F3F4F6", color: "#6B7280" },
};

export default function EligibilityDashboard() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-funding-green" /></div>}>
      <EligibilityContent />
    </Suspense>
  );
}

function EligibilityContent() {
  const searchParams = useSearchParams();
  const grantId = searchParams.get("grantId");
  const [step, setStep] = useState<Step>("questions");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EligResult | null>(null);
  const [error, setError] = useState("");
  const [limitError, setLimitError] = useState("");

  const handleAnswer = async (answer: string) => {
    const q = questions[currentQ];
    const newAnswers = { ...answers, [q.id]: answer };
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 150);
    } else {
      setStep("loading");
      setError("");
      setLimitError("");
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/eligibility/check", {
          method: "POST",
          headers,
          body: JSON.stringify({ answers: newAnswers, grantId: grantId ?? undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          const code = data.error?.code as string | undefined;
          const msg = data.error?.message ?? "Ошибка проверки";
          if (code?.startsWith("PLAN_LIMIT")) {
            setLimitError(msg);
          } else {
            setError(msg);
          }
          setStep("questions");
          setCurrentQ(0);
          setAnswers({});
          return;
        }
        setResult(data.data);
        setStep("result");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
        setStep("questions");
        setCurrentQ(0);
        setAnswers({});
      }
    }
  };

  const reset = () => {
    setStep("questions");
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
    setError("");
    setLimitError("");
  };

  const statusInfo = result ? (statusLabels[result.status] ?? statusLabels.PENDING) : null;

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>AI-инструменты</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Проверка соответствия</h1>
        <p className="text-sm text-gray-500 mt-1">AI оценит соответствие вашего профиля требованиям донора</p>
      </div>

      {limitError && (
        <div className="mb-4">
          <PlanLimitUpgrade message={limitError} />
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "loading" && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-funding-green mb-5" />
          <h2 className="text-lg font-bold text-funding-black mb-2">AI анализирует профиль...</h2>
          <p className="text-sm text-gray-400">Сравниваем ваш профиль с требованиями донора</p>
        </div>
      )}

      {step === "result" && result && statusInfo && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Score */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: statusInfo.color }}
              >
                <div className="text-center">
                  <div className="text-3xl font-black" style={{ color: statusInfo.color }}>{result.score}</div>
                  <div className="text-xs text-gray-400">%</div>
                </div>
              </div>
              <div>
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
                  style={{ background: statusInfo.bg, color: statusInfo.color }}
                >
                  <AlertCircle className="w-3 h-3" />
                  {statusInfo.label}
                </div>
                <p className="text-xs text-gray-400">
                  ID проверки: <span className="font-mono">{result.checkId.slice(0, 8)}…</span>
                </p>
              </div>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-funding-black mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-funding-green" />
                  Сильные стороны
                </h3>
                <ul className="space-y-3">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-funding-light-green flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-funding-green" />
                      </span>
                      <span className="text-sm text-gray-600">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {result.gaps.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-funding-black mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Пробелы
                </h3>
                <ul className="space-y-3">
                  {result.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Next steps */}
            {result.nextSteps.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-sm text-funding-black mb-4">Следующие шаги</h3>
                <ul className="space-y-3">
                  {result.nextSteps.map((ns, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white" style={{ background: "#008A2E" }}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-600">{ns}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-funding-green hover:text-funding-green transition-colors">
              <RotateCcw className="w-4 h-4" />
              Новая проверка
            </button>

            <p className="text-xs text-center text-gray-400">
              AI-оценка носит рекомендательный характер и не гарантирует получение гранта
            </p>
          </div>
        </div>
      )}

      {step === "questions" && (
        <div className="max-w-2xl">
          <div className="flex gap-1.5 mb-6">
            {questions.map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all"
                style={{ background: i < currentQ ? "#008A2E" : i === currentQ ? "#12B94F" : "#e5e7eb" }}
              />
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-funding-accent mb-2">
              Вопрос {currentQ + 1} из {questions.length}
            </p>
            <h2 className="text-lg font-bold text-funding-black mb-6">{questions[currentQ].question}</h2>

            <div className="space-y-3">
              {questions[currentQ].options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border text-left text-sm font-medium transition-all hover:border-funding-green hover:bg-funding-light-bg"
                  style={{ borderColor: "#e5e7eb", color: "#4A5A4D" }}
                >
                  {option}
                  <span className="text-gray-300">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
