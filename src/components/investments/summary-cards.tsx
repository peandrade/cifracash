"use client";

import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import type { InvestmentSummary } from "@/types";

interface InvestmentSummaryCardsProps {
  summary: InvestmentSummary;
}

export function InvestmentSummaryCards({ summary }: InvestmentSummaryCardsProps) {
  const t = useTranslations("investments");
  const { privacy } = usePreferences();
  const { formatCurrency } = useCurrency();
  const { totalInvested, currentValue, profitLoss, totalAssets } = summary;
  const isPositive = profitLoss >= 0;

  const cardBase = "rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-transform duration-300 ease-out hover:-translate-y-1";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {/* Total Investido - Azul */}
      <div
        className={cardBase}
        style={{
          background: "linear-gradient(90deg, var(--card-gradient-base) 0%, rgba(59, 130, 246, 0.18) 100%)",
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.2)"
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: "#3b82f6" }}>
              {t("totalInvested")}
            </p>
            <p className="text-xl sm:text-3xl font-bold" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(totalInvested)}
            </p>
            <p className="text-xs sm:text-sm mt-2" style={{ color: "#3b82f6", opacity: 0.7 }}>
              {t("capitalApplied")}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(59, 130, 246, 0.2)" }}>
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#3b82f6" }} />
          </div>
        </div>
      </div>

      {/* Valor Atual - Roxo */}
      <div
        className={cardBase}
        style={{
          background: "linear-gradient(90deg, var(--card-gradient-base) 0%, rgba(139, 92, 246, 0.18) 100%)",
          boxShadow: "0 4px 20px rgba(139, 92, 246, 0.2)"
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: "#8b5cf6" }}>
              {t("currentValue")}
            </p>
            <p className="text-xl sm:text-3xl font-bold" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(currentValue)}
            </p>
            <p className="text-xs sm:text-sm mt-2" style={{ color: "#8b5cf6", opacity: 0.7 }}>
              {totalAssets} {totalAssets === 1 ? t("asset") : t("assets")}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(139, 92, 246, 0.2)" }}>
            <PieChart className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#8b5cf6" }} />
          </div>
        </div>
      </div>

      {/* Rentabilidade - Verde */}
      <div
        className={cardBase}
        style={{
          background: "linear-gradient(90deg, var(--card-gradient-base) 0%, rgba(16, 185, 129, 0.18) 100%)",
          boxShadow: "0 4px 20px rgba(16, 185, 129, 0.2)"
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: "#10b981" }}>
              {t("profitability")}
            </p>
            <p className="text-xl sm:text-3xl font-bold" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : `${isPositive ? "+" : ""}${formatCurrency(profitLoss)}`}
            </p>
            <p className="text-xs sm:text-sm mt-2" style={{ color: "#10b981", opacity: 0.7 }}>
              {isPositive ? t("profitTotal") : t("lossTotal")}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#10b981" }} />
            ) : (
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#10b981" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}