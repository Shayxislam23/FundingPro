import { SectionLabel } from "@/components/design/SectionLabel";
import type { Locale } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";

export function LandingHowItWorksSection({ locale }: { locale: Locale }) {
  const t = getPublicDict(locale).how;
  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5" style={{ background: "#020703" }}>
      <div className="max-w-4xl mx-auto text-center">
        <SectionLabel className="text-funding-muted">{t.label}</SectionLabel>
        <h2 className="text-3xl font-black mb-10">{t.title}</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-left">
          {t.steps.map(({ title, desc }, i) => (
            <div key={title} className="rounded-2xl border border-white/10 p-5">
              <span className="text-2xl font-black text-funding-green">{i + 1}</span>
              <h3 className="font-bold mt-2 mb-1">{title}</h3>
              <p className="text-sm" style={{ color: "#A7B8AA" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
