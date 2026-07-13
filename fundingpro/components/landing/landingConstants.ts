import {
  Search,
  CheckCircle2,
  FileText,
  BarChart3,
  FolderOpen,
  Users,
  type LucideIcon,
} from "lucide-react";

export type LandingPlan = {
  id: string;
  nameRu: string;
  priceUsd: number;
  priceUzs: number;
  features: string[];
  highlighted: boolean;
};

/** Individuals-first featured tiers (legacy slugs; targetType is INDIVIDUAL). */
export const FEATURED_PLAN_IDS = ["plan-ngo-basic", "plan-ngo-pro"];

export const LANDING_FEATURES: {
  icon: LucideIcon;
  title: string;
  desc: string;
}[] = [
  {
    icon: Search,
    title: "Поиск грантов",
    desc: "База международных грантов с фильтрами по сектору, сумме, дедлайну и стране.",
  },
  {
    icon: CheckCircle2,
    title: "Проверка соответствия",
    desc: "AI проверит соответствие требованиям донора и укажет на пробелы в документах.",
  },
  {
    icon: FileText,
    title: "AI-предложение",
    desc: "Подготовьте черновик заявки в структуре UNDP, EU, GIZ или World Bank за минуты.",
  },
  {
    icon: BarChart3,
    title: "Трекер заявок",
    desc: "Отслеживайте статус каждой заявки — от черновика до получения гранта.",
  },
  {
    icon: FolderOpen,
    title: "Документы",
    desc: "Безопасное хранение CV, мотивационных писем и справок для подачи.",
  },
  {
    icon: Users,
    title: "Консультанты",
    desc: "Проверенные эксперты по грантовому письму, стипендиям и отчётности.",
  },
];

export function formatGrantCountLabel(grantTotal: number | null): string {
  if (grantTotal !== null && grantTotal > 0) {
    return grantTotal >= 1000 ? `${Math.floor(grantTotal / 100) * 100}+` : String(grantTotal);
  }
  // While the live total is loading (or unavailable) show a neutral
  // placeholder — never a fabricated count.
  return "—";
}
