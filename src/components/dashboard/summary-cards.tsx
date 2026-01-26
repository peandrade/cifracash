"use client";

import { TrendingUp, TrendingDown, Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import type { MonthlySummary } from "@/types";

interface SummaryCardsProps {
  summary: MonthlySummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { privacy } = usePreferences();
  const { income, expense, balance, incomeChange, expenseChange } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {}
      <div className="card-hover bg-gradient-to-br from-emerald-500/90 to-teal-600/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl shadow-emerald-500/10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium mb-1">
              Receitas do mês
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {privacy.hideValues ? "•••••" : formatCurrency(income)}
            </p>
          </div>
          <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-center gap-1 text-emerald-100 text-xs sm:text-sm">
          {incomeChange !== undefined && incomeChange >= 0 ? (
            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span>
            {incomeChange !== undefined
              ? `${incomeChange >= 0 ? "+" : ""}${incomeChange.toFixed(1)}% vs mês anterior`
              : "+0.0% vs mês anterior"}
          </span>
        </div>
      </div>

      {}
      <div className="card-hover bg-gradient-to-br from-orange-500/90 to-red-500/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl shadow-orange-500/10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">
              Despesas do mês
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {privacy.hideValues ? "•••••" : formatCurrency(expense)}
            </p>
          </div>
          <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-center gap-1 text-orange-100 text-xs sm:text-sm">
          {expenseChange !== undefined && expenseChange <= 0 ? (
            <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span>
            {expenseChange !== undefined
              ? `${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}% vs mês anterior`
              : "+0.0% vs mês anterior"}
          </span>
        </div>
      </div>

      {}
      <div
        className={`card-hover bg-gradient-to-br ${
          balance >= 0
            ? "from-cyan-500/90 to-blue-600/90 shadow-cyan-500/10"
            : "from-red-600/90 to-rose-700/90 shadow-red-500/10"
        } rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl sm:col-span-2 md:col-span-1`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p
              className={`text-xs sm:text-sm font-medium mb-1 ${
                balance >= 0 ? "text-cyan-100" : "text-red-100"
              }`}
            >
              Saldo do mês
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {privacy.hideValues ? "•••••" : formatCurrency(balance)}
            </p>
          </div>
          <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <div
          className={`mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm ${
            balance >= 0 ? "text-cyan-100" : "text-red-100"
          }`}
        >
          <span>
            {balance >= 0 ? "✨ Saldo positivo!" : "⚠️ Atenção aos gastos"}
          </span>
        </div>
      </div>
    </div>
  );
}