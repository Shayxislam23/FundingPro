"use client";

import { useState } from "react";
import { trackPmfSurvey, type PmfSurveyAnswer } from "@/lib/analytics";

const OPTIONS: { value: PmfSurveyAnswer; label: string }[] = [
  { value: "very_disappointed", label: "Очень расстроюсь" },
  { value: "somewhat_disappointed", label: "Немного расстроюсь" },
  { value: "not_disappointed", label: "Не расстроюсь" },
];

interface PmfSurveyProps {
  onDismiss?: () => void;
}

export function PmfSurvey({ onDismiss }: PmfSurveyProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSelect(answer: PmfSurveyAnswer) {
    trackPmfSurvey(answer);
    setSubmitted(true);
    onDismiss?.();
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-funding-green/20 bg-funding-light-green/40 p-5 mb-6">
        <p className="text-sm font-semibold text-funding-black">Спасибо за ответ!</p>
        <p className="text-xs text-gray-500 mt-1">Ваш отзыв помогает улучшать платформу.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Опрос PMF</p>
      <h3 className="font-bold text-funding-black text-sm sm:text-base">
        Насколько вы расстроитесь, если больше не сможете пользоваться FundingPro Lab?
      </h3>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className="flex-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 text-gray-700 hover:border-funding-green/40 hover:bg-funding-light-green/40 transition-colors"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Sean Ellis PMF survey — alias for roadmap / analytics naming. */
export { PmfSurvey as SeanEllisSurvey };
