"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Trash2, Plus, Pencil, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getInvestmentTypeLabel,
  getInvestmentTypeColor,
  getInvestmentTypeIcon,
} from "@/lib/constants";
import { isVariableIncome } from "@/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Investment } from "@/types";

interface InvestmentListProps {
  investments: Investment[];
  onDelete: (id: string) => void;
  onAddOperation: (investment: Investment) => void;
  onEdit: (investment: Investment) => void;
  deletingId?: string | null;
}

export function InvestmentList({
  investments,
  onDelete,
  onAddOperation,
  onEdit,
  deletingId,
}: InvestmentListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<Investment | null>(null);

  const handleDeleteClick = (investment: Investment) => {
    setDeleteConfirm(investment);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };
  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderWidth: "1px",
    borderStyle: "solid" as const,
    borderColor: "var(--border-color)"
  };

  if (investments.length === 0) {
    return (
      <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
        <h3 className="text-lg font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Meus Investimentos</h3>
        <div className="text-center py-12">
          <p style={{ color: "var(--text-dimmed)" }}>Nenhum investimento registrado</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
            Clique em &quot;Novo Investimento&quot; para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Meus Investimentos</h3>
          <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>Acompanhe sua carteira</p>
        </div>
        <span className="text-sm" style={{ color: "var(--text-dimmed)" }}>
          {investments.length} {investments.length === 1 ? "ativo" : "ativos"}
        </span>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {investments.map((investment) => {
          const isPositive = investment.profitLoss >= 0;
          const color = getInvestmentTypeColor(investment.type);
          const isVariable = isVariableIncome(investment.type);

          const hasGoal = investment.goalValue && investment.goalValue > 0;
          const goalProgress = hasGoal
            ? (investment.currentValue / investment.goalValue!) * 100
            : 0;

          return (
            <div
              key={investment.id}
              className="p-4 rounded-xl transition-all group"
              style={{ backgroundColor: "var(--bg-hover)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            >
              {}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {getInvestmentTypeIcon(investment.type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {investment.ticker || investment.name}
                      </p>
                      {investment.ticker && (
                        <span className="text-sm" style={{ color: "var(--text-dimmed)" }}>{investment.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-medium"
                        style={{ backgroundColor: `${color}30`, color }}
                      >
                        {getInvestmentTypeLabel(investment.type)}
                      </span>
                      {isVariable ? (
                        <>
                          <span style={{ color: "var(--text-dimmed)" }}>
                            {investment.quantity.toLocaleString("pt-BR")} cotas
                          </span>
                          <span style={{ color: "var(--text-dimmed)" }}>•</span>
                          <span style={{ color: "var(--text-dimmed)" }}>
                            PM: {formatCurrency(investment.averagePrice)}
                          </span>
                          {investment.currentPrice > 0 && (
                            <>
                              <span style={{ color: "var(--text-dimmed)" }}>•</span>
                              <span style={{ color: "var(--text-dimmed)" }}>
                                Atual: {formatCurrency(investment.currentPrice)}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "var(--text-dimmed)" }}>
                          Aplicado: {formatCurrency(investment.totalInvested)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(investment.currentValue)}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-sm ${
                      isPositive ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isPositive ? "+" : ""}{formatCurrency(investment.profitLoss)}
                      </span>
                      <span style={{ color: "var(--text-dimmed)" }}>
                        ({isPositive ? "+" : ""}{investment.profitLossPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => onEdit(investment)}
                      className="p-2 hover:bg-violet-500/20 rounded-lg transition-all"
                      title="Editar / Atualizar"
                    >
                      <Pencil className="w-4 h-4 text-violet-400" />
                    </button>
                    <button
                      onClick={() => onAddOperation(investment)}
                      className="p-2 hover:bg-emerald-500/20 rounded-lg transition-all"
                      title="Nova operação"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(investment)}
                      disabled={deletingId === investment.id}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                      title="Excluir"
                    >
                      {deletingId === investment.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {}
              {hasGoal && (
                <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-violet-400" />
                      <span style={{ color: "var(--text-muted)" }}>Meta</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{ color: "var(--text-dimmed)" }}>
                        {formatCurrency(investment.currentValue)} / {formatCurrency(investment.goalValue!)}
                      </span>
                      <span className={`font-medium ${
                        goalProgress >= 100 ? "text-emerald-400" : "text-violet-400"
                      }`}>
                        {Math.min(goalProgress, 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: "var(--bg-hover)" }}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goalProgress >= 100
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-gradient-to-r from-violet-500 to-indigo-500"
                      }`}
                      style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    />
                  </div>
                  {goalProgress >= 100 && (
                    <p className="text-emerald-400 text-xs mt-2 text-center">🎉 Meta alcançada!</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir investimento"
        message={`Tem certeza que deseja excluir "${deleteConfirm?.ticker || deleteConfirm?.name}"? Todas as operações relacionadas serão removidas. Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={!!deletingId}
      />
    </div>
  );
}