"use client";

import { useState, useEffect } from "react";
import { X, Target, Sparkles } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_COLORS,
  GOAL_CATEGORY_ICONS,
  type GoalCategoryType,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface EmergencySuggestion {
  suggestedTarget: number;
  estimatedMonthlyExpenses: number;
  monthsAnalyzed: number;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    category: GoalCategoryType;
    targetValue: number;
    currentValue?: number;
    targetDate?: string;
    color?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function GoalModal({ isOpen, onClose, onSave, isSubmitting }: GoalModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategoryType | "">("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [emergencySuggestion, setEmergencySuggestion] = useState<EmergencySuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    if (category === "emergency" && !emergencySuggestion) {
      setLoadingSuggestion(true);
      fetch("/api/goals/emergency-suggestion")
        .then((res) => res.json())
        .then((data) => {
          setEmergencySuggestion(data);
        })
        .catch(console.error)
        .finally(() => setLoadingSuggestion(false));
    }
  }, [category, emergencySuggestion]);

  useEffect(() => {
    if (category && !name) {
      setName(GOAL_CATEGORY_LABELS[category as GoalCategoryType]);
    }
  }, [category, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !targetValue) return;

    await onSave({
      name,
      description: description || undefined,
      category: category as GoalCategoryType,
      targetValue: parseFloat(targetValue),
      currentValue: currentValue ? parseFloat(currentValue) : undefined,
      targetDate: targetDate || undefined,
      color: GOAL_CATEGORY_COLORS[category as GoalCategoryType],
    });

    setName("");
    setDescription("");
    setCategory("");
    setTargetValue("");
    setCurrentValue("");
    setTargetDate("");
    setEmergencySuggestion(null);
  };

  const applySuggestion = () => {
    if (emergencySuggestion) {
      setTargetValue(emergencySuggestion.suggestedTarget.toString());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col">
        {}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Target className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Nova Meta
              </h2>
              <p className="text-[var(--text-dimmed)] text-sm">
                Defina seu objetivo financeiro
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

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Tipo de Meta
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    if (cat !== "emergency") {
                      setEmergencySuggestion(null);
                    }
                  }}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    category === cat
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-[var(--border-color)] hover:border-[var(--border-color-strong)]"
                  }`}
                >
                  <span className="text-xl">{GOAL_CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs text-[var(--text-muted)] text-center leading-tight">
                    {GOAL_CATEGORY_LABELS[cat].split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {}
          {category === "emergency" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                  Sugestão Automática
                </span>
              </div>
              {loadingSuggestion ? (
                <p className="text-sm text-[var(--text-dimmed)]">Calculando...</p>
              ) : emergencySuggestion ? (
                <>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    Baseado nas suas despesas de{" "}
                    <strong>{formatCurrency(emergencySuggestion.estimatedMonthlyExpenses)}/mês</strong>,
                    recomendamos uma reserva de:
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-red-400">
                      {formatCurrency(emergencySuggestion.suggestedTarget)}
                    </span>
                    <button
                      type="button"
                      onClick={applySuggestion}
                      className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                      Usar valor
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-dimmed)] mt-1">
                    = 6 meses de despesas
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--text-dimmed)]">
                  Adicione transações para calcular automaticamente
                </p>
              )}
            </div>
          )}

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Nome da Meta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem para Europa"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              required
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Valor Objetivo
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                R$
              </span>
              <CurrencyInput
                value={targetValue}
                onChange={setTargetValue}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                required
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Já tenho guardado (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                R$
              </span>
              <CurrencyInput
                value={currentValue}
                onChange={setCurrentValue}
                placeholder="0,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Data Prevista (opcional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
            <p className="mt-1 text-xs text-[var(--text-dimmed)]">
              Usada para calcular quanto guardar por mês
            </p>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anotações sobre a meta..."
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          {}
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
              disabled={isSubmitting || !name || !category || !targetValue}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Criar Meta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
