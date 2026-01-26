"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, Target, ChevronDown, Percent, Calendar, Info, Loader2, History } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { getInvestmentTypeLabel, getInvestmentTypeIcon } from "@/lib/constants";
import { isVariableIncome, isFixedIncome, INDEXER_TYPES } from "@/types";
import { formatRateDescription } from "@/lib/rates-service";
import { TransactionHistoryModal } from "./transaction-history-modal";
import type { Investment, UpdateInvestmentInput, IndexerType } from "@/types";

interface EditInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  onSave: (id: string, data: UpdateInvestmentInput) => Promise<void>;
  isSubmitting: boolean;
}

interface FormState {
  currentPrice: string;
  currentValue: string;
  totalInvested: string;
  goalValue: string;
  notes: string;

  interestRate: string;
  indexer: IndexerType;
  maturityDate: string;
  noMaturity: boolean;
}

interface YieldDetails {
  grossValue: number;
  grossYield: number;
  grossYieldPercent: number;
  iofAmount: number;
  iofPercent: number;
  irAmount: number;
  irPercent: number;
  netValue: number;
  netYield: number;
  netYieldPercent: number;
  businessDays: number;
  calendarDays: number;
}

function EditInvestmentForm({
  investment,
  onClose,
  onSave,
  isSubmitting,
}: {
  investment: Investment;
  onClose: () => void;
  onSave: (id: string, data: UpdateInvestmentInput) => Promise<void>;
  isSubmitting: boolean;
}) {

  const [form, setForm] = useState<FormState>({
    currentPrice: investment.currentPrice?.toString() || "",
    currentValue: investment.currentValue?.toString() || "",
    totalInvested: investment.totalInvested?.toString() || "",
    goalValue: investment.goalValue?.toString() || "",
    notes: investment.notes || "",

    interestRate: investment.interestRate?.toString() || "",
    indexer: (investment.indexer as IndexerType) || "CDI",
    maturityDate: investment.maturityDate
      ? new Date(investment.maturityDate).toISOString().split("T")[0]
      : "",
    noMaturity: !investment.maturityDate,
  });

  const [yieldDetails, setYieldDetails] = useState<YieldDetails | null>(null);
  const [isLoadingYield, setIsLoadingYield] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  const isFixed = isFixedIncome(investment.type);

  useEffect(() => {
    if (isFixed && investment.indexer && investment.indexer !== "NA") {
      setIsLoadingYield(true);
      fetch(`/api/investments/${investment.id}/yield`)
        .then(res => res.json())
        .then(data => {
          if (data.calculation) {
            setYieldDetails(data.calculation);
          }
        })
        .catch(err => console.error("Erro ao buscar rendimento:", err))
        .finally(() => setIsLoadingYield(false));
    }
  }, [isFixed, investment.id, investment.indexer]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: UpdateInvestmentInput = {
      notes: form.notes || undefined,
      goalValue: form.goalValue ? parseFloat(form.goalValue) : null,
    };

    if (isVariableIncome(investment.type)) {
      if (form.currentPrice) {
        data.currentPrice = parseFloat(form.currentPrice);
      }
    } else {
      if (form.currentValue) {
        data.currentValue = parseFloat(form.currentValue);
      }

      if (form.totalInvested) {
        data.totalInvested = parseFloat(form.totalInvested);
      }
    }

    if (isFixed) {
      data.interestRate = form.interestRate ? parseFloat(form.interestRate) : null;
      data.indexer = form.indexer;
      data.noMaturity = form.noMaturity;
      data.maturityDate = form.noMaturity ? null : (form.maturityDate ? new Date(form.maturityDate) : null);
    }

    await onSave(investment.id, data);
    onClose();
  };

  const isVariable = isVariableIncome(investment.type);

  const previewValue = isVariable && form.currentPrice
    ? investment.quantity * parseFloat(form.currentPrice)
    : parseFloat(form.currentValue) || investment.currentValue;

  const previewTotalInvested = isFixed && form.totalInvested
    ? parseFloat(form.totalInvested)
    : investment.totalInvested;

  const previewProfit = previewValue - previewTotalInvested;
  const previewPercent = previewTotalInvested > 0
    ? (previewProfit / previewTotalInvested) * 100
    : 0;

  const targetProgress = form.goalValue && parseFloat(form.goalValue) > 0
    ? (previewValue / parseFloat(form.goalValue)) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <style>{`
        .indexer-select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: none;
        }
        .indexer-select::-ms-expand {
          display: none;
        }
        .indexer-select option {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }
      `}</style>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col">
        {}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getInvestmentTypeIcon(investment.type)}</span>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {investment.ticker || investment.name}
              </h2>
              <p className="text-[var(--text-dimmed)] text-sm">
                {getInvestmentTypeLabel(investment.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Histórico de transações"
            >
              <History className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {}
        <TransactionHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          investment={investment}
        />

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {}
          <div className="bg-[var(--bg-hover)] rounded-xl p-4 space-y-2">
            {isVariable && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Total investido</span>
                  <span className="text-[var(--text-primary)]">{formatCurrency(investment.totalInvested)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Quantidade</span>
                  <span className="text-[var(--text-primary)]">{investment.quantity.toLocaleString("pt-BR")} cotas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Preço médio</span>
                  <span className="text-[var(--text-primary)]">{formatCurrency(investment.averagePrice)}</span>
                </div>
              </>
            )}
            {isFixed && investment.interestRate && investment.indexer && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Taxa atual</span>
                <span className="text-emerald-400 font-medium">
                  {formatRateDescription(investment.interestRate, investment.indexer)}
                </span>
              </div>
            )}
            {isFixed && investment.maturityDate && !form.noMaturity && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Vencimento</span>
                <span className="text-[var(--text-primary)]">
                  {new Date(investment.maturityDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
            {isFixed && form.noMaturity && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Vencimento</span>
                <span className="text-[var(--text-primary)]">Liquidez diária</span>
              </div>
            )}
          </div>

          {}
          {isFixed && investment.indexer && investment.indexer !== "NA" && (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Simulação de Rendimento</span>
                {isLoadingYield && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
              </div>

              {yieldDetails ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Dias corridos</span>
                    <span className="text-[var(--text-primary)]">{yieldDetails.calendarDays} dias ({yieldDetails.businessDays} úteis)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Rendimento bruto</span>
                    <span className="text-emerald-400 font-medium">
                      +{formatCurrency(yieldDetails.grossYield)} ({yieldDetails.grossYieldPercent.toFixed(2)}%)
                    </span>
                  </div>
                  {yieldDetails.iofAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)]">IOF ({yieldDetails.iofPercent}%)</span>
                      <span className="text-red-400">-{formatCurrency(yieldDetails.iofAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">IR ({yieldDetails.irPercent}%)</span>
                    <span className="text-red-400">-{formatCurrency(yieldDetails.irAmount)}</span>
                  </div>
                  <div className="border-t border-amber-500/20 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)]">Rendimento líquido</span>
                      <span className="text-emerald-400 font-semibold">
                        +{formatCurrency(yieldDetails.netYield)} ({yieldDetails.netYieldPercent.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-[var(--text-muted)]">Valor líquido estimado</span>
                      <span className="text-[var(--text-primary)] font-semibold">{formatCurrency(yieldDetails.netValue)}</span>
                    </div>
                  </div>
                </div>
              ) : !isLoadingYield ? (
                <p className="text-xs text-[var(--text-dimmed)]">
                  Clique em &quot;Nova Operação&quot; e registre um depósito para ver a simulação de rendimento.
                </p>
              ) : null}
            </div>
          )}

          {}
          {isFixed && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Total Investido
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
                <CurrencyInput
                  value={form.totalInvested}
                  onChange={(value) => handleChange("totalInvested", value)}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                Some todos os aportes realizados
              </p>
            </div>
          )}

          {}
          {isVariable ? (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Preço Atual por Cota
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
                <CurrencyInput
                  value={form.currentPrice}
                  onChange={(value) => handleChange("currentPrice", value)}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                Atualize com a cotação atual do ativo
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Saldo Atual
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
                <CurrencyInput
                  value={form.currentValue}
                  onChange={(value) => handleChange("currentValue", value)}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                Atualize com o saldo atual incluindo rendimentos
              </p>
            </div>
          )}

          {}
          {isFixed && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                    <Percent className="w-4 h-4 inline mr-1" />
                    Indexador
                  </label>
                  <div className="relative">
                    <select
                      value={form.indexer}
                      onChange={(e) => {
                        const newIndexer = e.target.value;
                        handleChange("indexer", newIndexer);
                        if (newIndexer === "NA") handleChange("interestRate", "");
                      }}
                      className="indexer-select w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 pr-10 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                    >
                      {INDEXER_TYPES.map((idx) => (
                        <option key={idx.value} value={idx.value}>
                          {idx.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                    Taxa (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.indexer === "NA" ? "" : form.interestRate}
                    onChange={(e) => handleChange("interestRate", e.target.value)}
                    placeholder={form.indexer === "CDI" ? "Ex: 100" : form.indexer === "NA" ? "-" : "Ex: 5.5"}
                    disabled={form.indexer === "NA"}
                    className={`w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all ${form.indexer === "NA" ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>
              </div>
              {form.interestRate && form.indexer !== "NA" && (
                <div className="bg-[var(--bg-hover)] rounded-xl p-3 -mt-2">
                  <p className="text-sm text-[var(--text-primary)]">
                    Taxa contratada: <span className="font-semibold">{formatRateDescription(parseFloat(form.interestRate), form.indexer)}</span>
                  </p>
                </div>
              )}

              {}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Vencimento
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.noMaturity}
                      onChange={(e) => handleChange("noMaturity", e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs text-[var(--text-muted)]">Sem vencimento</span>
                  </label>
                </div>
                {form.noMaturity && (
                  <div className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-dimmed)]">
                    Liquidez diária (sem vencimento)
                  </div>
                )}
                {!form.noMaturity && (
                  <input
                    type="date"
                    value={form.maturityDate}
                    onChange={(e) => handleChange("maturityDate", e.target.value)}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                  />
                )}
              </div>
            </>
          )}

          {}
          {(form.currentPrice || form.currentValue || (isFixed && form.totalInvested)) && (
            <div className="bg-[var(--bg-hover)] rounded-xl p-4">
              {isFixed && form.totalInvested && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)] text-sm">Total investido</span>
                  <span className="text-[var(--text-primary)] font-semibold">{formatCurrency(previewTotalInvested)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] text-sm">Saldo atual</span>
                <span className="text-[var(--text-primary)] font-semibold">{formatCurrency(previewValue)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[var(--text-muted)] text-sm">Rentabilidade</span>
                <span className={`font-semibold ${previewProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {previewProfit >= 0 ? "+" : ""}{formatCurrency(previewProfit)} ({previewPercent >= 0 ? "+" : ""}{previewPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              Meta (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
              <CurrencyInput
                value={form.goalValue}
                onChange={(value) => handleChange("goalValue", value)}
                placeholder="10.000,00"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>
          </div>

          {}
          {form.goalValue && parseFloat(form.goalValue) > 0 && (
            <div className="bg-[var(--bg-hover)] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[var(--text-muted)] text-sm">Progresso da meta</span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {Math.min(targetProgress, 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[var(--bg-hover-strong)] rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    targetProgress >= 100
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-primary-gradient"
                  }`}
                  style={{ width: `${Math.min(targetProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-[var(--text-dimmed)]">{formatCurrency(previewValue)}</span>
                <span className="text-[var(--text-dimmed)]">{formatCurrency(parseFloat(form.goalValue))}</span>
              </div>
              {targetProgress >= 100 && (
                <p className="text-emerald-400 text-sm mt-2 text-center">🎉 Meta alcançada!</p>
              )}
            </div>
          )}

          {}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Anotações..."
              rows={2}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-none"
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
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white hover:opacity-90 transition-all shadow-lg shadow-primary disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditInvestmentModal({
  isOpen,
  onClose,
  investment,
  onSave,
  isSubmitting,
}: EditInvestmentModalProps) {

  if (!isOpen || !investment) return null;

  return (
    <EditInvestmentForm
      key={investment.id}
      investment={investment}
      onClose={onClose}
      onSave={onSave}
      isSubmitting={isSubmitting}
    />
  );
}