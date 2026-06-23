"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/design/SectionLabel";
import { Star, MapPin, CheckCircle2, MessageSquare, Loader2, X, CheckCircle } from "lucide-react";
import { getAuthHeaders } from "@/lib/client-auth";

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

type OrderResult = {
  orderId: string;
  status: string;
  payment: { message: string };
};

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Consultant | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<{ name: string; price: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/consultants", { headers });
        const data = await res.json();
        setConsultants(data.data?.consultants ?? []);
      } catch {
        setConsultants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultants();
  }, []);

  const getSpecialty = (c: Consultant) =>
    c.specialty ?? (c.specialties?.[0] ?? "Грантовое письмо");

  const openOrder = (c: Consultant, pkg: { name: string; price: string }) => {
    setSelected(c);
    setSelectedPackage(pkg);
    setNotes("");
    setOrderResult(null);
    setOrderError("");
  };

  const submitOrder = async () => {
    if (!selected || !selectedPackage) return;
    setOrdering(true);
    setOrderError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/consultant-orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          consultantId: selected.id,
          packageName: selectedPackage.name,
          price: selectedPackage.price,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Ошибка заказа");
      setOrderResult(data.data);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setOrdering(false);
    }
  };

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
      ) : consultants.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400">
          Консультанты скоро появятся. Оставьте заявку в{" "}
          <Link href="/dashboard/support" className="text-funding-green underline font-medium">
            поддержке
          </Link>
          , и мы подберём эксперта по вашему гранту.
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
                    {c.is_verified && <CheckCircle2 className="w-4 h-4 text-funding-green" />}
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

              {c.packages && c.packages.length > 0 ? (
                <div className="space-y-2">
                  {c.packages.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => openOrder(c, p)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-funding-light-green transition-colors"
                      style={{ background: "#F7FAF7" }}
                    >
                      <span className="text-xs font-medium text-funding-black">{p.name}</span>
                      <span className="text-xs font-bold text-funding-green">{p.price}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => openOrder(c, { name: "Консультация", price: "$100" })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#008A2E" }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Заказать
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            {!orderResult ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-funding-black">Заказ консультации</h2>
                    <p className="text-xs text-gray-500 mt-1">{selected.full_name} · {selectedPackage.name} · {selectedPackage.price}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
                  Онлайн-оплата временно недоступна. После отправки запроса команда FundingPro свяжется с вами.
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Комментарий (опционально): опишите задачу..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none mb-4 outline-none focus:ring-2 focus:ring-funding-green/20"
                />

                {orderError && (
                  <p className="text-xs text-red-600 mb-3">{orderError}</p>
                )}

                <button
                  onClick={submitOrder}
                  disabled={ordering}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                  style={{ background: "#008A2E" }}
                >
                  {ordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Отправить запрос
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-funding-green mx-auto mb-3" />
                <h2 className="font-bold text-funding-black mb-2">Запрос отправлен</h2>
                <p className="text-sm text-gray-500 mb-4">{orderResult.payment.message}</p>
                <p className="text-xs text-gray-400 mb-4">ID заказа: {orderResult.orderId.slice(0, 8)}…</p>
                <button
                  onClick={() => setSelected(null)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#008A2E" }}
                >
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
