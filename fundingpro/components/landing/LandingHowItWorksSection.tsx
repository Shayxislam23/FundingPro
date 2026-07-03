import { SectionLabel } from "@/components/design/SectionLabel";

const STEPS = [
  { step: "1", title: "Профиль", desc: "Укажите сферу и цели — AI подберёт релевантные гранты, стипендии и программы." },
  { step: "2", title: "Проверка соответствия", desc: "Узнайте, насколько вы или ваш бизнес подходите требованиям донора." },
  { step: "3", title: "AI-черновик", desc: "Получите структурированную заявку в формате UNDP, EU, GIZ или Erasmus+." },
];

export function LandingHowItWorksSection() {
  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5" style={{ background: "#020703" }}>
      <div className="max-w-4xl mx-auto text-center">
        <SectionLabel className="text-funding-muted">Как это работает</SectionLabel>
        <h2 className="text-3xl font-black mb-10">Первый грант за 30 минут</h2>
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
