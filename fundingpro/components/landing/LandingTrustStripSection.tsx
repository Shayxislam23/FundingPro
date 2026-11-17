import type { Locale } from "@/lib/i18n/locale";
import { getPublicDict } from "@/lib/i18n/public-dict";

type LandingTrustStripSectionProps = {
  grantCountLabel: string;
  locale: Locale;
};

export function LandingTrustStripSection({ grantCountLabel, locale }: LandingTrustStripSectionProps) {
  const t = getPublicDict(locale).trust;
  return (
    <section className="py-10 px-6 border-t border-white/5" style={{ background: "#020703" }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#A7B8AA" }}>
          {t.audience}
        </p>
        <div
          className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-semibold"
          style={{ color: "rgba(167,184,170,0.7)" }}
        >
          <span>UNDP · EU · GIZ</span>
          <span>·</span>
          <span>
            {grantCountLabel} {t.grants}
          </span>
          <span>·</span>
          <span>{t.payment}</span>
        </div>
      </div>
    </section>
  );
}
