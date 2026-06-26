export type ApplicationStatus =
  | "saved"
  | "preparing"
  | "drafting"
  | "ready"
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "won"
  | "lost"
  | "reporting"
  | "closed";

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  saved: "Сохранено",
  preparing: "Подготовка",
  drafting: "Черновик",
  ready: "Готово",
  submitted: "Подана",
  under_review: "На рассмотрении",
  shortlisted: "Шортлист",
  won: "Получено",
  lost: "Отклонено",
  reporting: "Отчётность",
  closed: "Закрыто",
};

export const APPLICATION_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  saved: { bg: "#F3F4F6", color: "#6B7280" },
  preparing: { bg: "#FEF3C7", color: "#D97706" },
  drafting: { bg: "#ECFDF5", color: "#047857" },
  ready: { bg: "#D9F7DD", color: "#008A2E" },
  submitted: { bg: "#D9F7DD", color: "#008A2E" },
  under_review: { bg: "#FEF3C7", color: "#B45309" },
  shortlisted: { bg: "#FDE68A", color: "#92400E" },
  won: { bg: "#D9F7DD", color: "#008A2E" },
  lost: { bg: "#FEE2E2", color: "#DC2626" },
  reporting: { bg: "#ECFDF5", color: "#047857" },
  closed: { bg: "#F3F4F6", color: "#6B7280" },
};

export const NEXT_STATUSES: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  saved: ["preparing"],
  preparing: ["drafting"],
  drafting: ["ready"],
  ready: ["submitted"],
  submitted: ["under_review"],
  under_review: ["shortlisted", "lost"],
  shortlisted: ["won", "lost"],
  won: ["reporting"],
  reporting: ["closed"],
};

export function normalizeApplicationStatus(status: string): ApplicationStatus {
  return status.toLowerCase() as ApplicationStatus;
}

export function getStatusStyle(status: string) {
  return APPLICATION_STATUS_COLORS[normalizeApplicationStatus(status)] ?? {
    bg: "#F3F4F6",
    color: "#6B7280",
  };
}

export function getStatusLabel(status: string) {
  return APPLICATION_STATUS_LABELS[normalizeApplicationStatus(status)] ?? status;
}
