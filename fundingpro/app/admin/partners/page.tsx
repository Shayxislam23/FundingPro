"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { getAuthHeaders } from "@/lib/client-auth";

type PartnerKey = {
  id: string;
  keyPrefix: string;
  environment: string;
  status: string;
  expiresAt: number | null;
  lastUsedAt: number | null;
};

type Partner = {
  id: string;
  partnerCode: string;
  name: string;
  status: "active" | "suspended" | "terminated";
  environment: "production" | "sandbox";
  allowedDomains: string[];
  allowedIps: string[];
  monthlyRequestLimit: number;
  requestsPerMinute: number;
  pilotEndsAt: number | null;
  plan: string;
  commissionPercentage: number;
  keys: PartnerKey[];
};

type Lead = {
  id: string;
  partnerCode: string;
  grantTitle: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  organizationName: string | null;
  region: string | null;
  message: string | null;
  status: string;
  contactCount: number;
  firstContactAt: number;
  paymentReceived: boolean;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  isTest: boolean;
};

type Commission = {
  id: string;
  leadId: string;
  clientPaymentAmount: number;
  currency: string;
  commissionPercentage: number;
  commissionAmount: number;
  status: string;
  createdAt: number;
};

type Report = Record<string, unknown> & { top_grants?: Array<{ grant_id: string; title: string | null; views: number }> };

const LEAD_STATUSES: Record<string, string> = {
  new: "Новый",
  contacted: "Связались",
  qualified: "Квалифицирован",
  proposal_sent: "КП отправлено",
  paid: "Оплачено",
  rejected: "Отказ",
  closed: "Закрыт",
  duplicate: "Дубликат",
};

const TABS = [
  { id: "partners", label: "Партнёры" },
  { id: "leads", label: "Лиды" },
  { id: "report", label: "Отчёт" },
  { id: "commissions", label: "Комиссии" },
  { id: "grants", label: "Публикация грантов" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const fmtDate = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString("ru-RU") : "—");

async function adminFetch(path: string, init?: RequestInit) {
  const headers = await getAuthHeaders();
  const res = await fetch(path, {
    ...init,
    headers: { ...headers, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return json.data;
}

function post(body: Record<string, unknown>) {
  return adminFetch("/api/v1/admin/partners", { method: "POST", body: JSON.stringify(body) });
}

export default function AdminPartnersPage() {
  const [tab, setTab] = useState<Tab>("partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPartners = useCallback(
    () =>
      run(async () => {
        const data = await adminFetch("/api/v1/admin/partners?view=partners");
        setPartners(data.partners);
        if (!selectedPartner && data.partners[0]) setSelectedPartner(data.partners[0].id);
      }),
    [run, selectedPartner]
  );

  const loadTab = useCallback(() => {
    const q = selectedPartner ? `&partnerId=${encodeURIComponent(selectedPartner)}` : "";
    if (tab === "partners") return loadPartners();
    if (tab === "leads")
      return run(async () => setLeads((await adminFetch(`/api/v1/admin/partners?view=leads${q}`)).leads));
    if (tab === "commissions")
      return run(async () =>
        setCommissions((await adminFetch(`/api/v1/admin/partners?view=commissions${q}`)).commissions)
      );
    if (tab === "report" && selectedPartner)
      return run(async () =>
        setReport((await adminFetch(`/api/v1/admin/partners?view=report${q}&period=${period}`)).report)
      );
    return undefined;
  }, [tab, selectedPartner, period, run, loadPartners]);

  useEffect(() => {
    void loadPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadTab();
  }, [loadTab]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Partner API</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Партнёры и лиды</h1>
          <p className="text-sm text-gray-400 mt-1">
            Ключи, лимиты, лиды с партнёрских платформ, отчёты и комиссии. Коммерческие данные видны только здесь.
          </p>
        </div>
        <button
          onClick={() => void loadTab()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              tab === t.id
                ? "bg-funding-light-green border-funding-green/40 text-funding-green"
                : "bg-white border-gray-200 text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab !== "partners" && tab !== "grants" && (
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="ml-auto px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
          >
            <option value="">Все партнёры</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.partnerCode} ({p.environment})
              </option>
            ))}
          </select>
        )}
      </div>

      {message && <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{message}</div>}
      {newKey && (
        <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm px-4 py-3">
          <b>Новый API-ключ (показывается один раз — сохраните и передайте партнёру по защищённому каналу):</b>
          <pre className="mt-2 break-all whitespace-pre-wrap font-mono text-xs">{newKey}</pre>
          <button className="mt-2 text-xs underline" onClick={() => setNewKey(null)}>
            Я сохранил ключ
          </button>
        </div>
      )}

      {tab === "partners" && (
        <PartnersTab partners={partners} run={run} reload={loadPartners} onKey={setNewKey} />
      )}
      {tab === "leads" && <LeadsTab leads={leads} run={run} reload={loadTab} />}
      {tab === "commissions" && <CommissionsTab rows={commissions} run={run} reload={loadTab} />}
      {tab === "report" && (
        <div>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mb-4 px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
          />
          {!selectedPartner ? (
            <p className="text-sm text-gray-400">Выберите партнёра.</p>
          ) : report ? (
            <ReportView report={report} />
          ) : null}
        </div>
      )}
      {tab === "grants" && <GrantPublishTab run={run} />}
    </div>
  );
}

function PartnersTab({
  partners,
  run,
  reload,
  onKey,
}: {
  partners: Partner[];
  run: (fn: () => Promise<void>) => Promise<void>;
  reload: () => Promise<void>;
  onKey: (key: string) => void;
}) {
  const [form, setForm] = useState({
    partnerCode: "jizzakh_business_platform",
    name: "",
    environment: "production",
    allowedDomains: "",
    allowedIps: "",
  });

  const create = () =>
    run(async () => {
      await post({
        action: "create_partner",
        partnerCode: form.partnerCode,
        name: form.name,
        environment: form.environment,
        allowedDomains: form.allowedDomains.split(",").map((s) => s.trim()).filter(Boolean),
        allowedIps: form.allowedIps.split(",").map((s) => s.trim()).filter(Boolean),
      });
      await reload();
    });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="font-bold text-sm mb-3">Новый партнёр (пилот: 30 дней, 5 000 запросов/мес, 60/мин, 10%)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="px-2 py-1.5 border rounded-lg text-sm" placeholder="partner_code" value={form.partnerCode} onChange={(e) => setForm({ ...form, partnerCode: e.target.value })} />
          <input className="px-2 py-1.5 border rounded-lg text-sm" placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="px-2 py-1.5 border rounded-lg text-sm" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
            <option value="production">production</option>
            <option value="sandbox">sandbox</option>
          </select>
          <input className="px-2 py-1.5 border rounded-lg text-sm md:col-span-2" placeholder="Разрешённые домены (https://partner.uz, …) — пусто = только сервер-сервер" value={form.allowedDomains} onChange={(e) => setForm({ ...form, allowedDomains: e.target.value })} />
          <input className="px-2 py-1.5 border rounded-lg text-sm" placeholder="IP сервера партнёра (опц.)" value={form.allowedIps} onChange={(e) => setForm({ ...form, allowedIps: e.target.value })} />
        </div>
        <button onClick={() => void create()} className="mt-3 px-3 py-1.5 rounded-xl bg-funding-green text-white text-xs font-semibold">
          Создать
        </button>
      </div>

      {partners.map((p) => (
        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <b className="text-funding-black">{p.name}</b>
            <code className="text-xs text-gray-500">{p.partnerCode}</code>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{p.environment}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {p.status}
            </span>
            <span className="text-xs text-gray-400">
              {p.requestsPerMinute}/мин · {p.monthlyRequestLimit}/мес · пилот до {fmtDate(p.pilotEndsAt)} · комиссия {p.commissionPercentage}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Домены: {p.allowedDomains.join(", ") || "— (только сервер-сервер)"} · IP: {p.allowedIps.join(", ") || "любой"}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              className="px-3 py-1 rounded-lg border text-xs"
              onClick={() =>
                void run(async () => {
                  const data = await post({ action: "issue_key", partnerId: p.id, environment: p.environment });
                  onKey(data.apiKey);
                  await reload();
                })
              }
            >
              Выпустить ключ
            </button>
            <button
              className="px-3 py-1 rounded-lg border text-xs"
              onClick={() =>
                void run(async () => {
                  await post({
                    action: "update_partner",
                    partnerId: p.id,
                    status: p.status === "active" ? "suspended" : "active",
                  });
                  await reload();
                })
              }
            >
              {p.status === "active" ? "Приостановить" : "Активировать"}
            </button>
          </div>
          {p.keys.length > 0 && (
            <table className="w-full mt-3 text-xs">
              <tbody>
                {p.keys.map((k) => (
                  <tr key={k.id} className="border-t border-gray-50">
                    <td className="py-1 font-mono">{k.keyPrefix}…</td>
                    <td>{k.status}</td>
                    <td>до {fmtDate(k.expiresAt)}</td>
                    <td>использован {fmtDate(k.lastUsedAt)}</td>
                    <td className="text-right">
                      {k.status === "active" && (
                        <button
                          className="text-red-600 underline"
                          onClick={() =>
                            void run(async () => {
                              if (!window.confirm("Отозвать ключ? Партнёр сразу потеряет доступ.")) return;
                              await post({ action: "revoke_key", keyId: k.id, reason: "revoked in admin" });
                              await reload();
                            })
                          }
                        >
                          Отозвать
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

function LeadsTab({
  leads,
  run,
  reload,
}: {
  leads: Lead[];
  run: (fn: () => Promise<void>) => Promise<void>;
  reload: () => Promise<void> | undefined;
}) {
  if (leads.length === 0) return <p className="text-sm text-gray-400 py-8 text-center">Лидов пока нет.</p>;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 uppercase">
            {["Дата", "Партнёр", "Клиент", "Контакты", "Грант", "Статус", "Оплата"].map((h) => (
              <th key={h} className="px-3 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-gray-50 align-top">
              <td className="px-3 py-2 text-xs">{fmtDate(l.firstContactAt)}{l.contactCount > 1 ? ` (×${l.contactCount})` : ""}</td>
              <td className="px-3 py-2 text-xs">{l.partnerCode}</td>
              <td className="px-3 py-2">
                <div className="font-semibold">{l.fullName}</div>
                <div className="text-xs text-gray-400">{[l.organizationName, l.region].filter(Boolean).join(" · ")}</div>
                {l.message && <div className="text-xs text-gray-500 mt-1 max-w-xs">{l.message}</div>}
              </td>
              <td className="px-3 py-2 text-xs">{[l.phone, l.email].filter(Boolean).join(", ")}</td>
              <td className="px-3 py-2 text-xs max-w-[200px]">{l.grantTitle}</td>
              <td className="px-3 py-2">
                <select
                  value={l.status}
                  disabled={l.status === "paid"}
                  className="px-2 py-1 rounded-lg border text-xs"
                  onChange={(e) =>
                    void run(async () => {
                      await post({ action: "update_lead", leadId: l.id, status: e.target.value });
                      await reload();
                    })
                  }
                >
                  {Object.entries(LEAD_STATUSES).map(([k, v]) => (
                    <option key={k} value={k} disabled={k === "paid"}>
                      {v}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 text-xs">
                {l.paymentReceived ? (
                  `${l.paymentAmount?.toLocaleString("ru-RU")} ${l.paymentCurrency}`
                ) : (
                  <button
                    className="underline"
                    onClick={() =>
                      void run(async () => {
                        const raw = window.prompt("Фактически полученная сумма (например 10000000 UZS):", "");
                        if (!raw) return;
                        const [amount, currency = "UZS"] = raw.trim().split(/\s+/);
                        await post({ action: "record_payment", leadId: l.id, amount: Number(amount), currency });
                        await reload();
                      })
                    }
                  >
                    Отметить оплату
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommissionsTab({
  rows,
  run,
  reload,
}: {
  rows: Commission[];
  run: (fn: () => Promise<void>) => Promise<void>;
  reload: () => Promise<void> | undefined;
}) {
  if (rows.length === 0) return <p className="text-sm text-gray-400 py-8 text-center">Комиссий нет — они появляются только после фактической оплаты клиента.</p>;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-t border-gray-50">
              <td className="px-3 py-2 text-xs">{fmtDate(c.createdAt)}</td>
              <td className="px-3 py-2 text-xs font-mono">{c.leadId}</td>
              <td className="px-3 py-2 text-xs">
                {c.clientPaymentAmount.toLocaleString("ru-RU")} {c.currency} × {c.commissionPercentage}%
              </td>
              <td className="px-3 py-2 font-semibold">
                {c.commissionAmount.toLocaleString("ru-RU")} {c.currency}
              </td>
              <td className="px-3 py-2">
                <select
                  value={c.status}
                  className="px-2 py-1 rounded-lg border text-xs"
                  onChange={(e) =>
                    void run(async () => {
                      await post({ action: "update_commission", commissionId: c.id, status: e.target.value });
                      await reload();
                    })
                  }
                >
                  {["pending", "approved", "paid", "cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportView({ report }: { report: Report }) {
  const rows: Array<[string, string]> = [
    ["API-запросы", "api_requests"],
    ["Просмотры грантов", "grant_views"],
    ["Уникальные просмотры", "unique_grant_views"],
    ["Переходы на официальный источник", "official_source_clicks"],
    ["Нажатия «Консультация»", "consultation_clicks"],
    ["Отправлено лидов", "leads_submitted"],
    ["Квалифицированные лиды", "qualified_leads"],
    ["Оплатившие клиенты", "paid_clients"],
  ];
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        {rows.map(([label, key]) => (
          <div key={key} className="flex justify-between py-1 text-sm border-b border-gray-50">
            <span className="text-gray-500">{label}</span>
            <b>{String(report[key] ?? 0)}</b>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="font-bold text-sm mb-2">Популярные гранты</h3>
        {(report.top_grants ?? []).map((g) => (
          <div key={g.grant_id} className="flex justify-between py-1 text-xs">
            <span>{g.title ?? g.grant_id}</span>
            <b>{g.views}</b>
          </div>
        ))}
        <pre className="mt-4 text-[10px] text-gray-400 whitespace-pre-wrap">{JSON.stringify(report, null, 2)}</pre>
      </div>
    </div>
  );
}

function GrantPublishTab({ run }: { run: (fn: () => Promise<void>) => Promise<void> }) {
  const [grantId, setGrantId] = useState("");
  const [regions, setRegions] = useState("All Uzbekistan");
  const [done, setDone] = useState<string | null>(null);
  const id = grantId.trim().replace(/^grant_/, "").split("/").pop() ?? "";

  const act = (body: Record<string, unknown>, label: string) =>
    run(async () => {
      await post({ action: "set_grant_partner_fields", grantId: id, ...body });
      setDone(label);
    });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 max-w-2xl space-y-3">
      <p className="text-sm text-gray-500">
        Партнёры видят только гранты, которые редактор проверил и опубликовал. Перед публикацией сверьте условия и дедлайн
        с официальным источником.
      </p>
      <input className="w-full px-2 py-1.5 border rounded-lg text-sm" placeholder="ID гранта или ссылка /grants/…" value={grantId} onChange={(e) => setGrantId(e.target.value)} />
      <input className="w-full px-2 py-1.5 border rounded-lg text-sm" placeholder="Регионы (Jizzakh, All Uzbekistan)" value={regions} onChange={(e) => setRegions(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-1.5 rounded-xl bg-funding-green text-white text-xs font-semibold"
          disabled={!id}
          onClick={() =>
            void act(
              {
                markVerifiedNow: true,
                partnerVisible: true,
                eligibleRegions: regions.split(",").map((s) => s.trim()).filter(Boolean),
              },
              "Проверено и опубликовано для партнёров"
            )
          }
        >
          Источник проверен → опубликовать
        </button>
        <button className="px-3 py-1.5 rounded-xl border text-xs" disabled={!id} onClick={() => void act({ markVerifiedNow: true }, "Дата проверки обновлена")}>
          Только обновить дату проверки
        </button>
        <button className="px-3 py-1.5 rounded-xl border text-xs" disabled={!id} onClick={() => void act({ partnerVisible: false }, "Снято с публикации")}>
          Снять с публикации
        </button>
        <button className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs" disabled={!id} onClick={() => void act({ partnerVisible: false, verificationStatus: "invalid" }, "Помечено как недостоверное")}>
          Недостоверный
        </button>
      </div>
      {done && <p className="text-sm text-funding-green">{done}</p>}
    </div>
  );
}
