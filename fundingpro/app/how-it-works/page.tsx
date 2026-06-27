import type { Metadata } from "next";
import Link from "next/link";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { LegalFooter } from "@/components/design/LegalFooter";
import { SectionLabel } from "@/components/design/SectionLabel";
import { hreflangAlternates } from "@/lib/seo/site";
import { ArrowRight, ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Как это работает",
  description:
    "Узнайте, как FundingPro помогает найти гранты, проверить соответствие требованиям донора и подготовить заявку с помощью AI.",
  alternates: hreflangAlternates("/how-it-works"),
};

const FAQ_ITEMS = [
  {
    question: "Что такое FundingPro?",
    answer:
      "FundingPro — AI-платформа для поиска международных грантов, проверки соответствия требованиям донора и подготовки заявок. Платформа ориентирована на НКО, предпринимателей и государственные организации в Узбекистане и Центральной Азии.",
  },
  {
    question: "Как найти подходящий грант?",
    answer:
      "Зарегистрируйтесь, заполните профиль организации и воспользуйтесь каталогом грантов с фильтрами по сектору, стране и дедлайну. AI подберёт Top 10 грантов с наибольшим совпадением по вашему профилю.",
  },
  {
    question: "Как работает AI-проверка соответствия?",
    answer:
      "Система анализирует требования донора и профиль вашей организации, указывает на пробелы в документах и даёт рекомендации по улучшению заявки. Персональные данные обрабатываются с соблюдением политики конфиденциальности.",
  },
  {
    question: "Можно ли подготовить заявку с помощью AI?",
    answer:
      "Да. AI Writer генерирует черновик предложения в структуре UNDP, EU, GIZ или World Bank на основе вашего профиля и требований гранта. Финальную версию рекомендуем проверить с консультантом.",
  },
  {
    question: "Гарантирует ли FundingPro получение гранта?",
    answer:
      "Нет. FundingPro не гарантирует получение гранта. Платформа помогает найти подходящие возможности, проверить требования и подготовить качественную заявку.",
  },
  {
    question: "Сколько стоит подписка?",
    answer:
      "Тарифы начинаются от 384 000 UZS в месяц для НКО. Подробности — на главной странице и в разделе подписки после входа. Оплата через Uzum Bank.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-funding-light-bg flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
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

      <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-1">
        <SectionLabel className="text-funding-green">FAQ</SectionLabel>
        <h1 className="text-3xl md:text-4xl font-black text-funding-black mb-3">
          Как это работает
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Ответы на частые вопросы о платформе FundingPro.
        </p>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none font-semibold text-funding-black hover:bg-gray-50">
                {item.question}
                <ChevronDown className="w-4 h-4 text-funding-green flex-shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                {item.answer}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <h2 className="text-xl font-bold text-funding-black mb-2">Готовы попробовать?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Создайте аккаунт и получите доступ к каталогу грантов и AI-инструментам.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#008A2E" }}
          >
            Войти в дашборд <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <div className="text-center py-8 px-6">
        <LegalFooter />
      </div>
    </div>
  );
}
