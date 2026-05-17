"use client";

import { useState } from "react";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, RotateCcw } from "lucide-react";

type Step = "questions" | "loading" | "result";

const questions = [
  {
    id: "org_type",
    question: "Ваша организация зарегистрирована как НКО или юридическое лицо?",
    options: ["Да, НКО", "Да, ООО/АО", "Нет, физлицо", "В процессе регистрации"],
  },
  {
    id: "experience",
    question: "Есть ли у вас опыт реализации проектов в целевом секторе?",
    options: ["Более 3 лет", "1–3 года", "Менее 1 года", "Нет опыта"],
  },
  {
    id: "budget",
    question: "Есть ли у вас опыт управления грантовым бюджетом?",
    options: ["Да, международные гранты", "Да, местные гранты", "Только собственный бюджет", "Нет"],
  },
  {
    id: "documents",
    question: "Готовы ли учредительные документы организации?",
    options: ["Все документы готовы", "Большинство готово", "Частично готово", "Нет документов"],
  },
];

const mockResult = {
  score: 74,
  status: "partially",
  summary: "Организация частично соответствует требованиям донора. Рекомендуется усилить документальное подтверждение опыта.",
  strengths: [
    "Опыт реализации проектов в секторе",
    "Наличие зарегистрированной организации",
  ],
  gaps: [
    "Недостаточно опыта управления международными грантами",
    "Неполный пакет документов",
  ],
  nextSteps: [
    "Подготовить годовые отчёты за 2–3 года",
    "Собрать рекомендательные письма от партнёров",
    "Обратиться к консультанту для pre-application review",
  ],
};

export default function EligibilityPage() {
  const [step, setStep] = useState<Step>("questions");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = (answer: string) => {
    const q = questions[currentQ];
    const newAnswers = { ...answers, [q.id]: answer };
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 150);
    } else {
      setStep("loading");
      setTimeout(() => setStep("result"), 2200);
    }
  };

  const reset = () => {
    setStep("questions");
    setCurrentQ(0);
    setAnswers({});
  };

  if (step === "loading") {
    return (
      <ZoomradShell variant="dark" title="Проверка" showBack>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
          <div
            className="w-14 h-14 rounded-full border-2 border-t-transparent animate-spin mb-6"
            style={{ borderColor: "#008A2E", borderTopColor: "transparent" }}
          />
          <h2 className="text-lg font-bold text-white mb-2">AI анализирует профиль</h2>
          <p className="text-sm text-center" style={{ color: "#A7B8AA" }}>
            Сравниваем ваш профиль с требованиями донора...
          </p>
        </div>
      </ZoomradShell>
    );
  }

  if (step === "result") {
    const statusColor =
      mockResult.status === "eligible"
        ? "#008A2E"
        : mockResult.status === "partially"
        ? "#d97706"
        : "#ef4444";

    return (
      <ZoomradShell variant="light" title="Результат" showBack>
        <div className="px-5 py-5 pb-10">
          {/* Score */}
          <div className="text-center mb-6 py-6 rounded-2xl border" style={{ background: "#F7FAF7", borderColor: "#e5e7eb" }}>
            <div className="text-5xl font-black mb-1" style={{ color: statusColor }}>
              {mockResult.score}%
            </div>
            <div className="text-sm font-semibold" style={{ color: statusColor }}>
              Частично соответствует
            </div>
            <p className="text-xs mt-3 px-6 leading-relaxed" style={{ color: "#4A5A4D" }}>
              {mockResult.summary}
            </p>
          </div>

          {/* Strengths */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-funding-black mb-2">Сильные стороны</h3>
            <ul className="space-y-2">
              {mockResult.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#008A2E" }} />
                  <span className="text-sm" style={{ color: "#4A5A4D" }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Gaps */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-funding-black mb-2">Пробелы</h3>
            <ul className="space-y-2">
              {mockResult.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#d97706" }} />
                  <span className="text-sm" style={{ color: "#4A5A4D" }}>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next steps */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-funding-black mb-2">Следующие шаги</h3>
            <ul className="space-y-2">
              {mockResult.nextSteps.map((ns, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                    style={{ background: "#008A2E" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm" style={{ color: "#4A5A4D" }}>{ns}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium"
              style={{ borderColor: "#e5e7eb", color: "#4A5A4D" }}
            >
              <RotateCcw className="w-4 h-4" />
              Повторить
            </button>
            <button
              className="flex-1 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: "#008A2E" }}
            >
              Создать AI-предложение
            </button>
          </div>

          <p className="text-xs text-center mt-6" style={{ color: "#9ca3af" }}>
            AI-оценка носит рекомендательный характер и не гарантирует получение гранта
          </p>
        </div>
      </ZoomradShell>
    );
  }

  // Questions
  const q = questions[currentQ];
  return (
    <ZoomradShell variant="dark" title="Соответствие" showBack>
      <div className="px-5 pt-6 pb-8">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {questions.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ background: i < currentQ ? "#008A2E" : i === currentQ ? "#12B94F" : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#12B94F" }}>
          Вопрос {currentQ + 1} из {questions.length}
        </p>
        <h2 className="text-xl font-bold text-white mb-6">{q.question}</h2>

        <div className="space-y-3">
          {q.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-sm font-medium text-white">{option}</span>
              <ChevronRight className="w-4 h-4" style={{ color: "#A7B8AA" }} />
            </button>
          ))}
        </div>
      </div>
    </ZoomradShell>
  );
}
