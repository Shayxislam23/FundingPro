"use client";

import { SectionLabel } from "@/components/design/SectionLabel";
import { Star, MapPin, CheckCircle2, MessageSquare } from "lucide-react";

const consultants = [
  { id: "1", name: "Алексей Иванов", specialty: "Грантовое письмо UNDP/EU", country: "Узбекистан", rating: 4.9, reviews: 34, verified: true, bio: "Специалист по международным грантам ПРООН и ЕС. Помогаю НКО и малым бизнесам в подготовке заявок.", packages: [{ name: "Проверка черновика", price: "$150" }, { name: "Полная подготовка заявки", price: "$500" }] },
  { id: "2", name: "Диана Рашидова", specialty: "GIZ / Немецкое сотрудничество", country: "Казахстан", rating: 4.8, reviews: 21, verified: true, bio: "Опыт работы с GIZ более 8 лет. Специализация — сельское хозяйство и устойчивое развитие.", packages: [{ name: "Консультация 1 час", price: "$80" }, { name: "Сопровождение заявки", price: "$400" }] },
  { id: "3", name: "Тимур Ахмедов", specialty: "World Bank / бюджетирование", country: "Узбекистан", rating: 4.7, reviews: 18, verified: true, bio: "Финансовый консультант с опытом в проектах World Bank и ADB. Помогаю выстроить бюджетную структуру.", packages: [{ name: "Бюджетная структура", price: "$200" }, { name: "Полный финансовый пакет", price: "$600" }] },
];

export default function ConsultantsPage() {
  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Консультанты</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Маркетплейс консультантов</h1>
        <p className="text-sm text-gray-500 mt-1">Проверенные эксперты по грантовому письму, бюджетированию и отчётности</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {consultants.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-funding-green/30 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-funding-green text-white font-bold text-sm flex items-center justify-center">
                    {c.name[0]}
                  </div>
                  {c.verified && (
                    <CheckCircle2 className="w-4 h-4 text-funding-green" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-funding-black">{c.name}</h3>
                <p className="text-xs font-medium text-funding-accent">{c.specialty}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {c.rating}
                <span className="text-gray-400 font-normal">({c.reviews})</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
              <MapPin className="w-3 h-3" />
              {c.country}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{c.bio}</p>

            <div className="space-y-2 mb-4">
              {c.packages.map((p) => (
                <div key={p.name} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#F7FAF7" }}>
                  <span className="text-xs font-medium text-funding-black">{p.name}</span>
                  <span className="text-xs font-bold text-funding-green">{p.price}</span>
                </div>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#008A2E" }}>
              <MessageSquare className="w-3.5 h-3.5" />
              Заказать
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
