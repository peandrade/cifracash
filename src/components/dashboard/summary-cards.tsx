"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { usePreferences } from "@/contexts";
import type { MonthlySummary } from "@/types";

interface SummaryCardsProps {
  summary: MonthlySummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const t = useTranslations("dashboard");
  const { formatCurrency } = useCurrency();
  const { privacy } = usePreferences();
  const { income, expense, balance } = summary;

  const cardBase = "rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-transform duration-300 ease-out hover:-translate-y-1";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
      {/* Receitas */}
      <div
        className={cardBase}
        style={{
          background: "linear-gradient(90deg, var(--card-gradient-base) 0%, rgba(16, 185, 129, 0.18) 100%)",
          boxShadow: "0 4px 20px rgba(16, 185, 129, 0.2)"
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: "#10b981" }}>{t("income")}</p>
            <p className="text-xl sm:text-3xl font-bold" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(income)}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#10b981" }} />
          </div>
        </div>
      </div>

      {/* Despesas */}
      <div
        className={cardBase}
        style={{
          background: "linear-gradient(90deg, var(--card-gradient-base) 0%, rgba(239, 68, 68, 0.18) 100%)",
          boxShadow: "0 4px 20px rgba(239, 68, 68, 0.2)"
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: "#ef4444" }}>{t("expenses")}</p>
            <p className="text-xl sm:text-3xl font-bold" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(expense)}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(239, 68, 68, 0.2)" }}>
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#ef4444" }} />
          </div>
        </div>
      </div>

      {/* Saldo */}
      <div
        className={cardBase}
        style={{
          background: "linear-gradient(90deg, var(--card-gradient-base) 0%, rgba(59, 130, 246, 0.18) 100%)",
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.2)"
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: "#3b82f6" }}>{t("monthBalance")}</p>
            <p className="text-xl sm:text-3xl font-bold" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(balance)}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(59, 130, 246, 0.2)" }}>
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#3b82f6" }} />
          </div>
        </div>
      </div>
    </div>
  );
}