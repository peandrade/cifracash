"use client";

import { useState } from "react";
import { Calendar, Check, Trash2, ShoppingBag, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  formatMonthYear,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
  getCategoryColor,
  getMonthName,
  getShortMonthName,
} from "@/lib/card-constants";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Invoice, Purchase } from "@/types/credit-card";

interface InvoiceDetailProps {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  cardName: string;
  cardColor: string;
  onSelectInvoice: (invoice: Invoice) => void;
  onPayInvoice: (invoiceId: string) => void;
  onDeletePurchase: (purchaseId: string) => void;
  isLoading: boolean;
}

const cardStyle = {
  backgroundColor: "var(--card-bg)",
  borderWidth: "1px",
  borderStyle: "solid" as const,
  borderColor: "var(--border-color)"
};

export function InvoiceDetail({
  invoices,
  selectedInvoice,
  cardName,
  cardColor,
  onSelectInvoice,
  onPayInvoice,
  onDeletePurchase,
  isLoading,
}: InvoiceDetailProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<Purchase | null>(null);

  const handleDeleteClick = (purchase: Purchase) => {
    setDeleteConfirm(purchase);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeletePurchase(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (!cardName) {
    return (
      <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Detalhes da Fatura</h3>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-dimmed)" }} />
          <p style={{ color: "var(--text-dimmed)" }}>Selecione um cartão para ver a fatura</p>
        </div>
      </div>
    );
  }

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const currentIndex = selectedInvoice
    ? sortedInvoices.findIndex((inv) => inv.id === selectedInvoice.id)
    : -1;

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < sortedInvoices.length - 1;

  if (!selectedInvoice) {
    const now = new Date();
    return (
      <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cardColor }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{cardName}</h3>
            </div>
            <p style={{ color: "var(--text-muted)" }}>{getMonthName(now.getMonth() + 1)} {now.getFullYear()}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
            Aberta
          </span>
        </div>

        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: "var(--bg-hover)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Total da Fatura</p>
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(0)}</p>
        </div>

        <div className="text-center py-8">
          <ShoppingBag className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-dimmed)" }} />
          <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>Nenhum lançamento neste cartão</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-dimmed)" }}>Clique em &quot;Nova Compra&quot; para adicionar</p>
        </div>
      </div>
    );
  }

  const statusColor = getInvoiceStatusColor(selectedInvoice.status);
  const dueDate = new Date(selectedInvoice.dueDate);
  const isOverdue = selectedInvoice.status !== "paid" && dueDate < new Date();

  return (
    <div className="backdrop-blur rounded-2xl p-6 transition-colors duration-300" style={cardStyle}>
      {}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cardColor }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{cardName}</h3>
            </div>
          </div>
        </div>

        {}
        <div className="flex items-center gap-2">
          <button
            onClick={() => canGoPrevious && onSelectInvoice(sortedInvoices[currentIndex - 1])}
            disabled={!canGoPrevious}
            className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>

          <div className="flex items-center gap-1 overflow-x-auto max-w-md pb-1">
            {sortedInvoices.map((invoice) => {
              const isSelected = selectedInvoice?.id === invoice.id;
              const hasValue = invoice.total > 0;

              return (
                <button
                  key={invoice.id}
                  onClick={() => onSelectInvoice(invoice)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-violet-600 text-white"
                      : ""
                  }`}
                  style={!isSelected ? {
                    backgroundColor: hasValue ? "var(--bg-hover-strong)" : "var(--bg-hover)",
                    color: hasValue ? "var(--text-primary)" : "var(--text-dimmed)"
                  } : undefined}
                >
                  {getShortMonthName(invoice.month)}/{String(invoice.year).slice(2)}
                  {hasValue && !isSelected && (
                    <span className="ml-1 w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => canGoNext && onSelectInvoice(sortedInvoices[currentIndex + 1])}
            disabled={!canGoNext}
            className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>

          <span
            className="ml-2 px-3 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {isOverdue ? "Vencida" : getInvoiceStatusLabel(selectedInvoice.status)}
          </span>
        </div>
      </div>

      {}
      <p className="mb-4" style={{ color: "var(--text-muted)" }}>{formatMonthYear(selectedInvoice.month, selectedInvoice.year)}</p>

      {}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: "var(--bg-hover)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Total da Fatura</p>
            <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(selectedInvoice.total)}</p>
          </div>
          {selectedInvoice.status !== "paid" && selectedInvoice.total > 0 && (
            <button
              onClick={() => onPayInvoice(selectedInvoice.id)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-medium transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Pagar Fatura
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: "var(--text-dimmed)" }} />
            <span style={{ color: "var(--text-muted)" }}>
              Vence: {dueDate.toLocaleDateString("pt-BR")}
            </span>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>Fatura vencida!</span>
            </div>
          )}
        </div>
      </div>

      {}
      <div>
        <h4 className="font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Lançamentos ({selectedInvoice.purchases?.length || 0})
        </h4>

        {!selectedInvoice.purchases || selectedInvoice.purchases.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-dimmed)" }} />
            <p className="text-sm" style={{ color: "var(--text-dimmed)" }}>Nenhum lançamento nesta fatura</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {selectedInvoice.purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between p-3 rounded-xl transition-all group"
                style={{ backgroundColor: "var(--bg-hover)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-10 rounded-full"
                    style={{ backgroundColor: getCategoryColor(purchase.category) }}
                  />
                  <div>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{purchase.description}</p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-dimmed)" }}>
                      <span>{purchase.category}</span>
                      <span>•</span>
                      <span>{new Date(purchase.date).toLocaleDateString("pt-BR")}</span>
                      {purchase.installments > 1 && (
                        <>
                          <span>•</span>
                          <span className="text-violet-400">
                            {purchase.currentInstallment}/{purchase.installments}
                          </span>
                        </>
                      )}
                      {purchase.isRecurring && (
                        <>
                          <span>•</span>
                          <span className="text-blue-400">Recorrente</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(purchase.value)}</p>
                  <button
                    onClick={() => handleDeleteClick(purchase)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir compra"
        message={`Tem certeza que deseja excluir "${deleteConfirm?.description}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  );
}
