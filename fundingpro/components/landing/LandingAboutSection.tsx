import { CheckCircle2 } from "lucide-react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { MetricCard } from "@/components/design/MetricCard";

const ABOUT_ITEMS = [
  "Поиск подходящих грантов по профилю организации",
  "AI-проверка соответствия требованиям донора",
  "Генерация черновика заявки в структуре донора",
  "CRM-трекер статусов заявок",
  "Безопасное хранение документов",
  "Маркетплейс проверенных консультантов",
];

type LandingAboutSectionProps = {
  grantCountLabel: string;
};

export function LandingAboutSection({ grantCountLabel }: LandingAboutSectionProps) {
  return (
    <section className="bg-white py-20 px-6 md:px-12" style={{ color: "#050505" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel>О платформе</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-8">
              Что такое <span style={{ color: "#008A2E" }}>FundingPro</span>?
            </h2>
            <ul className="space-y-4">
              {ABOUT_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#D9F7DD" }}
                  >
                    <CheckCircle2 className="w-3 h-3" style={{ color: "#008A2E" }} />
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: "#4A5A4D" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <MetricCard
            value={grantCountLabel}
            label="международных грантов в базе данных"
            subvalue="Top 10"
            sublabel="AI-подобранных грантов по профилю пользователя"
            variant="light"
          />
        </div>
      </div>
    </section>
  );
}
