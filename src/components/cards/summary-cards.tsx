"use client";

import { CreditCard, Wallet, TrendingUp, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import type { CardSummary } from "@/types/credit-card";

interface SummaryCardsProps {
  summary: CardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const { formatCurrency } = useCurrency();
  const { privacy } = usePreferences();

  const usagePercent = summary.totalLimit > 0
    ? (summary.usedLimit / summary.totalLimit) * 100
    : 0;

  const cardBase = "rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-transform duration-300 ease-out hover:-translate-y-1";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Limite Total - Roxo */}
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
              {t("totalLimit")}
            </p>
            <p className="text-lg sm:text-3xl font-bold truncate" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(summary.totalLimit)}
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1" style={{ color: "#8b5cf6", opacity: 0.7 }}>
                <span>{tc("used")}</span>
                <span>{usagePercent.toFixed(0)}%</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ backgroundColor: "rgba(139, 92, 246, 0.2)" }}>
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-yellow-500" : "bg-violet-500"
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(139, 92, 246, 0.2)" }}>
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#8b5cf6" }} />
          </div>
        </div>
      </div>

      {/* Disponível - Verde */}
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
              {t("availableLimit")}
            </p>
            <p className="text-lg sm:text-3xl font-bold truncate" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(summary.availableLimit)}
            </p>
            <p className="text-xs sm:text-sm mt-2 truncate" style={{ color: "#10b981", opacity: 0.7 }}>
              {privacy.hideValues ? "•••••" : formatCurrency(summary.usedLimit)} {tc("used")}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#10b981" }} />
          </div>
        </div>
      </div>

      {/* Fatura Atual - Azul */}
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
              {t("currentInvoice")}
            </p>
            <p className="text-lg sm:text-3xl font-bold truncate" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(summary.currentInvoice)}
            </p>
            <p className="text-xs sm:text-sm mt-2" style={{ color: "#3b82f6", opacity: 0.7 }}>
              {tc("thisMonth")}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(59, 130, 246, 0.2)" }}>
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#3b82f6" }} />
          </div>
        </div>
      </div>

      {/* Próxima Fatura - Laranja */}
      <div
        className={cardBase}
        style={{
          background: "linear-gradient(90deg, var(--card-gradient-base) 0%, rgba(249, 115, 22, 0.18) 100%)",
          boxShadow: "0 4px 20px rgba(249, 115, 22, 0.2)"
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: "#f97316" }}>
              {t("nextInvoice")}
            </p>
            <p className="text-lg sm:text-3xl font-bold truncate" style={{ color: "var(--card-text-value)" }}>
              {privacy.hideValues ? "•••••" : formatCurrency(summary.nextInvoice)}
            </p>
            <p className="text-xs sm:text-sm mt-2" style={{ color: "#f97316", opacity: 0.7 }}>
              {tc("nextMonth")}
            </p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl flex-shrink-0" style={{ background: "rgba(249, 115, 22, 0.2)" }}>
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#f97316" }} />
          </div>
        </div>
      </div>
    </div>
  );
}