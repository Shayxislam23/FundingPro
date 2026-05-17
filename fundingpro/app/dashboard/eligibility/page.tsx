"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { CheckCircle2, AlertCircle, XCircle, RotateCcw } from "lucide-react";

type Step = "questions" | "loading" | "result";

const questions = [
  { id: "org_type", question: "Ваша организация зарегистрирована как НКО или юридическое лицо?", options: ["Да, НКО", "Да, ООО/АО", "Нет, физлицо", "В процессе регистрации"] },
  { id: "experience", question: "Есть ли у вас опыт реализации проектов в целевом секторе?", options: ["Более 3 лет", "1–3 года", "Менее 1 года", "Нет опыта"] },
  { id: "budget", question: "Есть ли у вас опыт управления грантовым бюджетом?", options: ["Да, международные гранты", "Да, местные гранты", "Только собственный бюджет", "Нет"] },
  { id: "documents", question: "Готовы ли учредительные документы организации?", options: ["Все документы готовы", "Большинство готово", "Частично готово", "Нет документов"] },
  { id: "partners", question: "Есть ли у вас местные партнёры / рекомендатели?", options: ["Да, несколько", "Один партнёр", "В процессе переговоров", "Нет"] },
];

const mockResult = {
  score: 74,
  status: "partially",
  summary: "Организация частично соответствует требованиям донора. Основные сильные стороны — опыт работы и наличие регистрации. Рекомендуется усилить документальное подтверждение и сеть партнёров.",
  strengths: ["Опыт реализации проектов в секторе", "Наличие зарегистрированной организации", "Готовность документов"],
  gaps: ["Недостаточно опыта управления международными грантами", "Неполный пакет учредительных документов"],
  nextSteps: ["Подготовить годовые отчёты за 2–3 года", "Собрать рекомендательные письма от партнёров", "Обратиться к консультанту для pre-application review"],
};

export default function EligibilityDashboard() {
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
      setTimeout(() => setStep("result"), 2000);
    }
  };

  const reset = () => { setStep("questions"); setCurrentQ(0); setAnswers({}); };

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>AI-инструменты</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Проверка соответствия</h1>
        <p className="text-sm text-gray-500 mt-1">AI оценит соответствие вашего профиля требованиям донора</p>
      </div>

      {step === "loading" && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-14 h-14 border-2 border-t-transparent rounded-full animate-spin mb-5" style={{ borderColor: "#008A2E", borderTopColor: "transparent" }} />
          <h2 className="text-lg font-bold text-funding-black mb-2">AI анализирует профиль...</h2>
          <p className="text-sm text-gray-400">Сравниваем ваш профиль с требованиями донора</p>
        </div>
      )}

      {step === "result" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Score */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: "#008A2E" }}
              >
                <div className="text-center">
                  <div className="text-3xl font-black text-funding-green">{mockResult.score}</div>
                  <div className="text-xs text-gray-400">%</div>
                </div>
              </div>
              <div>
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
                  style={{ background: "#FEF3C7", color: "#D97706" }}
                >
                  <AlertCircle className="w-3 h-3" />
                  Частично соответствует
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{mockResult.summary}</p>
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-funding-black mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-funding-green" />
                Сильные стороны
              </h3>
              <ul className="space-y-3">
                {mockResult.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-funding-light-green flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-funding-green" />
                    </span>
                    <span className="text-sm text-gray-600">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-funding-black mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Пробелы
              </h3>
              <ul className="space-y-3">
                {mockResult.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            {/* Next steps */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-sm text-funding-black mb-4">Следующие шаги</h3>
              <ul className="space-y-3">
                {mockResult.nextSteps.map((ns, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white" style={{ background: "#008A2E" }}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-600">{ns}</span>
                  </li>
                ))}
              </ul>
            </div>

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
          {/* Progress */}
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
