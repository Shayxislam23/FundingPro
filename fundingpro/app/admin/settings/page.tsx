"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Globe, Shield, Bot, CreditCard, Loader2 } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type CompanyInfo = {
  legalNameRu: string;
  legalNameUz: string;
  stir: string;
  dguNumber: string;
  dguRegisteredAt: string;
  entityRegisteredAt: string;
  founder: string;
  email: string;
  addressUz: string;
};

type Settings = {
  platform: string;
  company?: CompanyInfo;
  aiProvider: string;
  aiProviderConfigured: boolean;
  paymentsEnabled: boolean;
  hasWebhookSecret: boolean;
  hasResendKey: boolean;
  hasConvexUrl: boolean;
  hasClerkKeys: boolean;
  adminEmailsConfigured: boolean;
  nodeEnv: string;
};

function StatusCell({ ok, yes, no }: { ok: boolean; yes?: string; no?: string }) {
  return (
    <span
      className="text-xs font-semibold"
      style={{ color: ok ? "#008A2E" : "#ef4444" }}
    >
      {ok ? (yes ?? "Да") : (no ?? "Не настроено")}
    </span>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/admin/settings", { headers });
        const data = await res.json();
        setSettings(data.data ?? null);
      } catch {
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const s = settings;

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Система</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Настройки</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* General */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-funding-green" />
              <h2 className="font-bold text-sm text-funding-black">Общие</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Платформа", value: s?.platform ?? "FundingPro v1.0", ok: true },
                { label: "Юридическое лицо", value: s?.company?.legalNameRu ?? "—", ok: true },
                { label: "STIR", value: s?.company?.stir ?? "—", ok: true },
                { label: "Номер DGU", value: s?.company?.dguNumber ?? "—", ok: true },
                { label: "Регистрация ПО", value: s?.company?.dguRegisteredAt ?? "—", ok: true },
                { label: "Регистрация юрлица", value: s?.company?.entityRegisteredAt ?? "—", ok: true },
                { label: "Окружение", value: s?.nodeEnv ?? "—", ok: s?.nodeEnv === "production" },
                { label: "Языки UI", value: "Русский / Узбекский", ok: true },
                { label: "Хранение данных", value: "Convex Storage", ok: true },
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
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Провайдер</span>
                <span className="text-xs font-semibold" style={{ color: s?.aiProviderConfigured ? "#008A2E" : "#d97706" }}>
                  {s?.aiProvider ?? "mock"}
                  {!s?.aiProviderConfigured && " (заглушка)"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">AI ключ</span>
                <StatusCell ok={s?.aiProviderConfigured ?? false} yes="Настроен" no="Не настроен" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Convex backend</span>
                <StatusCell ok={s?.hasConvexUrl ?? false} yes="Настроен" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Clerk auth</span>
                <StatusCell ok={s?.hasClerkKeys ?? false} yes="Настроен" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Редакция ПД</span>
                <StatusCell ok={true} yes="Включена" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Email (Resend)</span>
                <StatusCell ok={s?.hasResendKey ?? false} yes="Настроен" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Admin emails</span>
                <StatusCell ok={s?.adminEmailsConfigured ?? false} yes="Настроены" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">API ключи хранятся в переменных окружения. Не в коде.</p>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-funding-green" />
              <h2 className="font-bold text-sm text-funding-black">Безопасность</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "AI rate limit (/api/v1/ai/*)", value: "Базовый (in-memory)", ok: true },
                { label: "CORS", value: "Next.js defaults", ok: true },
                { label: "Security headers", value: "Vercel / Next.js", ok: true },
                { label: "Аудит-лог", value: "Активен", ok: true },
                { label: "Файлы: публичные URL", value: "Отключены", ok: true },
                { label: "Admin gate", value: "ADMIN_EMAILS + middleware", ok: s?.adminEmailsConfigured ?? false },
              ].map(({ label, value, ok }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                  <span className="text-xs font-semibold" style={{ color: ok !== false ? "#008A2E" : "#d97706" }}>{value}</span>
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
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Онлайн-оплата</span>
                <StatusCell ok={s?.paymentsEnabled ?? false} yes="Включена" no="Отключена (ручная)" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Хранение карт</span>
                <span className="text-xs font-semibold" style={{ color: "#008A2E" }}>Нет (запрещено)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Webhook подпись</span>
                <StatusCell ok={s?.hasWebhookSecret ?? false} yes="Настроена" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-xs font-medium text-gray-500">Idempotency keys</span>
                <span className="text-xs font-semibold" style={{ color: "#008A2E" }}>Включены</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
