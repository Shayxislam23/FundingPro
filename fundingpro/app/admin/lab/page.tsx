"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Check, GraduationCap, Loader2, Minus, RefreshCcw, X } from "lucide-react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { getAuthHeaders } from "@/lib/client-auth";
import type { LabStep } from "@/lib/db/lab";

type ParticipantRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  telegram: string | null;
  mentorStatus: string | null;
  mentorNotes: string | null;
  attendanceOk: boolean;
  steps: LabStep[];
  progressPercent: number;
  certificateEligible: boolean;
  nextAction: string;
  updatedAt: string;
};

const PARTICIPANT_STATUSES = [
  "New applicant",
  "Registered",
  "Onboarding incomplete",
  "Active participant",
  "Needs reminder",
  "Strong participant",
  "Application submitted",
  "Completed",
  "Dropped",
];

/** Journey columns shown as compact per-step marks. */
const STEP_COLUMNS: { id: string; label: string }[] = [
  { id: "profile", label: "Профиль" },
  { id: "interests", label: "Интересы" },
  { id: "cv", label: "CV" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "opportunities", label: "10 возм." },
  { id: "motivation", label: "Письмо" },
  { id: "application", label: "Заявка" },
];

function StepMark({ step }: { step: LabStep | undefined }) {
  if (step?.done) return <Check className="w-4 h-4 text-funding-green mx-auto" />;
  if (step?.state === "needs_revision") return <RefreshCcw className="w-3.5 h-3.5 text-amber-500 mx-auto" />;
  if (step?.state === "in_progress") return <Minus className="w-4 h-4 text-amber-400 mx-auto" />;
  return <X className="w-3.5 h-3.5 text-gray-300 mx-auto" />;
}

export default function AdminLabPage() {
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/lab/participants", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Ошибка загрузки");
      setRows(json.data?.participants ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const patchParticipant = async (id: string, payload: Record<string, unknown>) => {
    setSavingId(id);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/v1/admin/lab/participants/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Ошибка сохранения");
      await fetchRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Opportunities Lab</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-funding-green" />
            Путь участников
            {!loading && <span className="ml-1 text-base font-normal text-gray-400">({rows.length})</span>}
          </h1>
        </div>
        <button
          onClick={fetchRows}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Участников пока нет. Они появятся после первого сохранения Lab-профиля.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Участник</th>
                <th className="text-left px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Статус</th>
                {STEP_COLUMNS.map((c) => (
                  <th key={c.id} className="px-1 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">
                    {c.label}
                  </th>
                ))}
                <th className="px-2 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Посещ.</th>
                <th className="px-2 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Серт.</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">След. действие / заметки</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const byId = new Map(row.steps.map((s) => [s.id, s]));
                return (
                  <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? "1px solid #f9fafb" : "none" }} className="hover:bg-funding-light-bg align-top">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-funding-black">{row.fullName ?? "Без имени"}</p>
                      <p className="text-xs text-gray-400">{row.telegram ?? row.email ?? "—"}</p>
                      <p className="text-[10px] text-funding-green font-semibold mt-1">{row.progressPercent}%</p>
                    </td>
                    <td className="px-2 py-3">
                      <select
                        value={row.mentorStatus ?? ""}
                        disabled={savingId === row.id}
                        onChange={(e) => patchParticipant(row.id, { mentorStatus: e.target.value })}
                        className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs max-w-[140px]"
                      >
                        <option value="" disabled>Статус…</option>
                        {PARTICIPANT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    {STEP_COLUMNS.map((c) => (
                      <td key={c.id} className="px-1 py-3 text-center">
                        <StepMark step={byId.get(c.id)} />
                      </td>
                    ))}
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.attendanceOk}
                        disabled={savingId === row.id}
                        onChange={(e) => patchParticipant(row.id, { attendanceOk: e.target.checked })}
                        title="Посещаемость ≥70% (ручная отметка)"
                      />
                    </td>
                    <td className="px-2 py-3 text-center">
                      <Award className={`w-4 h-4 mx-auto ${row.certificateEligible ? "text-funding-green" : "text-gray-200"}`} />
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-amber-700 mb-1.5">{row.nextAction}</p>
                      <div className="flex gap-1.5">
                        <input
                          value={notesDraft[row.id] ?? row.mentorNotes ?? ""}
                          onChange={(e) => setNotesDraft({ ...notesDraft, [row.id]: e.target.value })}
                          placeholder="Заметки ментора…"
                          className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs min-w-[140px]"
                        />
                        <button
                          onClick={() => patchParticipant(row.id, { mentorNotes: notesDraft[row.id] ?? "" })}
                          disabled={savingId === row.id || notesDraft[row.id] === undefined}
                          className="px-2 py-1.5 rounded-lg border border-funding-green/40 text-xs font-semibold text-funding-green hover:bg-funding-light-green disabled:opacity-40"
                        >
                          {savingId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
