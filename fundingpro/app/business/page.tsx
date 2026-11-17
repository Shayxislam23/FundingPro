import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { SectionLabel } from "@/components/design/SectionLabel";
import { SUCCESS_FEE_RANGE } from "@/lib/offers";
import { hreflangAlternates, openGraphPage } from "@/lib/seo/site";
import { BusinessRequestForm } from "./BusinessRequestForm";

const title = "Заявка на грант под ключ";
const description =
  "Подберём грант под ваш бизнес, стартап или НКО и подготовим заявку. Бесплатная оценка, гонорар за успех только при выигрыше.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: openGraphPage(title, description, "/business"),
  alternates: hreflangAlternates("/business"),
};

const STEPS = [
  { n: "1", t: "Бесплатная оценка", d: "Созваниваемся, узнаём о проекте и честно говорим, есть ли подходящие гранты." },
  { n: "2", t: "Подбор и предложение", d: "Показываем 1–3 гранта и называем стоимость подготовки заявки." },
  { n: "3", t: "Готовим заявку", d: "Пишем заявку, бюджет и собираем документы по требованиям донора." },
  { n: "4", t: "Подача и сопровождение", d: `Помогаем подать и ответить на вопросы донора. Гонорар за успех ${SUCCESS_FEE_RANGE} — только если грант выигран.` },
];

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-funding-light-bg flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <Link href="/grants" className="inline-flex items-center gap-1 text-sm font-semibold text-funding-green">
            Каталог грантов <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto w-full px-6 py-10 flex-1 grid gap-10 lg:grid-cols-2">
        <section>
          <SectionLabel className="text-funding-green">Для бизнеса, стартапов и НКО</SectionLabel>
          <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-3 break-words">Заявка на грант под ключ</h1>
          <p className="text-gray-600 mb-8">
            Вы занимаетесь делом — мы находим грант и готовим заявку. Первая консультация бесплатная.
          </p>
          <ol className="space-y-4">
            {STEPS.map(({ n, t, d }) => (
              <li key={n} className="flex gap-3">
                <span className="w-8 h-8 shrink-0 rounded-full bg-funding-green text-white text-sm font-black flex items-center justify-center">
                  {n}
                </span>
                <div>
                  <p className="font-bold text-funding-black">{t}</p>
                  <p className="text-sm text-gray-500">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-400 mt-8">
            FundingPro не гарантирует получение гранта. Решение о финансировании принимает донор.
          </p>
        </section>
        <section>
          <BusinessRequestForm />
        </section>
      </main>
      <div className="text-center py-8 px-6">
        <LegalFooter />
      </div>
    </div>
  );
}
