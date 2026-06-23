import Link from "next/link";
import { Building2, ArrowRight, X } from "lucide-react";

type OrgOnboardingBannerProps = {
  onDismiss?: () => void;
  dismissible?: boolean;
};

export function OrgOnboardingBanner({ onDismiss, dismissible = false }: OrgOnboardingBannerProps) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl p-5 mb-6 border"
      style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "#D9F7DD" }}
      >
        <Building2 className="w-5 h-5" style={{ color: "#008A2E" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-funding-black">Заполните профиль организации</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Профиль нужен для AI-подбора грантов и проверки соответствия требованиям доноров.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: "#008A2E" }}
        >
          Создать профиль <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60"
            aria-label="Скрыть"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
