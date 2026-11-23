import Link from "next/link";
import { ArrowRight, Briefcase, GraduationCap, Search } from "lucide-react";
import { withLang, type Locale } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";

type Props = {
  locale?: Locale;
  /** "dark" for dark sections, "light" for white sections. */
  tone?: "light" | "dark";
};

export function ServiceOffers({ locale = "ru", tone = "light" }: Props) {
  const items = getPublicDict(locale).offers.items;
  const dark = tone === "dark";
  const offers = [
    { key: "catalog", icon: Search, href: withLang("/grants", locale), highlighted: false, ...items.catalog },
    { key: "lab", icon: GraduationCap, href: "/dashboard/lab/start", highlighted: true, ...items.lab },
    { key: "business", icon: Briefcase, href: withLang("/business", locale), highlighted: false, ...items.business },
  ];
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {offers.map(({ key, icon: Icon, title, price, who, points, cta, href, highlighted }) => (
        <div
          key={key}
          className={`rounded-2xl border p-6 flex flex-col ${
            highlighted
              ? "bg-funding-green border-funding-green text-white"
              : dark
                ? "border-white/10 text-white"
                : "bg-white border-gray-100 text-funding-black"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-5 h-5 shrink-0" />
            <span className={`text-xs font-semibold uppercase tracking-wide ${highlighted ? "text-white/80" : "text-funding-green"}`}>
              {who}
            </span>
          </div>
          <h3 className="text-xl font-black mb-1">{title}</h3>
          <p className={`text-2xl font-black mb-4 ${highlighted ? "" : "text-funding-green"}`}>{price}</p>
          <ul className={`space-y-2 text-sm mb-6 flex-1 ${highlighted ? "text-white/90" : dark ? "text-[#A7B8AA]" : "text-gray-600"}`}>
            {points.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
          <Link
            href={href}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              highlighted ? "bg-white text-funding-green" : "bg-funding-green text-white hover:bg-funding-accent"
            }`}
          >
            {cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}
