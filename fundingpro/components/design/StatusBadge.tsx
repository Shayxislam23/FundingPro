"use client";

import { cn } from "@/lib/utils";

type Status =
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

const statusConfig: Record<Status, { label: string; className: string }> = {
  saved: { label: "Сохранено", className: "bg-gray-100 text-gray-600" },
  preparing: { label: "Подготовка", className: "bg-blue-50 text-blue-700" },
  drafting: { label: "Черновик", className: "bg-yellow-50 text-yellow-700" },
  ready: { label: "Готово", className: "bg-funding-light-green text-funding-green" },
  submitted: { label: "Подано", className: "bg-green-100 text-green-700" },
  under_review: { label: "На рассмотрении", className: "bg-purple-50 text-purple-700" },
  shortlisted: { label: "Шортлист", className: "bg-funding-light-green text-funding-green" },
  won: { label: "Получен", className: "bg-funding-green text-white" },
  lost: { label: "Не получен", className: "bg-red-50 text-red-600" },
  reporting: { label: "Отчётность", className: "bg-orange-50 text-orange-700" },
  closed: { label: "Закрыт", className: "bg-gray-100 text-gray-500" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
