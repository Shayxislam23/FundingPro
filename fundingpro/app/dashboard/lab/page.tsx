"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { PmfSurvey } from "@/components/design/PmfSurvey";
import { hasCompletedPmfSurvey, trackEvent } from "@/lib/analytics";
import { getAuthHeaders } from "@/lib/client-auth";
import type { LabProfile, LabTaskReview, LabTaskType, OnboardingProgressState, OnboardingStatus } from "@/lib/db/onboarding";
import type { LabAccess, LabOpportunityApplication, LabSubmissionMethod } from "@/lib/db/lab";

const INTERESTS = [
  { value: "grants", label: "Гранты" },
  { value: "scholarships", label: "Стипендии" },
  { value: "forums", label: "Форумы" },
  { value: "competitions", label: "Конкурсы" },
  { value: "internships", label: "Стажировки" },
  { value: "volunteering", label: "Волонтёрство" },
  { value: "exchange_programs", label: "Обменные программы" },
  { value: "hackathons", label: "Хакатоны" },
  { value: "startup_programs", label: "Стартап-программы" },
];

const STATUS_OPTIONS: { value: OnboardingProgressState; label: string }[] = [
  { value: "not_started", label: "Не начато" },
  { value: "in_progress", label: "В процессе" },
  { value: "submitted", label: "Отправлено" },
  { value: "needs_revision", label: "Нужна доработка" },
  { value: "completed", label: "Завершено" },
];

const CV_STATUS_OPTIONS = [
  ...STATUS_OPTIONS,
  { value: "help_requested", label: "Нужна помощь с CV" },
] as const;

const REVIEW_TASKS: { taskType: LabTaskType; label: string; hint: string }[] = [
  {
    taskType: "cv",
    label: "Проверка CV",
    hint: "Загрузите CV в «Документы», затем отправьте на проверку ментору.",
  },
  {
    taskType: "motivation_letter",
    label: "Проверка мотивационного письма",
    hint: "Загрузите мотивационное письмо или черновик proposal для обратной связи.",
  },
  {
    taskType: "chosen_opportunity",
    label: "Выбранная возможность",
    hint: "Сообщите ментору, что вы выбрали одну реальную возможность для подачи.",
  },
  {
    taskType: "application_submitted",
    label: "Заявка подана",
    hint: "Отметьте реальную заявку как поданную для подтверждения ментором.",
  },
  {
    taskType: "proof_uploaded",
    label: "Проверка proof заявки",
    hint: "Загрузите proof в «Документы», затем отправьте на одобрение ментора.",
  },
];

const SUBMISSION_METHODS: { value: LabSubmissionMethod; label: string }[] = [
  { value: "google_form", label: "Google Form" },
  { value: "email", label: "Email" },
  { value: "external_portal", label: "Внешний портал" },
  { value: "pdf_upload", label: "PDF / загрузка" },
  { value: "other", label: "Другое" },
];

const EMPTY_PROFILE: LabProfile = {
  fullName: null,
  telegramUsername: null,
  cityOrDistrict: null,
  educationStatus: null,
  interests: [],
  cvStatus: "not_started",
  linkedinUrl: null,
  selectedOpportunityCount: 0,
  motivationLetterStatus: "not_started",
  chosenOpportunityStatus: "not_started",
  applicationProofStatus: "not_started",
  attendancePercent: null,
  participantStatus: null,
  mentorNotes: null,
};

export default function LabOnboardingPage() {
  const [profile, setProfile] = useState<LabProfile>(EMPTY_PROFILE);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [access, setAccess] = useState<LabAccess | null>(null);
  const [applications, setApplications] = useState<LabOpportunityApplication[]>([]);
  const [submittingTask, setSubmittingTask] = useState<LabTaskType | null>(null);
  const [savingApplication, setSavingApplication] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [applicationTitle, setApplicationTitle] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [submissionMethod, setSubmissionMethod] = useState<LabSubmissionMethod>("google_form");
  const [proofDocumentId, setProofDocumentId] = useState("");
  const [showPmfSurvey, setShowPmfSurvey] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const [profileRes, statusRes, accessRes, appsRes] = await Promise.all([
          fetch("/api/v1/onboarding/lab-profile", { headers }),
          fetch("/api/v1/onboarding/status", { headers }),
          fetch("/api/v1/lab/access", { headers }),
          fetch("/api/v1/lab/applications", { headers }),
        ]);
        const data = await profileRes.json();
        const statusData = await statusRes.json();
        const accessData = await accessRes.json();
        const appsData = await appsRes.json();
        setProfile(data.data?.profile ?? EMPTY_PROFILE);
        setOnboardingStatus(statusData.data ?? null);
        setAccess(accessData.data ?? null);
        setApplications(appsData.data?.applications ?? []);
        const status = statusData.data as OnboardingStatus | null;
        if (
          status &&
          !hasCompletedPmfSurvey() &&
          (status.certificateEligible || status.progressPercent >= 70 || status.isComplete)
        ) {
          setShowPmfSurvey(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update<K extends keyof LabProfile>(key: K, value: LabProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInterest(value: string) {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((item) => item !== value)
        : [...prev.interests, value],
    }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/onboarding/lab-profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          fullName: profile.fullName ?? "",
          telegramUsername: profile.telegramUsername ?? "",
          cityOrDistrict: profile.cityOrDistrict ?? "",
          educationStatus: profile.educationStatus ?? "",
          interests: profile.interests,
          cvStatus: profile.cvStatus,
          linkedinUrl: profile.linkedinUrl ?? "",
          selectedOpportunityCount: profile.selectedOpportunityCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Не удалось сохранить Lab profile");
        return;
      }
      setProfile(data.data?.profile ?? profile);
      trackEvent("lab_profile_saved");
      trackEvent("onboarding_step_lab_profile");
      if (profile.interests.length > 0) {
        trackEvent("onboarding_step_lab_interests");
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function submitTask(taskType: LabTaskType) {
    setSubmittingTask(taskType);
    setError("");
    setSaved(false);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/onboarding/tasks", {
        method: "POST",
        headers,
        body: JSON.stringify({ taskType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Не удалось отправить task на проверку");
        return;
      }
      const statusRes = await fetch("/api/v1/onboarding/status", { headers });
      const statusData = await statusRes.json();
      setOnboardingStatus(statusData.data ?? onboardingStatus);
      trackEvent("lab_task_submitted", { task_type: taskType });
      if (taskType === "application_submitted") {
        trackEvent("north_star_application_submitted", { task_type: taskType });
      }
      const updated = statusData.data as OnboardingStatus | null;
      if (updated?.certificateEligible) {
        trackEvent("north_star_certificate_eligible");
      }
      setSaved(true);
    } finally {
      setSubmittingTask(null);
    }
  }

  function reviewFor(taskType: LabTaskType): LabTaskReview | undefined {
    return onboardingStatus?.taskReviews.find((task) => task.taskType === taskType);
  }

  function reviewLabel(task?: LabTaskReview) {
    if (!task) return "Не отправлено";
    if (task.mentorStatus === "approved") return "Одобрено";
    if (task.mentorStatus === "needs_revision") return "Нужна доработка";
    if (task.mentorStatus === "rejected") return "Отклонено";
    return "На проверке";
  }

  async function saveApplication(e: React.FormEvent) {
    e.preventDefault();
    setSavingApplication(true);
    setError("");
    setSaved(false);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/lab/applications", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: applicationTitle,
          opportunityUrl: applicationUrl,
          submissionMethod,
          status: proofDocumentId ? "proof_uploaded" : "planned",
          proofDocumentId: proofDocumentId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Не удалось сохранить external application");
        return;
      }
      const appsRes = await fetch("/api/v1/lab/applications", { headers });
      const appsData = await appsRes.json();
      setApplications(appsData.data?.applications ?? []);
      setApplicationTitle("");
      setApplicationUrl("");
      setProofDocumentId("");
      setSaved(true);
    } finally {
      setSavingApplication(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
      </div>
    );
  }

  if (!access?.hasPaidAccess) {
    const action = access?.nextAction;
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <SectionLabel>Мой путь</SectionLabel>
          <h1 className="text-2xl font-black text-funding-black mt-1">Путь к первой заявке</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Сопровождение ментора: профиль → CV → реальная заявка → подтверждение → сертификат.
            {" "}{action?.description ?? "Доступ открывается после подтверждения оплаты."}
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href={action?.href ?? "/dashboard/lab/checkout"}
              onClick={() => trackEvent("lab_checkout_started", { placement: "lab_gate" })}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#008A2E" }}
            >
              {action?.label ?? "Записаться — 150 000 UZS"}
            </Link>
            <Link href="/dashboard/lab/start" className="px-5 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600">
              Первый урок
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <SectionLabel>Мой путь</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Личный профиль и шаги</h1>
        <p className="text-sm text-gray-500 mt-1">
          Заполните данные для подбора возможностей и сопровождения ментора до реальной заявки.
        </p>
      </div>

      {showPmfSurvey && <PmfSurvey onDismiss={() => setShowPmfSurvey(false)} />}

      <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
        {saved && (
          <p className="text-sm text-funding-green flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Профиль сохранён
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Полное имя">
            <input
              value={profile.fullName ?? ""}
              onChange={(e) => update("fullName", e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
              placeholder="Ваше полное имя"
            />
          </Field>
          <Field label="Telegram">
            <input
              value={profile.telegramUsername ?? ""}
              onChange={(e) => update("telegramUsername", e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
              placeholder="@username"
            />
          </Field>
          <Field label="Город / район">
            <input
              value={profile.cityOrDistrict ?? ""}
              onChange={(e) => update("cityOrDistrict", e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
              placeholder="Nukus, Tashkent, district..."
            />
          </Field>
          <Field label="Статус образования">
            <input
              value={profile.educationStatus ?? ""}
              onChange={(e) => update("educationStatus", e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
              placeholder="Student, graduate, working..."
            />
          </Field>
        </div>

        <Field label="Интересы">
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const checked = profile.interests.includes(interest.value);
              return (
                <button
                  key={interest.value}
                  type="button"
                  onClick={() => toggleInterest(interest.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    checked
                      ? "bg-funding-light-green border-funding-green/30 text-funding-green"
                      : "bg-white border-gray-200 text-gray-500 hover:border-funding-green/30"
                  }`}
                >
                  {interest.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Профиль LinkedIn">
          <input
            value={profile.linkedinUrl ?? ""}
            onChange={(e) => update("linkedinUrl", e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
            placeholder="https://linkedin.com/in/..."
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Статус CV">
            <select
              value={profile.cvStatus}
              onChange={(e) => update("cvStatus", e.target.value as LabProfile["cvStatus"])}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
            >
              {CV_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Выбранные возможности">
            <input
              type="number"
              min={0}
              max={10}
              value={profile.selectedOpportunityCount}
              onChange={(e) => update("selectedOpportunityCount", Number(e.target.value))}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-funding-light-bg p-4">
          <p className="text-sm font-bold text-funding-black">Задачи с проверкой ментора</p>
          <p className="text-xs text-gray-500 mt-1">
            Для сертификата эти задачи засчитываются только после одобрения ментора.
          </p>
          <div className="mt-4 space-y-3">
            {REVIEW_TASKS.map((task) => {
              const review = reviewFor(task.taskType);
              const approved = review?.mentorStatus === "approved";
              return (
                <div key={task.taskType} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-white border border-gray-100 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-funding-black">{task.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{review?.revisionNote ?? task.hint}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      approved
                        ? "bg-funding-light-green text-funding-green"
                        : review?.mentorStatus === "needs_revision" || review?.mentorStatus === "rejected"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                    }`}>
                      {reviewLabel(review)}
                    </span>
                    <button
                      type="button"
                      onClick={() => submitTask(task.taskType)}
                      disabled={submittingTask === task.taskType}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-funding-green/30 text-funding-green disabled:opacity-50"
                    >
                      {submittingTask === task.taskType ? "Отправка..." : "Отправить"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-sm font-bold text-funding-black">Трекер внешних заявок</p>
          <p className="text-xs text-gray-500 mt-1">
            FundingPro помогает подготовить и проверить подачу. Сама заявка отправляется через Google Forms, email или портал гранта.
          </p>

          <form onSubmit={saveApplication} className="mt-4 grid sm:grid-cols-2 gap-3">
            <Field label="Название возможности">
              <input
                value={applicationTitle}
                onChange={(e) => setApplicationTitle(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
                placeholder="Program / scholarship name"
              />
            </Field>
            <Field label="Внешняя ссылка">
              <input
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
                placeholder="https://..."
              />
            </Field>
            <Field label="Способ подачи">
              <select
                value={submissionMethod}
                onChange={(e) => setSubmissionMethod(e.target.value as LabSubmissionMethod)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              >
                {SUBMISSION_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </Field>
            <Field label="ID документа proof">
              <input
                value={proofDocumentId}
                onChange={(e) => setProofDocumentId(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-funding-green/20"
                placeholder="Optional: upload APPLICATION_PROOF first"
              />
            </Field>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingApplication}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#008A2E" }}
              >
                {savingApplication ? "Сохранение..." : "Сохранить внешнюю заявку"}
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-2">
            {applications.length === 0 ? (
              <p className="text-xs text-gray-400">Внешних заявок пока нет.</p>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="rounded-xl border border-gray-100 bg-funding-light-bg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-funding-black">{app.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {app.submissionMethod} · {app.status}
                        {app.opportunityUrl ? ` · ${app.opportunityUrl}` : ""}
                      </p>
                    </div>
                    {app.proofDocumentId && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-funding-light-green text-funding-green">
                        Proof загружен
                      </span>
                    )}
                  </div>
                  {app.mentorNotes && <p className="text-xs text-amber-700 mt-2">{app.mentorNotes}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "#008A2E" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить профиль Lab
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
