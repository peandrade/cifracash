"use client";

import { useState, useId, useEffect } from "react";
import { X, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useCurrency } from "@/contexts/currency-context";

type OperationType = "deposit" | "withdraw";

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number, notes?: string, operationType?: OperationType) => Promise<void>;
  isSubmitting: boolean;
  goalName: string;
  remaining: number;
  currentValue: number;
  isCompleted?: boolean;
}

export function ContributeModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  goalName,
  remaining,
  currentValue,
  isCompleted = false,
}: ContributeModalProps) {
  const t = useTranslations("goals");
  const tc = useTranslations("common");
  const { formatCurrency, currencySymbol, convertToBRL } = useCurrency();
  const titleId = useId();
  const [operationType, setOperationType] = useState<OperationType>("deposit");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const isDeposit = operationType === "deposit";
  const maxValue = isDeposit ? remaining : currentValue;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setValue("");
      setNotes("");
      // If goal is completed, default to withdraw
      setOperationType(isCompleted ? "withdraw" : "deposit");
    }
  }, [isOpen, isCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    await onSave(convertToBRL(parseFloat(value)), notes || undefined, operationType);

    setValue("");
    setNotes("");
  };

  const setMaxValue = () => {
    setValue(maxValue.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-sm shadow-2xl animate-slideUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)]">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)]">
              {t("contribute")}
            </h2>
            <p className="text-[var(--text-dimmed)] text-sm truncate max-w-[200px]">
              {goalName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={tc("close")}
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Operation Type Selector */}
          <div className="flex gap-2" role="group" aria-label={t("operationType")}>
            <button
              type="button"
              onClick={() => setOperationType("deposit")}
              disabled={isCompleted}
              aria-pressed={operationType === "deposit"}
              className={`flex-1 py-3 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                operationType === "deposit"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
              } ${isCompleted ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ArrowDownCircle className="w-4 h-4" aria-hidden="true" />
              <span>{t("depositLabel")}</span>
            </button>

            <button
              type="button"
              onClick={() => setOperationType("withdraw")}
              disabled={currentValue <= 0}
              aria-pressed={operationType === "withdraw"}
              className={`flex-1 py-3 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                operationType === "withdraw"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
              } ${currentValue <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ArrowUpCircle className="w-4 h-4" aria-hidden="true" />
              <span>{t("withdrawLabel")}</span>
            </button>
          </div>

          {/* Info card */}
          <div className="bg-[var(--bg-hover)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--text-dimmed)] mb-1">
              {isDeposit ? t("remaining") : t("currentlySaved")}
            </p>
            <p className={`text-lg font-bold ${isDeposit ? "text-emerald-400" : "text-amber-400"}`}>
              {formatCurrency(maxValue)}
            </p>
          </div>

          {/* Transaction info */}
          <div className={`text-xs text-center p-2 rounded-lg ${isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
            {isDeposit ? t("depositInfo") : t("withdrawInfo")}
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {isDeposit ? t("amountToDeposit") : t("amountToWithdraw")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                {currencySymbol}
              </span>
              <CurrencyInput
                value={value}
                onChange={setValue}
                placeholder="0,00"
                className={`w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-20 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none transition-all ${
                  isDeposit
                    ? "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    : "focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                }`}
                autoFocus
                required
              />
              {maxValue > 0 && (
                <button
                  type="button"
                  onClick={setMaxValue}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg transition-colors font-medium ${
                    isDeposit
                      ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                  }`}
                >
                  MAX
                </button>
              )}
            </div>
          </div>

          {/* Notes input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              {t("observationOptional")}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isDeposit ? t("depositNotePlaceholder") : t("withdrawNotePlaceholder")}
              className={`w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none transition-all ${
                isDeposit
                  ? "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  : "focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              }`}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !value}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-lg disabled:opacity-50 ${
                isDeposit
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 shadow-emerald-500/25"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/25"
              }`}
            >
              {isSubmitting ? tc("saving") : (isDeposit ? t("depositButton") : t("withdrawButton"))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
