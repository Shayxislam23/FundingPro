import { SectionLabel } from "@/components/design/SectionLabel";
import { LANDING_FEATURES } from "@/components/landing/landingConstants";

export function LandingFeaturesSection() {
  return (
    <section className="py-20 px-6 md:px-12" style={{ background: "#F7FAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel className="text-funding-green">Возможности</SectionLabel>
          <h2 className="text-4xl font-black" style={{ color: "#050505" }}>
            Полный цикл работы с грантами
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LANDING_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border hover:shadow-md transition-all duration-200"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "#D9F7DD" }}
              >
                <Icon className="w-5 h-5" style={{ color: "#008A2E" }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "#050505" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
