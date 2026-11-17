import { SectionLabel } from "@/components/design/SectionLabel";

const STEPS = [
  { step: "1", title: "Найдите грант", desc: "Бесплатный каталог: фильтр «для кого», дедлайн, ссылка на официальный источник." },
  { step: "2", title: "Проверьте шансы", desc: "Бесплатная проверка соответствия покажет, чего не хватает для подачи." },
  { step: "3", title: "Подайте заявку", desc: "Сами с AI-черновиком, с наставником в «Мой путь» или под ключ с нашей командой." },
];

export function LandingHowItWorksSection() {
  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5" style={{ background: "#020703" }}>
      <div className="max-w-4xl mx-auto text-center">
        <SectionLabel className="text-funding-muted">Как это работает</SectionLabel>
        <h2 className="text-3xl font-black mb-10">От поиска до поданной заявки</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-left">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="rounded-2xl border border-white/10 p-5">
              <span className="text-2xl font-black text-funding-green">{step}</span>
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
