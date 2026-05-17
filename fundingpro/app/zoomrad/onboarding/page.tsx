"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { ChevronRight, Building2, User, Globe } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Тип организации",
    question: "Кто вы?",
    options: [
      { value: "ngo", label: "НКО / Некоммерческая организация", icon: Building2 },
      { value: "individual", label: "Физическое лицо / Исследователь", icon: User },
      { value: "business", label: "Бизнес / Компания", icon: Globe },
    ],
  },
  {
    id: 2,
    title: "Сектор",
    question: "Основной сектор деятельности?",
    options: [
      { value: "education", label: "Образование", icon: null },
      { value: "health", label: "Здравоохранение", icon: null },
      { value: "environment", label: "Экология", icon: null },
      { value: "social", label: "Социальная сфера", icon: null },
      { value: "agriculture", label: "Сельское хозяйство", icon: null },
      { value: "digital", label: "Цифровые технологии", icon: null },
    ],
  },
  {
    id: 3,
    title: "Бюджет",
    question: "Целевой размер гранта?",
    options: [
      { value: "small", label: "До $10,000", icon: null },
      { value: "medium", label: "$10,000 – $50,000", icon: null },
      { value: "large", label: "$50,000 – $200,000", icon: null },
      { value: "xlarge", label: "Более $200,000", icon: null },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const current = steps[step];

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);

    if (step < steps.length - 1) {
      setTimeout(() => setStep(step + 1), 180);
    } else {
      router.push("/zoomrad/grants");
    }
  };

  return (
    <ZoomradShell variant="dark" showBack title={`${step + 1} из ${steps.length}`}>
      <div className="px-5 pt-6 pb-8">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? "#008A2E" : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#12B94F" }}>
          {current.title}
        </p>
        <h2 className="text-2xl font-black text-white mb-6">{current.question}</h2>

        <div className="space-y-3">
          {current.options.map(({ value, label, icon: Icon }) => {
            const selected = answers[current.id] === value;
            return (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-150"
                style={{
                  background: selected ? "rgba(0,138,46,0.15)" : "rgba(255,255,255,0.02)",
                  borderColor: selected ? "#008A2E" : "rgba(255,255,255,0.08)",
                }}
              >
                {Icon && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,138,46,0.2)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#12B94F" }} />
                  </div>
                )}
                <span
                  className="text-sm font-medium flex-1"
                  style={{ color: selected ? "#12B94F" : "#fff" }}
                >
                  {label}
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#A7B8AA" }} />
              </button>
            );
          })}
        </div>

        <p className="text-xs text-center mt-8" style={{ color: "rgba(167,184,170,0.5)" }}>
          Ответы помогут AI подобрать гранты по вашему профилю
        </p>
      </div>
    </ZoomradShell>
  );
}
