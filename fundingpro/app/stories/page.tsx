import type { Metadata } from "next";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { SectionLabel } from "@/components/design/SectionLabel";
import { ArrowRight, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Истории успеха",
  description:
    "Пилотные кейсы бизнеса и молодёжи, использующих FundingPro для поиска грантов, стипендий и конкурсов в Узбекистане.",
  alternates: { canonical: "/stories" },
};

const PILOT_STORIES = [
  {
    org: "Дилноза К.",
    sector: "Образование",
    city: "Ташкент",
    summary:
      "Студентка бакалавриата использовала AI-подбор для стипендий и обменных программ ЕС. Платформа сократила поиск с двух недель до двух дней.",
    outcome: "Пилот · 3 программы в shortlist",
    status: "pilot" as const,
  },
  {
    org: "Жавохир М.",
    sector: "Социальные проекты",
    city: "Нукус",
    summary:
      "Выпускник проверил соответствие гранту ПРООН до подачи. AI указал на пробелы в CV и мотивационном письме.",
    outcome: "Пилот · eligibility score 76%",
    status: "pilot" as const,
  },
  {
    org: "Нилуфар А.",
    sector: "Международные программы",
    city: "Самарканд",
    summary:
      "Специалист подготовила черновик мотивационного письма для программы GIZ с помощью AI Writer за 15 минут.",
    outcome: "Пилот · черновик за 15 минут",
    status: "pilot" as const,
  },
];

export default function StoriesPage() {
  return (
    <div className="min-h-screen bg-funding-light-bg flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/">
            <FundingProLogo variant="light" size="sm" />
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#008A2E" }}
          >
            Начать <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-10 flex-1">
        <SectionLabel className="text-funding-green">Пилот</SectionLabel>
        <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-3">
          Истории участников пилота
        </h1>
        <p className="text-sm text-gray-500 mb-10 max-w-2xl">
          Реальные участники пилота FundingPro в Узбекистане. Полные кейсы
          публикуются по мере завершения грантовых циклов.
        </p>

        <div className="space-y-6">
          {PILOT_STORIES.map((story) => (
            <article
              key={story.org}
              className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#D9F7DD" }}
                >
                  <User className="w-5 h-5" style={{ color: "#008A2E" }} />
                </div>
                <div>
                  <h2 className="font-bold text-funding-black">{story.org}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {story.sector} · {story.city}
                  </p>
                </div>
                <span className="ml-auto text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                  Пилот
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{story.summary}</p>
              <p className="text-xs font-medium text-funding-green">{story.outcome}</p>
            </article>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-10 text-center">
          Хотите поделиться историей? Напишите на{" "}
          <a href="mailto:info@fundingpro.uz" className="text-funding-green hover:underline">
            info@fundingpro.uz
          </a>
        </p>
      </main>

      <div className="text-center py-8 px-6">
        <LegalFooter />
      </div>
    </div>
  );
}
