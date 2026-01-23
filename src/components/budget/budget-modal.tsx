"use client";

import { useState } from "react";
import { X, Wallet } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { category: string; limit: number; isFixed: boolean }) => Promise<void>;
  isSubmitting: boolean;
  existingCategories: string[];
}

export function BudgetModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  existingCategories,
}: BudgetModalProps) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [isFixed, setIsFixed] = useState(true);

  // Filtra categorias que já têm orçamento
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (cat) => !existingCategories.includes(cat)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !limit) return;

    await onSave({
      category,
      limit: parseFloat(limit),
      isFixed,
    });

    // Reset
    setCategory("");
    setLimit("");
    setIsFixed(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Wallet className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Novo Orçamento
              </h2>
              <p className="text-[var(--text-dimmed)] text-sm">
                Defina um limite mensal por categoria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Categoria
            </label>
            {availableCategories.length === 0 ? (
              <p className="text-sm text-[var(--text-dimmed)] bg-[var(--bg-hover)] rounded-xl p-4">
                Todas as categorias já possuem orçamento definido.
              </p>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-[var(--bg-secondary)]">
                  Selecione uma categoria
                </option>
                {availableCategories.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className="bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  >
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Limite */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Limite Mensal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                R$
              </span>
              <CurrencyInput
                value={limit}
                onChange={setLimit}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-5 h-5 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Orçamento fixo
                </span>
                <p className="text-xs text-[var(--text-dimmed)]">
                  Aplicar este limite todos os meses automaticamente
                </p>
              </div>
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !category || !limit || availableCategories.length === 0}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Criar Orçamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
