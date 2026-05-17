"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Sparkles, Copy, RefreshCcw, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

const SECTION_KEYS: Record<string, string> = {
  summary: "Резюме проекта",
  problem: "Постановка проблемы",
  goal: "Цель и задачи",
  activities: "Деятельность и план",
  results: "Ожидаемые результаты и KPI",
  budget: "Бюджетное обоснование",
  logframe: "Логфрейм",
  risks: "Управление рисками",
  sustainability: "Устойчивость проекта",
};

const sectionKeys = Object.keys(SECTION_KEYS);
const defaultSelected = sectionKeys.slice(0, 4);

const donorFormats = ["UNDP", "EU", "GIZ", "World Bank", "USAID", "Aga Khan"];

type ProposalResult = {
  proposalId: string;
  sections: Record<string, string>;
  isDraft: boolean;
  disclaimer: string;
  isMockAi: boolean;
  aiProvider: string;
};

export default function AIWriterDashboard() {
  const [step, setStep] = useState<"form" | "generating" | "output">("form");
  const [projectIdea, setProjectIdea] = useState("");
  const [donorFormat, setDonorFormat] = useState("UNDP");
  const [selectedSections, setSelectedSections] = useState<string[]>(defaultSelected);
  const [result, setResult] = useState<ProposalResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const toggleSection = (s: string) =>
    setSelectedSections((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const generate = async () => {
    setStep("generating");
    setError("");
    try {
      const res = await fetch("/api/v1/ai/proposal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectIdea,
          donorFormat,
          sections: selectedSections,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка генерации");
      setResult(data.data);
      setActiveSection(selectedSections[0] ?? "");
      setStep("output");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setStep("form");
    }
  };

  const copyAll = async () => {
    if (!result) return;
    const text = Object.entries(result.sections)
      .map(([k, v]) => `## ${SECTION_KEYS[k] ?? k}\n\n${v}`)
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentContent = result?.sections[activeSection] ?? "";

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>AI-инструменты</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">AI Генератор предложений</h1>
        <p className="text-sm text-gray-500 mt-1">
          Создайте черновик заявки в формате UNDP, EU, GIZ или World Bank
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-14 h-14 animate-spin text-funding-green mb-6" />
          <h2 className="text-lg font-bold text-funding-black mb-2">AI создаёт предложение...</h2>
          <p className="text-sm text-gray-400">Формат: {donorFormat} · {selectedSections.length} разделов</p>
          <p className="text-xs text-gray-300 mt-2">Персональные данные не передаются AI-провайдеру</p>
        </div>
      )}

      {step === "output" && result && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-funding-green">
                    Формат: {donorFormat}
                    {result.isMockAi && (
                      <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">
                        DEMO
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Черновик · ID: <span className="font-mono">{result.proposalId.slice(0, 8)}…</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("form")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 border border-gray-200"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    Новый
                  </button>
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-600"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3 text-funding-green" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Скопировано" : "Копировать"}
                  </button>
                </div>
              </div>

              {/* Section tabs */}
              <div className="flex gap-1 overflow-x-auto px-5 pt-4 pb-0 border-b border-gray-100">
                {selectedSections.map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveSection(k)}
                    className="flex-shrink-0 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px"
                    style={
                      activeSection === k
                        ? { color: "#008A2E", borderColor: "#008A2E", background: "rgba(0,138,46,0.04)" }
                        : { color: "#9ca3af", borderColor: "transparent" }
                    }
                  >
                    {SECTION_KEYS[k] ?? k}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed text-sm min-h-48">
                  {currentContent || <span className="text-gray-400 italic">Раздел пуст</span>}
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
                {result.disclaimer}
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
                {sectionKeys.map((k) => (
                  <button
                    key={k}
                    onClick={() => toggleSection(k)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm transition-all"
                    style={{
                      background: selectedSections.includes(k) ? "rgba(0,138,46,0.06)" : "#F7FAF7",
                      borderColor: selectedSections.includes(k) ? "#008A2E" : "#e5e7eb",
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{
                        background: selectedSections.includes(k) ? "#008A2E" : "#e5e7eb",
                        color: selectedSections.includes(k) ? "#fff" : "#9ca3af",
                      }}
                    >
                      {selectedSections.includes(k) ? "✓" : ""}
                    </span>
                    <span className="font-medium" style={{ color: selectedSections.includes(k) ? "#008A2E" : "#4A5A4D" }}>
                      {SECTION_KEYS[k]}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Максимум 5 разделов за раз</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Donor format */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Формат донора
              </label>
              <div className="space-y-2">
                {donorFormats.map((f) => (
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
              Персональные данные, ПИНФЛ, паспортные данные, реквизиты организации — не передаются внешним AI-провайдерам.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
