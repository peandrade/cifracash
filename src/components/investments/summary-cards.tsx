"use client";

import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { InvestmentSummary } from "@/types";

interface InvestmentSummaryCardsProps {
  summary: InvestmentSummary;
}

export function InvestmentSummaryCards({ summary }: InvestmentSummaryCardsProps) {
  const { totalInvested, currentValue, profitLoss, profitLossPercent, totalAssets } = summary;
  const isPositive = profitLoss >= 0;

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderWidth: "1px",
    borderStyle: "solid" as const,
    borderColor: "var(--border-color)"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Investido */}
      <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Total Investido
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--text-dimmed)" }}>
          Capital aplicado
        </p>
      </div>

      {/* Valor Atual */}
      <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Valor Atual
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(currentValue)}
            </p>
          </div>
          <div className="p-3 bg-violet-500/20 rounded-xl">
            <PieChart className="w-5 h-5 text-violet-400" />
          </div>
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--text-dimmed)" }}>
          {totalAssets} {totalAssets === 1 ? "ativo" : "ativos"} na carteira
        </p>
      </div>

      {/* Rentabilidade R$ */}
      <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Rentabilidade
            </p>
            <p className={`text-2xl font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? "+" : ""}{formatCurrency(profitLoss)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isPositive ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
        </div>
        <p className={`mt-3 text-sm ${isPositive ? "text-emerald-400/70" : "text-red-400/70"}`}>
          {isPositive ? "Lucro" : "Prejuízo"} total
        </p>
      </div>

      {/* Rentabilidade % */}
      <div 
        className={`rounded-2xl p-6 ${
          isPositive 
            ? "bg-gradient-to-br from-emerald-500/90 to-teal-600/90" 
            : "bg-gradient-to-br from-red-500/90 to-orange-600/90"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium mb-1 ${isPositive ? "text-emerald-100" : "text-red-100"}`}>
              Rentabilidade %
            </p>
            <p className="text-2xl font-bold text-white">
              {isPositive ? "+" : ""}{profitLossPercent.toFixed(2)}%
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-white" />
            ) : (
              <TrendingDown className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
        <p className={`mt-3 text-sm ${isPositive ? "text-emerald-100" : "text-red-100"}`}>
          {isPositive ? "📈 Carteira valorizada!" : "📉 Carteira desvalorizada"}
        </p>
      </div>
    </div>
  );
}