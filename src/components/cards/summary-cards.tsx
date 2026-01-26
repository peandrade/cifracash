"use client";

import { CreditCard, Wallet, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CardSummary } from "@/types/credit-card";

interface SummaryCardsProps {
  summary: CardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const usagePercent = summary.totalLimit > 0
    ? (summary.usedLimit / summary.totalLimit) * 100
    : 0;

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderWidth: "1px",
    borderStyle: "solid" as const,
    borderColor: "var(--border-color)"
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {}
      <div className="backdrop-blur rounded-2xl p-5 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-primary-medium">
            <CreditCard className="w-5 h-5 text-primary-color" />
          </div>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Limite Total</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(summary.totalLimit)}
        </p>
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-dimmed)" }}>
            <span>Usado</span>
            <span>{usagePercent.toFixed(0)}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: "var(--bg-hover)" }}>
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-yellow-500" : "bg-[var(--color-primary)]"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {}
      <div className="backdrop-blur rounded-2xl p-5 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-emerald-500/20">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Disponível</span>
        </div>
        <p className="text-2xl font-bold text-emerald-400">
          {formatCurrency(summary.availableLimit)}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
          {formatCurrency(summary.usedLimit)} usado
        </p>
      </div>

      {}
      <div className="backdrop-blur rounded-2xl p-5 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-blue-500/20">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Fatura Atual</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(summary.currentInvoice)}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>Este mês</p>
      </div>

      {}
      <div className="backdrop-blur rounded-2xl p-5 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-orange-500/20">
            <Calendar className="w-5 h-5 text-orange-400" />
          </div>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Próxima Fatura</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(summary.nextInvoice)}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>Mês que vem</p>
      </div>
    </div>
  );
}