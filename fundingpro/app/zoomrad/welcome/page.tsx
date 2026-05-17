"use client";

import Link from "next/link";
import { ZoomradShell } from "@/components/layout/ZoomradShell";
import { FundingProLogo } from "@/components/design/FundingProLogo";
import { ZoomradBadge } from "@/components/design/ZoomradBadge";
import {
  Search,
  CheckCircle2,
  FileText,
  BarChart3,
  ChevronRight,
} from "lucide-react";

export default function ZoomradWelcomePage() {
  return (
    <ZoomradShell variant="dark">
      {/* Hero */}
      <div
        className="relative px-5 pt-8 pb-10"
        style={{ background: "linear-gradient(180deg, #020703 0%, #051005 100%)" }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(0,138,46,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center mb-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
              style={{ background: "#008A2E" }}
            >
              FP
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#12B94F" }}>
            FundingPro Mini App
          </p>
          <h1 className="text-3xl font-black text-white leading-tight mb-3">
            Найдите подходящие
            <br />
            <span style={{ color: "#12B94F" }}>гранты за минуты</span>
          </h1>
          <p className="text-sm mb-8 leading-relaxed max-w-[280px] mx-auto" style={{ color: "#A7B8AA" }}>
            AI проверит соответствие требованиям донора и поможет подготовить заявку
          </p>

          <Link
            href="/zoomrad/onboarding"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm text-white"
            style={{ background: "#008A2E" }}
          >
            Начать <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/zoomrad/grants"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm mt-3 border"
            style={{ borderColor: "rgba(0,138,46,0.4)", color: "#12B94F" }}
          >
            Смотреть гранты
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="px-5 py-6 space-y-3" style={{ background: "#050A06" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#A7B8AA" }}>
          Что умеет FundingPro
        </p>
        {[
          { icon: Search, title: "Поиск грантов", desc: "1 000+ международных грантов" },
          { icon: CheckCircle2, title: "Проверка соответствия", desc: "AI-анализ требований донора" },
          { icon: FileText, title: "AI-предложение", desc: "Черновик в формате UNDP, EU, GIZ" },
          { icon: BarChart3, title: "Трекер заявок", desc: "Статусы от черновика до гранта" },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-center gap-4 p-4 rounded-2xl border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(0,138,46,0.15)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,138,46,0.15)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "#12B94F" }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{title}</div>
              <div className="text-xs mt-0.5" style={{ color: "#A7B8AA" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-5 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="text-xs leading-relaxed text-center" style={{ color: "rgba(167,184,170,0.5)" }}>
          FundingPro не гарантирует получение гранта. Платформа помогает найти
          возможности, проверить требования и подготовить заявку.
        </p>
        <p className="text-xs text-center mt-2" style={{ color: "rgba(167,184,170,0.3)" }}>
          Beta Version Solutions ООО, DGU No. 61712
        </p>
      </div>
    </ZoomradShell>
  );
}
