"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Repeat, RefreshCw, Trash2, Check, AlertCircle, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import { RecurringExpenseModal } from "./recurring-expense-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { RecurringExpenseWithStatus } from "@/app/api/recurring-expenses/route";

interface RecurringData {
  expenses: RecurringExpenseWithStatus[];
  summary: {
    totalMonthly: number;
    totalLaunched: number;
    totalPending: number;
    launchedCount: number;
    pendingCount: number;
    totalCount: number;
  };
  currentMonth: number;
  currentYear: number;
}

interface RecurringSectionProps {
  onExpenseLaunched?: () => void; // Callback para atualizar transações e orçamento
}

export function RecurringSection({ onExpenseLaunched }: RecurringSectionProps) {
  const [data, setData] = useState<RecurringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch("/api/recurring-expenses");
      if (response.ok) {
        const expenseData = await response.json();
        setData(expenseData);
      }
    } catch (error) {
      console.error("Erro ao buscar despesas recorrentes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSave = async (expenseData: {
    description: string;
    value: number;
    category: string;
    dueDay: number;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/recurring-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        await fetchExpenses();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao salvar despesa recorrente:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recurring-expenses/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Erro ao deletar despesa recorrente:", error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleLaunchAll = async () => {
    setIsLaunching(true);
    try {
      const response = await fetch("/api/recurring-expenses/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetchExpenses();
        onExpenseLaunched?.();
      }
    } catch (error) {
      console.error("Erro ao lançar despesas:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleLaunchSingle = async (id: string) => {
    setIsLaunching(true);
    try {
      const response = await fetch("/api/recurring-expenses/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseIds: [id] }),
      });

      if (response.ok) {
        await fetchExpenses();
        onExpenseLaunched?.();
      }
    } catch (error) {
      console.error("Erro ao lançar despesa:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalMonthly: 0,
    totalLaunched: 0,
    totalPending: 0,
    launchedCount: 0,
    pendingCount: 0,
    totalCount: 0,
  };

  const pendingExpenses = data?.expenses.filter((e) => e.isActive && !e.isLaunchedThisMonth) || [];
  const launchedExpenses = data?.expenses.filter((e) => e.isActive && e.isLaunchedThisMonth) || [];

  return (
    <>
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Repeat className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Despesas Fixas
                </h3>
                <p className="text-sm text-[var(--text-dimmed)]">
                  {summary.pendingCount > 0
                    ? `${summary.pendingCount} pendente(s) este mês`
                    : "Todas lançadas este mês"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nova
            </button>
          </div>

          {/* Resumo */}
          {data && data.expenses.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                <p className="text-xs text-[var(--text-dimmed)] mb-1">Total Mensal</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {formatCurrency(summary.totalMonthly)}
                </p>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
                <p className="text-xs text-[var(--text-dimmed)] mb-1">Pendente</p>
                <p className={`text-lg font-bold ${summary.totalPending > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {formatCurrency(summary.totalPending)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {data?.expenses.length === 0 ? (
            <div className="text-center py-6">
              <Repeat className="w-10 h-10 text-[var(--text-dimmed)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)]">Nenhuma despesa fixa</p>
              <p className="text-xs text-[var(--text-dimmed)]">
                Adicione suas contas mensais
              </p>
            </div>
          ) : (
            <>
              {/* Pendentes */}
              {pendingExpenses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                      Pendentes ({pendingExpenses.length})
                    </span>
                    {pendingExpenses.length > 1 && (
                      <button
                        onClick={handleLaunchAll}
                        disabled={isLaunching}
                        className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3" />
                        Lançar todas
                      </button>
                    )}
                  </div>
                  {pendingExpenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      onLaunch={() => handleLaunchSingle(expense.id)}
                      onDelete={() => setDeleteId(expense.id)}
                      isLaunching={isLaunching}
                    />
                  ))}
                </div>
              )}

              {/* Lançadas */}
              {launchedExpenses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                    Lançadas ({launchedExpenses.length})
                  </span>
                  {launchedExpenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      onDelete={() => setDeleteId(expense.id)}
                      isLaunching={isLaunching}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RecurringExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remover Despesa Fixa"
        message="Tem certeza que deseja remover esta despesa fixa? As transações já lançadas não serão afetadas."
        confirmText="Remover"
        isLoading={isDeleting}
      />
    </>
  );
}

function ExpenseItem({
  expense,
  onLaunch,
  onDelete,
  isLaunching,
}: {
  expense: RecurringExpenseWithStatus;
  onLaunch?: () => void;
  onDelete: () => void;
  isLaunching: boolean;
}) {
  const categoryColor = CATEGORY_COLORS[expense.category] || "#8B5CF6";
  const isLaunched = expense.isLaunchedThisMonth;

  return (
    <div className={`bg-[var(--bg-hover)] rounded-xl p-3 group ${isLaunched ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: categoryColor }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-primary)] truncate">
                {expense.description}
              </span>
              {isLaunched && (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              {!isLaunched && expense.isPastDue && (
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-dimmed)]">
              <span>{expense.category}</span>
              <span>•</span>
              <span>Dia {expense.dueDay}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            {formatCurrency(expense.value)}
          </span>

          {!isLaunched && onLaunch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLaunch();
              }}
              disabled={isLaunching}
              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-all disabled:opacity-50"
              title="Lançar agora"
            >
              <Zap className="w-4 h-4 text-amber-400" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
            title="Remover"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
