import Link from "next/link";
import { COMPANY, getCompanyFooter } from "@/lib/company-info";
import { cn } from "@/lib/utils";

type LegalFooterProps = {
  className?: string;
  style?: React.CSSProperties;
  variant?: "dark" | "light";
};

const LEGAL_LINKS = [
  { href: "/legal/offer", label: "Оферта" },
  { href: "/legal/privacy", label: "Конфиденциальность" },
  { href: "/legal/refunds", label: "Возвраты" },
  { href: "/legal/ai", label: "AI" },
] as const;

export function LegalFooter({ className, style, variant = "light" }: LegalFooterProps) {
  const linkClass =
    variant === "dark"
      ? "text-green-200/80 hover:text-white underline-offset-2 hover:underline"
      : "text-funding-green hover:underline";

  return (
    <footer className={cn("px-4 text-center text-xs space-y-2", className)} style={style}>
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {LEGAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={linkClass}>
            {label}
          </Link>
        ))}
      </nav>
      <p className={cn("mx-auto max-w-3xl leading-relaxed", variant === "dark" ? "text-white/40" : "text-gray-500")}>
        {getCompanyFooter()} · {COMPANY.email}
      </p>
      <p className={cn("text-[10px] max-w-xl mx-auto leading-relaxed", variant === "dark" ? "text-white/30" : "text-gray-400")}>
        {COMPANY.legalNameRu} / {COMPANY.legalNameUz} · {COMPANY.addressUz}
      </p>
    </footer>
  );
}
