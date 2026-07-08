"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { getAuthHeaders } from "@/lib/client-auth";
import {
  Award,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Save,
  Upload,
} from "lucide-react";

type MentorReviewStatus = "pending_review" | "needs_revision" | "approved" | "rejected";

type LabParticipantStatus =
  | "new_applicant"
  | "registered"
  | "onboarding_incomplete"
  | "active_participant"
  | "needs_reminder"
  | "strong_participant"
  | "application_submitted"
  | "completed"
  | "dropped";

type LabParticipant = {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  telegramUsername: string | null;
  cityOrDistrict: string | null;
  educationStatus: string | null;
  interests: string[];
  selectedOpportunityCount: number;
  attendancePercent: number | null;
  participantStatus: LabParticipantStatus;
  mentorNotes: string | null;
  progressPercent: number;
  certificateEligible: boolean;
  cvReview: MentorReviewStatus;
  motivationReview: MentorReviewStatus;
  proofReview: MentorReviewStatus;
  nextAction: string;
  updatedAt: string;
};

type LabEnrollment = {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  telegramUsername: string | null;
  cohortName: string;
  status: "pending_payment" | "manual_review" | "paid" | "failed" | "refunded";
  amountUzs: number;
};

type LabSummary = {
  total: number;
  returnedCount: number;
  limit: number;
  scope: "visible_window";
  isPossiblyPartial: boolean;
  certificateReady: number;
  needsMentorReview: number;
  needsReminder: number;
};

type LabCohortStats = {
  cohortId: string;
  cohortName: string;
  cohortSlug: string;
  totalEnrollments: number;
  paidEnrollments: number;
  manualReviewEnrollments: number;
  pendingPaymentEnrollments: number;
  failedEnrollments: number;
  refundedEnrollments: number;
  totalParticipants: number;
  certificateReady: number;
  needsMentorReview: number;
  needsReminder: number;
  collectedUzs: number;
  computedAt: string;
};

type Draft = {
  participantStatus: LabParticipantStatus;
  attendancePercent: string;
  mentorNotes: string;
};

const PARTICIPANT_STATUSES: LabParticipantStatus[] = [
  "new_applicant",
  "registered",
  "onboarding_incomplete",
  "active_participant",
  "needs_reminder",
  "strong_participant",
  "application_submitted",
  "completed",
  "dropped",
];

const STATUS_LABELS: Record<LabParticipantStatus, string> = {
  new_applicant: "New applicant",
  registered: "Registered",
  onboarding_incomplete: "Onboarding incomplete",
  active_participant: "Active participant",
  needs_reminder: "Needs reminder",
  strong_participant: "Strong participant",
  application_submitted: "Application submitted",
  completed: "Completed",
  dropped: "Dropped",
};

function reviewLabel(status: MentorReviewStatus) {
  if (status === "approved") return "Approved";
  if (status === "needs_revision") return "Revision";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function ReviewPill({ status }: { status: MentorReviewStatus }) {
  const className =
    status === "approved"
      ? "bg-funding-light-green text-funding-green"
      : status === "needs_revision" || status === "rejected"
        ? "bg-amber-50 text-amber-700"
        : "bg-gray-100 text-gray-500";
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${className}`}>
      {reviewLabel(status)}
    </span>
  );
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="w-4 h-4 text-funding-green" />
  ) : (
    <Circle className="w-4 h-4 text-gray-300" />
  );
}

async function readJson<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Request failed");
  return json.data as T;
}

export default function AdminLabPage() {
  const [participants, setParticipants] = useState<LabParticipant[]>([]);
  const [enrollments, setEnrollments] = useState<LabEnrollment[]>([]);
  const [summary, setSummary] = useState<LabSummary | null>(null);
  const [cohortStats, setCohortStats] = useState<LabCohortStats | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [reviewingKey, setReviewingKey] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const [participantsRes, enrollmentsRes] = await Promise.all([
        fetch("/api/v1/admin/lab-participants?limit=200", { headers }),
        fetch("/api/v1/admin/lab-enrollments?limit=200", { headers }),
      ]);
      const participantsData = await readJson<{
        participants: LabParticipant[];
        summary: LabSummary;
        cohortStats: LabCohortStats | null;
      }>(participantsRes);
      const enrollmentsData = await readJson<{ enrollments: LabEnrollment[] }>(enrollmentsRes);
      setParticipants(participantsData.participants);
      setSummary(participantsData.summary);
      setCohortStats(participantsData.cohortStats);
      setEnrollments(enrollmentsData.enrollments);
      setDrafts(Object.fromEntries(participantsData.participants.map((p) => [
        p.userId,
        {
          participantStatus: p.participantStatus,
          attendancePercent: p.attendancePercent === null ? "" : String(p.attendancePercent),
          mentorNotes: p.mentorNotes ?? "",
        },
      ])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Lab data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reviewQueue = useMemo(() => participants.filter((p) =>
    p.cvReview === "pending_review" ||
    p.motivationReview === "pending_review" ||
    p.proofReview === "pending_review" ||
    p.cvReview === "needs_revision" ||
    p.motivationReview === "needs_revision" ||
    p.proofReview === "needs_revision"
  ), [participants]);

  const certificateReady = useMemo(
    () => participants.filter((p) => p.certificateEligible),
    [participants]
  );

  const paidCount = enrollments.filter((row) => row.status === "paid").length;
  const collected = enrollments
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + row.amountUzs, 0);

  const updateDraft = (userId: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({
      ...current,
      [userId]: { ...current[userId], ...patch },
    }));
  };

  const saveParticipant = async (participant: LabParticipant) => {
    const draft = drafts[participant.userId];
    if (!draft) return;

    setSavingKey(participant.userId);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const attendance = draft.attendancePercent.trim() ? Number(draft.attendancePercent) : undefined;
      const res = await fetch("/api/v1/admin/lab-participants", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: participant.userId,
          participantStatus: draft.participantStatus,
          attendancePercent: Number.isFinite(attendance) ? attendance : undefined,
          mentorNotes: draft.mentorNotes,
        }),
      });
      await readJson(res);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save participant");
    } finally {
      setSavingKey(null);
    }
  };

  const reviewTask = async (
    participant: LabParticipant,
    taskType: "cv" | "motivation_letter" | "proof_uploaded",
    mentorStatus: "approved" | "needs_revision"
  ) => {
    const key = `${participant.userId}:${taskType}:${mentorStatus}`;
    setReviewingKey(key);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/lab-tasks/review", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: participant.userId,
          taskType,
          mentorStatus,
          revisionNote: mentorStatus === "needs_revision" ? "Please revise and submit again." : undefined,
        }),
      });
      await readJson(res);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review task");
    } finally {
      setReviewingKey(null);
    }
  };

  const importParticipants = async () => {
    setImporting(true);
    setImportResult("");
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/lab-participants", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText }),
      });
      const result = await readJson<{
        imported: number;
        updated: number;
        created: number;
        unmatched: { rowNumber: number; email: string | null; fullName: string | null; reason: string }[];
      }>(res);
      setImportResult(
        `Imported ${result.imported}: ${result.created} created, ${result.updated} updated, ${result.unmatched.length} unmatched.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const refreshCohortStats = async () => {
    setRefreshingStats(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/admin/lab-participants?action=recompute-stats", {
        method: "POST",
        headers,
      });
      const result = await readJson<{ cohortStats: LabCohortStats }>(res);
      setCohortStats(result.cohortStats);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh cohort stats");
    } finally {
      setRefreshingStats(false);
    }
  };

  function ReviewActions({ participant, taskType, status }: {
    participant: LabParticipant;
    taskType: "cv" | "motivation_letter" | "proof_uploaded";
    status: MentorReviewStatus;
  }) {
    return (
      <div className="flex items-center gap-2">
        <ReviewPill status={status} />
        <button
          type="button"
          onClick={() => reviewTask(participant, taskType, "approved")}
          disabled={reviewingKey === `${participant.userId}:${taskType}:approved`}
          className="text-[10px] font-semibold text-funding-green hover:underline disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => reviewTask(participant, taskType, "needs_revision")}
          disabled={reviewingKey === `${participant.userId}:${taskType}:needs_revision`}
          className="text-[10px] font-semibold text-amber-700 hover:underline disabled:opacity-50"
        >
          Revise
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <SectionLabel>Мой путь</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">Program operations</h1>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Visible participants", value: summary?.returnedCount ?? participants.length, icon: ClipboardCheck },
          { label: "Paid enrollments", value: paidCount, icon: CheckCircle2 },
          { label: "Collected", value: `${collected.toLocaleString("ru-RU")} UZS`, icon: Upload },
          { label: "Visible mentor queue", value: summary?.needsMentorReview ?? reviewQueue.length, icon: FileSpreadsheet },
          { label: "Visible certificate ready", value: summary?.certificateReady ?? certificateReady.length, icon: Award },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <item.icon className="w-4 h-4 text-funding-green mb-3" />
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-xl font-black text-funding-black">{item.value}</p>
          </div>
        ))}
      </div>

      {summary?.isPossiblyPartial && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
          Showing the latest {summary.returnedCount} Lab participants. Summary cards are scoped to this visible window, not the full cohort.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <SectionLabel>Cohort truth</SectionLabel>
            <h2 className="font-bold text-funding-black">
              {cohortStats?.cohortName ?? "Cohort stats not computed yet"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Stored counters across the cohort enrollment set, separate from the visible table window.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshCohortStats}
            disabled={refreshingStats}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
          >
            {refreshingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Refresh stats
          </button>
        </div>

        {cohortStats ? (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-5">
            {[
              ["Enrollments", cohortStats.totalEnrollments],
              ["Paid", cohortStats.paidEnrollments],
              ["Participants", cohortStats.totalParticipants],
              ["Mentor queue", cohortStats.needsMentorReview],
              ["Certificate ready", cohortStats.certificateReady],
              ["Collected", `${cohortStats.collectedUzs.toLocaleString("ru-RU")} UZS`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-funding-light-bg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-400">{label}</p>
                <p className="text-lg font-black text-funding-black mt-1">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-5">
            Press Refresh stats after cohort enrollments exist to compute real cohort counters.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <SectionLabel>Google Forms import</SectionLabel>
          <h2 className="font-bold text-funding-black">Paste latest responses</h2>
          <p className="text-xs text-gray-500 mt-1">
            Accepts CSV/TSV copied from Google Sheets or JSON rows. Rows match existing FundingPro users by email or user id.
          </p>
        </div>
        <div className="p-5">
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            className="w-full min-h-[150px] rounded-xl bg-funding-light-bg border border-gray-100 px-4 py-3 text-sm outline-none focus:border-funding-green"
            placeholder="Email, Full name, Telegram, City, Education, Interests, Attendance %, Status..."
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={importParticipants}
              disabled={importing || !importText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-funding-green text-white text-sm font-semibold disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import responses
            </button>
            {importResult && <p className="text-xs text-gray-500">{importResult}</p>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <SectionLabel>Mentor status</SectionLabel>
            <h2 className="font-bold text-funding-black">Review queue</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-funding-green" /></div>
            ) : reviewQueue.length === 0 ? (
              <div className="p-5 text-sm text-gray-400">No pending mentor reviews.</div>
            ) : reviewQueue.slice(0, 12).map((p) => (
              <div key={p.userId} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-funding-black">{p.fullName || p.email || "Unnamed participant"}</p>
                    <p className="text-xs text-gray-400">{p.telegramUsername ?? p.email ?? p.userId}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{p.progressPercent}%</span>
                </div>
                <div className="space-y-2">
                  <ReviewActions participant={p} taskType="cv" status={p.cvReview} />
                  <ReviewActions participant={p} taskType="motivation_letter" status={p.motivationReview} />
                  <ReviewActions participant={p} taskType="proof_uploaded" status={p.proofReview} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <SectionLabel>Certificate readiness</SectionLabel>
            <h2 className="font-bold text-funding-black">Ready participants</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-funding-green" /></div>
            ) : certificateReady.length === 0 ? (
              <div className="p-5 text-sm text-gray-400">No participants are certificate-ready yet.</div>
            ) : certificateReady.map((p) => (
              <div key={p.userId} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-funding-black">{p.fullName || p.email || "Unnamed participant"}</p>
                  <p className="text-xs text-gray-400">
                    Attendance {p.attendancePercent ?? 0}% · {p.selectedOpportunityCount} opportunities
                  </p>
                </div>
                <Award className="w-5 h-5 text-funding-green flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <SectionLabel>Roster</SectionLabel>
          <h2 className="font-bold text-funding-black">Manage participants</h2>
        </div>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-funding-green" /></div>
        ) : participants.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No Lab participants yet. Import Google Form responses to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Participant", "Progress", "Mentor", "Certificate", "Status", "Attendance", "Notes", ""].map((heading) => (
                    <th key={heading} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p, index) => {
                  const draft = drafts[p.userId];
                  return (
                    <tr
                      key={p.userId}
                      style={{ borderBottom: index < participants.length - 1 ? "1px solid #f9fafb" : "none" }}
                      className="hover:bg-funding-light-bg transition-colors"
                    >
                      <td className="px-4 py-3 min-w-[220px]">
                        <p className="text-sm font-medium text-funding-black">{p.fullName || p.email || "Unnamed participant"}</p>
                        <p className="text-[10px] text-gray-400">{p.telegramUsername ?? "No Telegram"} · {p.cityOrDistrict ?? "No city"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-funding-black">{p.progressPercent}%</td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <div className="flex flex-wrap gap-1.5">
                          <ReviewPill status={p.cvReview} />
                          <ReviewPill status={p.motivationReview} />
                          <ReviewPill status={p.proofReview} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusIcon ok={p.certificateEligible} /></td>
                      <td className="px-4 py-3">
                        <select
                          value={draft?.participantStatus ?? p.participantStatus}
                          onChange={(event) => updateDraft(p.userId, { participantStatus: event.target.value as LabParticipantStatus })}
                          className="min-w-[170px] rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-xs outline-none"
                        >
                          {PARTICIPANT_STATUSES.map((status) => (
                            <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={draft?.attendancePercent ?? ""}
                          onChange={(event) => updateDraft(p.userId, { attendancePercent: event.target.value })}
                          className="w-20 rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-xs outline-none"
                          placeholder="0"
                          inputMode="numeric"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={draft?.mentorNotes ?? ""}
                          onChange={(event) => updateDraft(p.userId, { mentorNotes: event.target.value })}
                          className="min-w-[220px] rounded-lg bg-white border border-gray-200 px-2 py-1.5 text-xs outline-none"
                          placeholder={p.nextAction}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => saveParticipant(p)}
                          disabled={savingKey === p.userId}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-funding-green hover:underline disabled:opacity-50"
                        >
                          {savingKey === p.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
