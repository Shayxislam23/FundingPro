import type { LegalDocumentContent } from "@/lib/legal/types";

type LegalDocumentProps = {
  document: LegalDocumentContent;
};

export function LegalDocument({ document }: LegalDocumentProps) {
  return (
    <article className="prose prose-sm max-w-none prose-headings:text-funding-black prose-p:text-gray-600">
      <header className="mb-8 pb-6 border-b border-gray-100">
        <h1 className="text-2xl font-black text-funding-black mb-2">{document.title}</h1>
        <p className="text-xs text-gray-400">
          Версия {document.version} · действует с {document.effectiveDate}
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-4">
          Информационный документ. Не заменяет индивидуальную юридическую консультацию. Рекомендуется
          проверка местным юристом перед масштабированием.
        </p>
      </header>
      {document.sections.map((section) => (
        <section key={section.title} className="mb-8">
          <h2 className="text-lg font-bold text-funding-black mb-3">{section.title}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-600 mb-3">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
