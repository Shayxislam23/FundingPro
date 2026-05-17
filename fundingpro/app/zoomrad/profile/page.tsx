"use client";

import Link from "next/link";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import {
  Building2,
  Globe,
  Briefcase,
  CreditCard,
  HelpCircle,
  ChevronRight,
  LogOut,
  Edit3,
} from "lucide-react";

const menuItems = [
  { icon: Building2, label: "Профиль организации", href: "#" },
  { icon: Globe, label: "Язык интерфейса", href: "#", value: "Русский" },
  { icon: Briefcase, label: "Сохранённые гранты", href: "/zoomrad/grants" },
  { icon: CreditCard, label: "Подписка и оплата", href: "/zoomrad/pricing" },
  { icon: HelpCircle, label: "Поддержка", href: "/zoomrad/support" },
];

export default function ProfilePage() {
  return (
    <ZoomradShell variant="light" title="Профиль" showBack>
      <div className="pb-10">
        {/* Avatar section */}
        <div
          className="px-5 pt-8 pb-6 text-center border-b"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div
            className="w-16 h-16 rounded-2xl text-white text-2xl font-black flex items-center justify-center mx-auto mb-3"
            style={{ background: "#008A2E" }}
          >
            О
          </div>
          <h2 className="text-lg font-black text-funding-black">Моя организация</h2>
          <p className="text-sm mt-0.5" style={{ color: "#4A5A4D" }}>НКО · Узбекистан</p>

          {/* Subscription badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-3"
            style={{ background: "#D9F7DD", color: "#008A2E" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#12B94F" }} />
            НКО Pro · активна
          </div>
        </div>

        {/* Menu */}
        <div className="px-4 pt-4 space-y-2">
          {menuItems.map(({ icon: Icon, label, href, value }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white border"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#D9F7DD" }}
              >
                <Icon className="w-4 h-4" style={{ color: "#008A2E" }} />
              </div>
              <span className="flex-1 text-sm font-medium text-funding-black">{label}</span>
              {value && <span className="text-xs" style={{ color: "#4A5A4D" }}>{value}</span>}
              <ChevronRight className="w-4 h-4" style={{ color: "#9ca3af" }} />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="px-4 pt-4">
          <button
            className="flex items-center gap-3 p-4 rounded-2xl w-full border"
            style={{ borderColor: "#fee2e2", background: "#fff9f9" }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-500">Выйти</span>
          </button>
        </div>

        <p className="text-xs text-center mt-8 px-5" style={{ color: "#9ca3af" }}>
          FundingPro — грантовая платформа. Не является финансовой организацией.
          {"\n"}Beta Version Solutions ООО, DGU No. 61712
        </p>
      </div>
    </ZoomradShell>
  );
}
