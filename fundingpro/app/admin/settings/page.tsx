"use client";

import { SectionLabel } from "@/components/design/SectionLabel";
import { Settings, Globe, Shield, Bot, CreditCard } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Система</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Настройки</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-funding-green" />
            <h2 className="font-bold text-sm text-funding-black">Общие</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Платформа", value: "FundingPro v1.0" },
              { label: "Юридическое лицо", value: "Beta Version Solutions ООО" },
              { label: "Номер DGU", value: "61712" },
              { label: "Языки UI", value: "Русский / Узбекский" },
              { label: "Хранение данных", value: "Узбекистан (Hyper App Cloud)" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <span className="text-xs font-semibold text-funding-black">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Config */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-funding-green" />
            <h2 className="font-bold text-sm text-funding-black">AI Gateway</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Провайдер (основной)", value: "OpenAI (заглушка)" },
              { label: "Провайдер (резерв)", value: "Anthropic Claude (заглушка)" },
              { label: "Редакция ПД", value: "Включена" },
              { label: "Версионирование промптов", value: "Включено" },
              { label: "Логирование токенов", value: "Включено" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: value.includes("заглушка") ? "#d97706" : "#008A2E" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            API ключи хранятся в переменных окружения. Не в коде.
          </p>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-funding-green" />
            <h2 className="font-bold text-sm text-funding-black">Безопасность</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Rate limiting", value: "Включён" },
              { label: "CORS", value: "Настроен" },
              { label: "Security headers", value: "Включены" },
              { label: "Request ID middleware", value: "Включён" },
              { label: "Аудит-лог", value: "Активен" },
              { label: "Файлы: публичные URL", value: "Отключены" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <span className="text-xs font-semibold" style={{ color: "#008A2E" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-funding-green" />
            <h2 className="font-bold text-sm text-funding-black">Платёжная система</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Провайдер", value: "Платёжный адаптер" },
              { label: "Хранение карт", value: "Нет (запрещено)" },
              { label: "Активация подписки", value: "Только webhook" },
              { label: "Idempotency keys", value: "Включены" },
              { label: "Webhook подпись", value: "TODO: настроить" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: value.includes("TODO") ? "#ef4444" : "#008A2E" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
