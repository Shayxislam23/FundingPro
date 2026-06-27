type LandingTrustStripSectionProps = {
  grantCountLabel: string;
};

export function LandingTrustStripSection({ grantCountLabel }: LandingTrustStripSectionProps) {
  return (
    <section className="py-10 px-6 border-t border-white/5" style={{ background: "#020703" }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#A7B8AA" }}>
          Для НКО Узбекистана
        </p>
        <div
          className="flex flex-wrap justify-center gap-8 text-sm font-semibold"
          style={{ color: "rgba(167,184,170,0.7)" }}
        >
          <span>UNDP · EU · GIZ</span>
          <span>·</span>
          <span>{grantCountLabel} грантов</span>
          <span>·</span>
          <span>Оплата в UZS через Uzum</span>
        </div>
      </div>
    </section>
  );
}
