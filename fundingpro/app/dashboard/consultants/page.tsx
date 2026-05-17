"use client";

import { useState, useEffect } from "react";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Star, MapPin, CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Consultant = {
  id: string;
  full_name: string;
  specialty?: string;
  specialties?: string[];
  country?: string;
  rating?: number;
  review_count?: number;
  is_verified?: boolean;
  bio?: string;
  packages?: { name: string; price: string }[];
};

// Fallback static consultants while DB table is being populated
const STATIC_CONSULTANTS: Consultant[] = [
  {
    id: "s1",
    full_name: "Алексей Иванов",
    specialty: "Грантовое письмо UNDP/EU",
    country: "Узбекистан",
    rating: 4.9,
    review_count: 34,
    is_verified: true,
    bio: "Специалист по международным грантам ПРООН и ЕС. Помогаю НКО и малым бизнесам в подготовке заявок.",
    packages: [{ name: "Проверка черновика", price: "$150" }, { name: "Полная подготовка заявки", price: "$500" }],
  },
  {
    id: "s2",
    full_name: "Диана Рашидова",
    specialty: "GIZ / Немецкое сотрудничество",
    country: "Казахстан",
    rating: 4.8,
    review_count: 21,
    is_verified: true,
    bio: "Опыт работы с GIZ более 8 лет. Специализация — сельское хозяйство и устойчивое развитие.",
    packages: [{ name: "Консультация 1 час", price: "$80" }, { name: "Сопровождение заявки", price: "$400" }],
  },
  {
    id: "s3",
    full_name: "Тимур Ахмедов",
    specialty: "World Bank / бюджетирование",
    country: "Узбекистан",
    rating: 4.7,
    review_count: 18,
    is_verified: true,
    bio: "Финансовый консультант с опытом в проектах World Bank и ADB. Помогаю выстроить бюджетную структуру.",
    packages: [{ name: "Бюджетная структура", price: "$200" }, { name: "Полный финансовый пакет", price: "$600" }],
  },
];

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session) headers["Authorization"] = `Bearer ${session.access_token}`;

        const res = await fetch("/api/v1/consultants", { headers });
        const data = await res.json();
        const list: Consultant[] = data.data?.consultants ?? [];
        // Use real data if available, otherwise static fallback
        setConsultants(list.length > 0 ? list : STATIC_CONSULTANTS);
      } catch {
        setConsultants(STATIC_CONSULTANTS);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultants();
  }, []);

  const getSpecialty = (c: Consultant) =>
    c.specialty ?? (c.specialties?.[0] ?? "Грантовое письмо");

  return (
    <div>
      <div className="mb-6">
        <SectionLabel>Консультанты</SectionLabel>
        <h1 className="text-2xl font-black text-funding-black">Маркетплейс консультантов</h1>
        <p className="text-sm text-gray-500 mt-1">Проверенные эксперты по грантовому письму, бюджетированию и отчётности</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-funding-green" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {consultants.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-funding-green/30 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-funding-green text-white font-bold text-sm flex items-center justify-center">
                      {c.full_name[0]}
                    </div>
                    {c.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-funding-green" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-funding-black">{c.full_name}</h3>
                  <p className="text-xs font-medium text-funding-accent">{getSpecialty(c)}</p>
                </div>
                {c.rating != null && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {c.rating}
                    {c.review_count != null && (
                      <span className="text-gray-400 font-normal">({c.review_count})</span>
                    )}
                  </div>
                )}
              </div>

              {c.country && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <MapPin className="w-3 h-3" />
                  {c.country}
                </div>
              )}

              {c.bio && (
                <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{c.bio}</p>
              )}

              {c.packages && c.packages.length > 0 && (
                <div className="space-y-2 mb-4">
                  {c.packages.map((p) => (
                    <div key={p.name} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#F7FAF7" }}>
                      <span className="text-xs font-medium text-funding-black">{p.name}</span>
                      <span className="text-xs font-bold text-funding-green">{p.price}</span>
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#008A2E" }}>
                <MessageSquare className="w-3.5 h-3.5" />
                Заказать
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
