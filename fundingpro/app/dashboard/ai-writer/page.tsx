"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Sparkles, FileText, Copy, Download, RefreshCcw, AlertTriangle } from "lucide-react";

const sections = [
  "Резюме проекта",
  "Постановка проблемы",
  "Цель и задачи",
  "Деятельность и план",
  "Ожидаемые результаты и KPI",
  "Бюджетное обоснование",
  "Логфрейм",
  "Управление рисками",
  "Устойчивость проекта",
];

const mockOutput = `## Резюме проекта

Проект «ЭкоБудущее» направлен на восстановление деградированных пастбищных земель в Сурхандарьинской области Узбекистана. В течение 18 месяцев организация планирует охватить 500 фермерских хозяйств, внедрить устойчивые практики землепользования и создать местную систему мониторинга состояния пастбищ.

**Постановка проблемы:** По данным Министерства водного хозяйства Узбекистана, более 40% пастбищных угодий в Сурхандарье деградированы, что приводит к снижению доходов фермерских хозяйств на 30–35% и усилению процессов опустынивания.

**Цель:** Сократить деградацию пастбищ в целевых районах на 25% путём внедрения устойчивых практик управления пастбищами среди 500 фермерских хозяйств.

**Задачи:**
1. Провести обучение 500 фермеров современным методам ротационного выпаса
2. Заложить 10 демонстрационных участков по устойчивому управлению пастбищами
3. Создать систему местного мониторинга на базе мобильного приложения
4. Разработать рекомендации для масштабирования на уровне региона

**Ожидаемые результаты:**
- 500 фермеров прошли обучение (из них 40% женщины)
- 1,200 га восстановленных пастбищ
- 20 местных агентов-мониторинга подготовлены
- Региональные рекомендации переданы в профильный орган

---
*Данный черновик сгенерирован FundingPro AI. Требуется профессиональная редактура перед подачей.*`;

export default function AIWriterDashboard() {
  const [step, setStep] = useState<"form" | "generating" | "output">("form");
  const [projectIdea, setProjectIdea] = useState("");
  const [donorFormat, setDonorFormat] = useState("UNDP");
  const [selectedSections, setSelectedSections] = useState<string[]>(sections.slice(0, 4));

  const toggleSection = (s: string) =>
    setSelectedSections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const generate = () => {
    setStep("generating");
    setTimeout(() => setStep("output"), 3000);
  };

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>AI-инструменты</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">AI Генератор предложений</h1>
        <p className="text-sm text-gray-500 mt-1">
          Создайте черновик заявки в формате UNDP, EU, GIZ или World Bank
        </p>
      </div>

      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative w-16 h-16 mb-6">
            <div
              className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#008A2E", borderTopColor: "transparent" }}
            />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-funding-green" />
          </div>
          <h2 className="text-lg font-bold text-funding-black mb-2">AI создаёт предложение...</h2>
          <p className="text-sm text-gray-400">Формат: {donorFormat} · {selectedSections.length} разделов</p>
          <p className="text-xs text-gray-300 mt-2">Персональные данные не передаются AI-провайдеру</p>
        </div>
      )}

      {step === "output" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-funding-green">Формат: {donorFormat}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Черновик — требует редактирования</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("form")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 border border-gray-200"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    Новый
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-600">
                    <Copy className="w-3 h-3" />
                    Копировать
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "#008A2E" }}>
                    <Download className="w-3 h-3" />
                    Скачать
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed text-sm">
                  {mockOutput}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-800">Важно</p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Это черновик, сгенерированный AI на основе введённых данных. Перед подачей
                необходима профессиональная проверка и редактура. FundingPro не гарантирует
                одобрение заявки донором.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === "form" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Project idea */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Идея проекта *
              </label>
              <textarea
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                placeholder="Опишите проект: цель, сектор, целевая группа, страна реализации, ожидаемые результаты..."
                rows={6}
                className="w-full px-4 py-3 bg-funding-light-bg rounded-xl text-sm text-gray-700 resize-none outline-none focus:ring-2 focus:ring-funding-green/20"
              />
              <p className="text-xs text-gray-400 mt-2">
                Не указывайте личные данные (ФИО, ПИНФЛ, телефон, e-mail)
              </p>
            </div>

            {/* Sections selector */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Разделы предложения
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {sections.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSection(s)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm transition-all"
                    style={{
                      background: selectedSections.includes(s) ? "rgba(0,138,46,0.06)" : "#F7FAF7",
                      borderColor: selectedSections.includes(s) ? "#008A2E" : "#e5e7eb",
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{
                        background: selectedSections.includes(s) ? "#008A2E" : "#e5e7eb",
                        color: selectedSections.includes(s) ? "#fff" : "#9ca3af",
                      }}
                    >
                      {selectedSections.includes(s) ? "✓" : ""}
                    </span>
                    <span className="font-medium" style={{ color: selectedSections.includes(s) ? "#008A2E" : "#4A5A4D" }}>
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Donor format */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Формат донора
              </label>
              <div className="space-y-2">
                {["UNDP", "EU", "GIZ", "World Bank", "USAID", "Aga Khan"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setDonorFormat(f)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all"
                    style={
                      donorFormat === f
                        ? { background: "rgba(0,138,46,0.08)", borderColor: "#008A2E", color: "#008A2E" }
                        : { background: "#F7FAF7", borderColor: "#e5e7eb", color: "#4A5A4D" }
                    }
                  >
                    {f}
                    {donorFormat === f && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!projectIdea.trim() || selectedSections.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-opacity"
              style={{ background: "#008A2E" }}
            >
              <Sparkles className="w-4 h-4" />
              Создать черновик
            </button>

            <div className="bg-funding-light-green rounded-2xl p-4 text-xs text-funding-text-muted-light leading-relaxed">
              <p className="font-semibold mb-1 text-funding-green">Политика конфиденциальности AI</p>
              Персональные данные, ПИНФЛ, паспортные данные, реквизиты организации — не передаются
              внешним AI-провайдерам. Данные хранятся в Узбекистане.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
