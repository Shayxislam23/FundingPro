"use client";

import { useState, useEffect } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { CheckCircle2, Circle, Search, UserCheck, UserX, Loader2, RefreshCcw } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  user_metadata: Record<string, unknown>;
};

type LabJourneyParticipant = {
  id: string;
  email: string | null;
  fullName: string | null;
  telegramUsername: string | null;
  status: string;
  progressPercent: number;
  profile: boolean;
  interests: boolean;
  cv: boolean;
  linkedin: boolean;
  opportunities10: boolean;
  motivationLetter: boolean;
  applicationSubmitted: boolean;
  certificateEligible: boolean;
  cvReview: "pending_review" | "needs_revision" | "approved" | "rejected";
  motivationReview: "pending_review" | "needs_revision" | "approved" | "rejected";
  proofReview: "pending_review" | "needs_revision" | "approved" | "rejected";
  notes: string | null;
  nextAction: string;
};

type LabEnrollmentRow = {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  telegramUsername: string | null;
  cohortName: string;
  status: "pending_payment" | "manual_review" | "paid" | "failed" | "refunded";
  amountUzs: number;
  manualProofDocumentId: string | null;
  paidAt: string | null;
  reviewedAt: string | null;
  notes: string | null;
};

const STATUS_LABELS: Record<string, string> = {
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

async function getAdminHeaders(): Promise<Record<string, string>> {
  return getAuthHeaders();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [journey, setJourney] = useState<LabJourneyParticipant[]>([]);
  const [enrollments, setEnrollments] = useState<LabEnrollmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [reviewingKey, setReviewingKey] = useState<string | null>(null);
  const [markingEnrollmentId, setMarkingEnrollmentId] = useState<string | null>(null);

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    setDeactivatingId(userId);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setDeactivatingId(null);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const [usersRes, journeyRes, enrollmentsRes] = await Promise.all([
        fetch("/api/v1/admin/users?limit=50", { headers }),
        fetch("/api/v1/admin/lab-journey?limit=50", { headers }),
        fetch("/api/v1/admin/lab-enrollments?limit=100", { headers }),
      ]);
      const data = await usersRes.json();
      const journeyData = await journeyRes.json();
      const enrollmentsData = await enrollmentsRes.json();
      setUsers(data.data?.users ?? []);
      setTotal(data.data?.total ?? 0);
      setJourney(journeyData.data?.participants ?? []);
      setEnrollments(enrollmentsData.data?.enrollments ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const markEnrollment = async (
    enrollmentId: string,
    status: LabEnrollmentRow["status"],
    notes?: string
  ) => {
    setMarkingEnrollmentId(enrollmentId);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/v1/admin/lab-enrollments", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, status, notes }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setMarkingEnrollmentId(null);
    }
  };

  const reviewLabTask = async (
    userId: string,
    taskType: "cv" | "motivation_letter" | "proof_uploaded",
    mentorStatus: "approved" | "needs_revision"
  ) => {
    const key = `${userId}:${taskType}:${mentorStatus}`;
    setReviewingKey(key);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/v1/admin/lab-tasks/review", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          taskType,
          mentorStatus,
          revisionNote: mentorStatus === "needs_revision" ? "Please revise and submit again." : undefined,
        }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setReviewingKey(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "").toLowerCase().includes(q)
    );
  });

  function StatusCell({ ok }: { ok: boolean }) {
    return ok ? (
      <CheckCircle2 className="w-4 h-4 text-funding-green" />
    ) : (
      <Circle className="w-4 h-4 text-gray-300" />
    );
  }

  function ReviewActions({
    userId,
    taskType,
    status,
  }: {
    userId: string;
    taskType: "cv" | "motivation_letter" | "proof_uploaded";
    status: LabJourneyParticipant["cvReview"];
  }) {
    const approved = status === "approved";
    const revision = status === "needs_revision" || status === "rejected";
    return (
      <div className="flex items-center gap-1">
        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
          approved ? "bg-funding-light-green text-funding-green" : revision ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
        }`}>
          {approved ? "Approved" : revision ? "Revision" : "Pending"}
        </span>
        <button
          type="button"
          onClick={() => reviewLabTask(userId, taskType, "approved")}
          disabled={reviewingKey === `${userId}:${taskType}:approved`}
          className="text-[10px] font-semibold text-funding-green hover:underline disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => reviewLabTask(userId, taskType, "needs_revision")}
          disabled={reviewingKey === `${userId}:${taskType}:needs_revision`}
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
          <SectionLabel>Управление</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black">
            Пользователи
            {!loading && <span className="ml-2 text-base font-normal text-gray-400">({total})</span>}
          </h1>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-funding-green hover:text-funding-green transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <SectionLabel>Lab Payments</SectionLabel>
          <h2 className="font-bold text-funding-black">Оплаты курса</h2>
          <p className="text-xs text-gray-500 mt-1">
            Цель первого потока: 34 x 150 000 UZS = 5 100 000 UZS.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 border-b border-gray-100">
          {[
            { label: "Enrollments", value: enrollments.length },
            { label: "Paid", value: enrollments.filter((e) => e.status === "paid").length },
            { label: "Manual review", value: enrollments.filter((e) => e.status === "manual_review").length },
            { label: "Collected", value: `${enrollments.filter((e) => e.status === "paid").reduce((sum, e) => sum + e.amountUzs, 0).toLocaleString("ru-RU")} UZS` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-funding-light-bg p-3">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-lg font-black text-funding-black">{item.value}</p>
            </div>
          ))}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-funding-green" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">Пока нет enrollment/payment records</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Student", "Telegram", "Status", "Amount", "Proof", "Paid at", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e, i) => (
                  <tr
                    key={e.id}
                    style={{ borderBottom: i < enrollments.length - 1 ? "1px solid #f9fafb" : "none" }}
                    className="hover:bg-funding-light-bg transition-colors"
                  >
                    <td className="px-4 py-3 min-w-[180px]">
                      <p className="text-sm font-medium text-funding-black">{e.fullName || e.email || "—"}</p>
                      <p className="text-[10px] text-gray-400">{e.cohortName}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.telegramUsername ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                        e.status === "paid"
                          ? "bg-funding-light-green text-funding-green"
                          : e.status === "manual_review"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{e.amountUzs.toLocaleString("ru-RU")} UZS</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.manualProofDocumentId ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {e.paidAt ? new Date(e.paidAt).toLocaleString("ru-RU") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markEnrollment(e.id, "paid", "Manual payment confirmed")}
                          disabled={markingEnrollmentId === e.id}
                          className="text-xs font-semibold text-funding-green hover:underline disabled:opacity-50"
                        >
                          Mark paid
                        </button>
                        <button
                          type="button"
                          onClick={() => markEnrollment(e.id, "failed", "Payment proof rejected")}
                          disabled={markingEnrollmentId === e.id}
                          className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <SectionLabel>Мой путь</SectionLabel>
          <h2 className="font-bold text-funding-black">Participant journey map</h2>
          <p className="text-xs text-gray-500 mt-1">
            Mentor view for onboarding status, next action, and certificate readiness.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-funding-green" />
          </div>
        ) : journey.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">Journey data is not available yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {[
                    "Full name",
                    "Telegram",
                    "Status",
                    "Profile",
                    "Interests",
                    "CV",
                    "LinkedIn",
                    "10 opps",
                    "Motivation",
                    "Application",
                    "Certificate",
                    "Review",
                    "Next action",
                    "Notes",
                  ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {journey.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: i < journey.length - 1 ? "1px solid #f9fafb" : "none" }}
                    className="hover:bg-funding-light-bg transition-colors"
                  >
                    <td className="px-4 py-3 min-w-[180px]">
                      <p className="text-sm font-medium text-funding-black">{p.fullName || p.email || "—"}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.progressPercent}% complete</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.telegramUsername ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-funding-light-green text-funding-green whitespace-nowrap">
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusCell ok={p.profile} /></td>
                    <td className="px-4 py-3"><StatusCell ok={p.interests} /></td>
                    <td className="px-4 py-3"><StatusCell ok={p.cv} /></td>
                    <td className="px-4 py-3"><StatusCell ok={p.linkedin} /></td>
                    <td className="px-4 py-3"><StatusCell ok={p.opportunities10} /></td>
                    <td className="px-4 py-3"><StatusCell ok={p.motivationLetter} /></td>
                    <td className="px-4 py-3"><StatusCell ok={p.applicationSubmitted} /></td>
                    <td className="px-4 py-3"><StatusCell ok={p.certificateEligible} /></td>
                    <td className="px-4 py-3 min-w-[320px]">
                      <div className="space-y-1">
                        <ReviewActions userId={p.id} taskType="cv" status={p.cvReview} />
                        <ReviewActions userId={p.id} taskType="motivation_letter" status={p.motivationReview} />
                        <ReviewActions userId={p.id} taskType="proof_uploaded" status={p.proofReview} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 min-w-[180px]">{p.nextAction}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 min-w-[160px]">{p.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по email..."
              className="w-full pl-9 pr-4 py-2 bg-funding-light-bg rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">Пользователей нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Пользователь", "Email", "Подтверждён", "Последний вход", "Дата регистрации", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const name = String(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "");
                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f9fafb" : "none" }}
                      className="hover:bg-funding-light-bg transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-funding-green text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {(name || u.email || "?")[0].toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-funding-black truncate max-w-[120px]">
                            {name || <span className="text-gray-400 italic text-xs">—</span>}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[180px]">{u.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className="flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={u.email_confirmed ? { background: "#D9F7DD", color: "#008A2E" } : { background: "#FEF3C7", color: "#D97706" }}
                        >
                          {u.email_confirmed ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {u.email_confirmed ? "Да" : "Нет"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ru-RU") : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-4 py-3">
                        {deactivatingId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-funding-green" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleUserActive(u.id, false)}
                            className="text-xs font-semibold text-red-500 hover:underline"
                          >
                            Деактивировать
                          </button>
                        )}
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
