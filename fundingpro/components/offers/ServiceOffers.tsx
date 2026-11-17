import Link from "next/link";
import { ArrowRight, Briefcase, GraduationCap, Search } from "lucide-react";
import { LAB_PRICE_UZS, SUCCESS_FEE_RANGE, formatUzs } from "@/lib/offers";

type Props = {
  /** "dark" for the landing hero area, "light" for white sections. */
  tone?: "light" | "dark";
};

const OFFERS = [
  {
    icon: Search,
    title: "Каталог грантов",
    price: "Бесплатно",
    who: "Для всех",
    points: ["Проверенные гранты с дедлайнами", "Фильтр «для кого»: бизнес, стартап, молодёжь, НКО", "2 проверки соответствия в месяц"],
    cta: "Смотреть гранты",
    href: "/grants",
    highlighted: false,
  },
  {
    icon: GraduationCap,
    title: "«Мой путь»",
    price: formatUzs(LAB_PRICE_UZS),
    who: "Молодёжь и частные лица",
    points: [
      "30 дней с наставником до поданной заявки",
      "CV, мотивационное письмо, подбор 10 возможностей",
      "Сертификат после подтверждённой подачи",
    ],
    cta: "Записаться",
    href: "/dashboard/lab/start",
    highlighted: true,
  },
  {
    icon: Briefcase,
    title: "Заявка под ключ",
    price: "После бесплатной оценки",
    who: "Бизнес, стартапы, НКО",
    points: [
      "Подбираем грант под ваш проект",
      "Готовим заявку и пакет документов",
      `Гонорар за успех ${SUCCESS_FEE_RANGE} — только при выигрыше`,
    ],
    cta: "Оставить заявку",
    href: "/business",
    highlighted: false,
  },
] as const;

export function ServiceOffers({ tone = "light" }: Props) {
  const dark = tone === "dark";
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {OFFERS.map(({ icon: Icon, title, price, who, points, cta, href, highlighted }) => (
        <div
          key={title}
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
