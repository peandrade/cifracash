"use client";

import { useState } from "react";
import { CreditCard as CardIcon, Trash2, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { CreditCard } from "@/types/credit-card";

interface CardListProps {
  cards: CreditCard[];
  selectedCardId?: string | null;
  onSelectCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
  deletingId?: string | null;
}

const cardStyle = {
  backgroundColor: "var(--card-bg)",
  borderWidth: "1px",
  borderStyle: "solid" as const,
  borderColor: "var(--border-color)"
};

export function CardList({
  cards,
  selectedCardId,
  onSelectCard,
  onDeleteCard,
  deletingId,
}: CardListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<CreditCard | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, card: CreditCard) => {
    e.stopPropagation();
    setDeleteConfirm(card);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeleteCard(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };
  if (cards.length === 0) {
    return (
      <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Meus Cartões</h3>
        <div className="text-center py-8">
          <CardIcon className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-dimmed)" }} />
          <p style={{ color: "var(--text-dimmed)" }}>Nenhum cartão cadastrado</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
            Adicione seu primeiro cartão
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Meus Cartões</h3>
      <div className="space-y-3">
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;

          // Calcula limite usado (soma de todas faturas não pagas)
          const usedLimit = card.invoices?.reduce((sum, inv) => {
            if (inv.status !== "paid") {
              return sum + (inv.total - (inv.paidAmount || 0));
            }
            return sum;
          }, 0) || 0;

          // Pega a próxima fatura com valor (ordenada por data)
          const sortedInvoices = [...(card.invoices || [])].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
          });

          const nextInvoiceWithValue = sortedInvoices.find(
            (inv) => inv.total > 0 && inv.status !== "paid"
          );

          const displayInvoice = nextInvoiceWithValue || sortedInvoices[0];
          const displayTotal = displayInvoice?.total || 0;

          // Calcula porcentagem de uso
          const usagePercent = card.limit > 0 ? (usedLimit / card.limit) * 100 : 0;

          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(card)}
              className="p-4 rounded-xl cursor-pointer transition-all group"
              style={{
                backgroundColor: isSelected ? "var(--bg-hover-strong)" : "var(--bg-hover)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: isSelected ? "var(--border-color-strong)" : "transparent"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Ícone colorido do cartão */}
                  <div
                    className="w-12 h-8 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: card.color }}
                  >
                    <CardIcon className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium" style={{ color: "var(--text-primary)" }}>{card.name}</p>
                      {card.lastDigits && (
                        <span className="text-sm" style={{ color: "var(--text-dimmed)" }}>
                          •••• {card.lastDigits}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span style={{ color: "var(--text-dimmed)" }}>
                        Fecha dia {card.closingDay}
                      </span>
                      <span style={{ color: "var(--text-dimmed)" }}>•</span>
                      <span style={{ color: "var(--text-dimmed)" }}>
                        Vence dia {card.dueDay}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(displayTotal)}
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>
                      {displayTotal > 0 && displayInvoice
                        ? `Fatura ${displayInvoice.month}/${displayInvoice.year}`
                        : "Fatura atual"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteClick(e, card)}
                      disabled={deletingId === card.id}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      {deletingId === card.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      isSelected ? "rotate-90" : ""
                    }`} style={{ color: "var(--text-dimmed)" }} />
                  </div>
                </div>
              </div>

              {/* Barra de limite */}
              {card.limit > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-dimmed)" }}>
                    <span>Limite: {formatCurrency(card.limit)}</span>
                    <span className={usagePercent > 80 ? "text-red-400" : usagePercent > 50 ? "text-yellow-400" : ""}>
                      {usagePercent.toFixed(0)}% usado ({formatCurrency(usedLimit)})
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ backgroundColor: "var(--bg-hover)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(usagePercent, 100)}%`,
                        backgroundColor: usagePercent > 80
                          ? "#EF4444"
                          : usagePercent > 50
                            ? "#F59E0B"
                            : card.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir cartão"
        message={`Tem certeza que deseja excluir o cartão "${deleteConfirm?.name}"? Todas as compras e faturas serão removidas. Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={!!deletingId}
      />
    </div>
  );
}
