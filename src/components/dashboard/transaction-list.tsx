"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCategoryColor } from "@/lib/constants";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TransactionFilters } from "@/components/filters/transaction-filters";
import { useTransactionStore } from "@/store/transaction-store";
import type { Transaction } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

export function TransactionList({
  transactions,
  onDelete,
  deletingId,
}: TransactionListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);
  const { getFilteredTransactions, hasActiveFilters } = useTransactionStore();

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteConfirm(transaction);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const filteredTransactions = hasActiveFilters() ? getFilteredTransactions() : transactions;

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div
      className="backdrop-blur rounded-2xl p-6 transition-colors duration-300 h-full flex flex-col"
      style={{
        backgroundColor: "var(--card-bg)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border-color)"
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Transações
          </h3>
          <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>
            {hasActiveFilters()
              ? `${filteredTransactions.length} de ${transactions.length} transações`
              : `${transactions.length} transações`
            }
          </p>
        </div>
      </div>

      {}
      <TransactionFilters className="mb-4" />

      {sortedTransactions.length === 0 ? (
        <div className="text-center py-12">
          {hasActiveFilters() ? (
            <>
              <p style={{ color: "var(--text-dimmed)" }}>Nenhuma transação encontrada</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
                Tente ajustar os filtros para ver mais resultados
              </p>
            </>
          ) : (
            <>
              <p style={{ color: "var(--text-dimmed)" }}>Nenhuma transação registrada</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
                Clique em &quot;Nova Transação&quot; para começar
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-0">
          {sortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-xl transition-all group"
              style={{ backgroundColor: "var(--bg-hover)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${getCategoryColor(transaction.category)}20`,
                    color: getCategoryColor(transaction.category),
                  }}
                >
                  {transaction.type === "income" ? (
                    <ArrowUp className="w-5 h-5" />
                  ) : (
                    <ArrowDown className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {transaction.description || transaction.category}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>
                    {transaction.category} • {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={`font-semibold ${
                    transaction.type === "income"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}{" "}
                  {formatCurrency(transaction.value)}
                </p>
                <button
                  onClick={() => handleDeleteClick(transaction)}
                  disabled={deletingId === transaction.id}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                >
                  {deletingId === transaction.id ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir transação"
        message={`Tem certeza que deseja excluir a transação "${deleteConfirm?.description || deleteConfirm?.category}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={!!deletingId}
      />
    </div>
  );
}