"use client";

import { useState } from "react";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { Sparkles, FileText, ChevronRight, Copy, Download } from "lucide-react";

const sections = [
  "Резюме проекта",
  "Постановка проблемы",
  "Цель и задачи",
  "Деятельность и план",
  "Ожидаемые результаты",
  "Бюджетное обоснование",
  "Логфрейм",
  "Управление рисками",
];

const mockOutput = `## Резюме проекта

Проект «ЭкоБудущее» направлен на восстановление деградированных пастбищных земель в Сурхандарьинской области Узбекистана. В течение 18 месяцев организация планирует охватить 500 фермерских хозяйств, внедрить устойчивые практики землепользования и создать местную систему мониторинга состояния пастбищ.

**Проблема:** Деградация 40% пастбищ приводит к снижению доходов фермеров на 35% и усилению опустынивания.

**Подход:** Комбинация обучения, демонстрационных участков и местного мониторинга через мобильное приложение.

**Ожидаемые результаты:**
- 500 фермеров прошли обучение устойчивым практикам
- 1,200 га восстановленных пастбищ
- Снижение деградации на 25% в целевых районах
- Действующая местная сеть мониторинга из 20 активистов`;

export default function AIWriterPage() {
  const [step, setStep] = useState<"form" | "generating" | "output">("form");
  const [projectIdea, setProjectIdea] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>(["Резюме проекта", "Постановка проблемы"]);
  const [donorFormat, setDonorFormat] = useState("UNDP");

  const toggleSection = (s: string) => {
    setSelectedSections((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const generate = () => {
    setStep("generating");
    setTimeout(() => setStep("output"), 3000);
  };

  if (step === "generating") {
    return (
      <ZoomradShell variant="dark" title="AI-предложение" showBack>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-5">
          <div className="relative w-16 h-16 mb-6">
            <div
              className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#008A2E", borderTopColor: "transparent" }}
            />
            <Sparkles
              className="absolute inset-0 m-auto w-6 h-6"
              style={{ color: "#12B94F" }}
            />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">AI создаёт предложение</h2>
          <p className="text-sm text-center" style={{ color: "#A7B8AA" }}>
            Формируем черновик в формате {donorFormat}...
          </p>
          <p className="text-xs mt-4 text-center" style={{ color: "rgba(167,184,170,0.5)" }}>
            Персональные данные не передаются AI-провайдеру
          </p>
        </div>
      </ZoomradShell>
    );
  }

  if (step === "output") {
    return (
      <ZoomradShell variant="light" title="Черновик готов" showBack>
        <div className="pb-24">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold" style={{ color: "#008A2E" }}>Формат: {donorFormat}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Черновик — требует редактирования</p>
            </div>
            <div className="flex gap-2">
              <button
                className="p-2 rounded-lg border"
                style={{ borderColor: "#e5e7eb" }}
              >
                <Copy className="w-4 h-4" style={{ color: "#4A5A4D" }} />
              </button>
              <button
                className="p-2 rounded-lg border"
                style={{ borderColor: "#e5e7eb" }}
              >
                <Download className="w-4 h-4" style={{ color: "#4A5A4D" }} />
              </button>
            </div>
          </div>

          <div className="px-5 py-4">
            <div
              className="p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
              style={{ background: "#F7FAF7", color: "#4A5A4D", fontFamily: "inherit" }}
            >
              {mockOutput}
            </div>

            <div
              className="mt-4 p-4 rounded-2xl border"
              style={{ background: "#FFF8E7", borderColor: "#fbbf24" }}
            >
              <p className="text-xs font-semibold text-amber-700 mb-1">Важно</p>
              <p className="text-xs leading-relaxed text-amber-700">
                Это черновик, сгенерированный AI на основе введённых данных. Необходима профессиональная
                проверка перед подачей. FundingPro не гарантирует одобрение заявки.
              </p>
            </div>
          </div>
        </div>

        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 border-t"
          style={{ background: "#fff", borderColor: "#e5e7eb" }}
        >
          <button
            onClick={() => setStep("form")}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: "#008A2E" }}
          >
            Создать новый черновик
          </button>
        </div>
      </ZoomradShell>
    );
  }

  return (
    <ZoomradShell variant="dark" title="AI-предложение" showBack>
      <div className="px-5 pt-5 pb-10">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit mb-5"
          style={{ borderColor: "rgba(0,138,46,0.4)", color: "#12B94F" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">AI Proposal Generator</span>
        </div>

        <h1 className="text-2xl font-black text-white mb-1">Создать предложение</h1>
        <p className="text-sm mb-6" style={{ color: "#A7B8AA" }}>
          Опишите проект — AI создаст черновик по формату донора
        </p>

        {/* Project idea */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A7B8AA" }}>
            Идея проекта
          </label>
          <textarea
            value={projectIdea}
            onChange={(e) => setProjectIdea(e.target.value)}
            placeholder="Например: Восстановление пастбищ в Сурхандарье с обучением фермеров устойчивым практикам..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          />
          <p className="text-xs mt-1" style={{ color: "rgba(167,184,170,0.5)" }}>
            Не указывайте личные данные, паспорта, ПИНФЛ
          </p>
        </div>

        {/* Donor format */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A7B8AA" }}>
            Формат донора
          </label>
          <div className="flex gap-2 flex-wrap">
            {["UNDP", "EU", "GIZ", "World Bank", "USAID"].map((f) => (
              <button
                key={f}
                onClick={() => setDonorFormat(f)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={
                  donorFormat === f
                    ? { background: "#008A2E", color: "#fff" }
                    : { background: "rgba(255,255,255,0.06)", color: "#A7B8AA", border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A7B8AA" }}>
            Разделы
          </label>
          <div className="space-y-2">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => toggleSection(s)}
                className="w-full flex items-center justify-between p-3 rounded-xl border text-sm text-left"
                style={{
                  background: selectedSections.includes(s) ? "rgba(0,138,46,0.12)" : "rgba(255,255,255,0.02)",
                  borderColor: selectedSections.includes(s) ? "#008A2E" : "rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ color: selectedSections.includes(s) ? "#12B94F" : "#fff" }}>{s}</span>
                {selectedSections.includes(s) && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ background: "#008A2E" }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!projectIdea.trim() || selectedSections.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-40"
          style={{ background: "#008A2E" }}
        >
          <Sparkles className="w-4 h-4" />
          Создать черновик
        </button>
      </div>
    </ZoomradShell>
  );
}
