"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronLeft, ArrowRight, PiggyBank, AlertTriangle, Wallet } from "lucide-react";
import { formatDateForInput, formatCurrency } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  INVESTMENT_TYPES,
  getInvestmentTypeLabel,
  getInvestmentTypeIcon,
} from "@/lib/constants";
import { isFixedIncome, INDEXER_TYPES } from "@/types";
import type { CreateInvestmentInput, InvestmentType, IndexerType } from "@/types";

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInvestmentInput) => Promise<void>;
  isSubmitting: boolean;
}

export function InvestmentModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting,
}: InvestmentModalProps) {

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [type, setType] = useState<InvestmentType>("stock");
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");

  const [interestRate, setInterestRate] = useState("");
  const [indexer, setIndexer] = useState<IndexerType>("CDI");
  const [maturityDate, setMaturityDate] = useState("");
  const [noMaturity, setNoMaturity] = useState(false);

  const [initialDeposit, setInitialDeposit] = useState("");
  const [depositDate, setDepositDate] = useState(formatDateForInput(new Date()));

  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [skipBalanceCheck, setSkipBalanceCheck] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const showFixedIncomeFields = isFixedIncome(type);
  const depositValue = parseFloat(initialDeposit) || 0;
  const hasInsufficientBalance = availableBalance !== null && depositValue > availableBalance && !skipBalanceCheck;

  useEffect(() => {
    if (isOpen) {
      setIsLoadingBalance(true);
      fetch("/api/balance")
        .then((res) => res.json())
        .then((data) => {
          setAvailableBalance(data.balance);
        })
        .catch(() => {
          setAvailableBalance(null);
        })
        .finally(() => {
          setIsLoadingBalance(false);
        });
    }
  }, [isOpen]);

  const handleSelectType = (selectedType: InvestmentType) => {
    setType(selectedType);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const handleAdvanceToDeposit = () => {

    if (!name) return;
    setStep(3);
  };

  const handleClose = () => {

    setStep(1);
    setType("stock");
    setName("");
    setTicker("");
    setInstitution("");
    setNotes("");
    setInterestRate("");
    setIndexer("CDI");
    setMaturityDate("");
    setNoMaturity(false);
    setInitialDeposit("");
    setDepositDate(formatDateForInput(new Date()));
    setSkipBalanceCheck(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (showFixedIncomeFields) {
      const depositValue = parseFloat(initialDeposit);
      if (!depositValue || depositValue < 1) {
        alert("O depósito inicial deve ser de pelo menos R$ 1,00");
        return;
      }
    }

    const data: CreateInvestmentInput = {
      type,
      name,
      ticker: ticker || undefined,
      institution: institution || undefined,
      notes: notes || undefined,
    };

    if (showFixedIncomeFields) {
      if (interestRate) data.interestRate = parseFloat(interestRate);
      data.indexer = indexer;
      if (!noMaturity && maturityDate) data.maturityDate = new Date(maturityDate);

      data.initialDeposit = parseFloat(initialDeposit);
      data.depositDate = new Date(depositDate);

      data.skipBalanceCheck = skipBalanceCheck;
    }

    await onSave(data);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
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
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
        {}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color-strong)] sticky top-0 bg-[var(--bg-secondary)] z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            {(step === 2 || step === 3) && (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover-strong)] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
                {step === 1 ? "Novo Investimento" : step === 3 ? "Depósito Inicial" : "Detalhes do Ativo"}
              </h2>
              {(step === 2 || step === 3) && (
                <p className="text-xs sm:text-sm text-[var(--text-dimmed)] flex items-center gap-1.5 mt-0.5">
                  <span className="text-base sm:text-lg">{getInvestmentTypeIcon(type)}</span>
                  {getInvestmentTypeLabel(type)}
                  {showFixedIncomeFields && (
                    <span className="text-[var(--text-dimmed)]">• {step === 2 ? "1" : "2"}/2</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover-strong)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {}
        {step === 1 && (
          <div className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-3 sm:mb-4">
              Selecione o tipo de investimento:
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {INVESTMENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSelectType(t)}
                  className="p-2.5 sm:p-4 rounded-xl text-center transition-all bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] active:bg-[var(--bg-hover-strong)] hover:text-[var(--text-primary)] border border-transparent hover:border-[color-mix(in_srgb,var(--color-primary)_50%,transparent)] group"
                >
                  <span className="text-xl sm:text-2xl block mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                    {getInvestmentTypeIcon(t)}
                  </span>
                  <span className="text-[10px] sm:text-xs font-medium">{getInvestmentTypeLabel(t)}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4 sm:mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-5 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] active:bg-[var(--bg-hover-strong)] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Nome do Ativo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  showFixedIncomeFields
                    ? "Ex: CDB Nubank 100% CDI, Tesouro Selic 2029"
                    : "Ex: Petrobras, Bitcoin, IVVB11"
                }
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                autoFocus
                required
              />
            </div>

            {}
            {!showFixedIncomeFields && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Ticker/Código
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Ex: PETR4, BTC, IVVB11"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all uppercase"
                />
              </div>
            )}

            {}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                {showFixedIncomeFields ? "Banco/Corretora" : "Corretora"}
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={showFixedIncomeFields ? "Ex: Nubank, XP, Inter" : "Ex: XP, Clear, Rico"}
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>

            {}
            {showFixedIncomeFields && (
              <>
                {}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                      Indexador
                    </label>
                    <div className="relative">
                      <select
                        value={indexer}
                        onChange={(e) => {
                          const newIndexer = e.target.value as IndexerType;
                          setIndexer(newIndexer);
                          if (newIndexer === "NA") setInterestRate("");
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
                      value={indexer === "NA" ? "" : interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder={indexer === "CDI" ? "100" : indexer === "NA" ? "-" : "5.5"}
                      disabled={indexer === "NA"}
                      className={`w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all ${indexer === "NA" ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                  </div>
                </div>
                {indexer !== "NA" && (
                  <p className="text-xs text-[var(--text-dimmed)] -mt-2">
                    {indexer === "CDI" && "Ex: 100 para 100% do CDI"}
                    {indexer === "IPCA" && "Ex: 5.5 para IPCA + 5,5%"}
                    {indexer === "SELIC" && "Ex: 0 para apenas SELIC"}
                    {indexer === "PREFIXADO" && "Ex: 12.5 para 12,5% a.a."}
                  </p>
                )}

                {}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">
                      Vencimento
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noMaturity}
                        onChange={(e) => {
                          setNoMaturity(e.target.checked);
                          if (e.target.checked) setMaturityDate("");
                        }}
                        className="w-4 h-4 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text-muted)]">Sem vencimento</span>
                    </label>
                  </div>
                  {noMaturity ? (
                    <div className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-dimmed)]">
                      Liquidez diária (sem vencimento)
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={maturityDate}
                      onChange={(e) => setMaturityDate(e.target.value)}
                      className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    />
                  )}
                </div>

              </>
            )}

            {}
            {!showFixedIncomeFields && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações opcionais..."
                  rows={2}
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-none"
                />
              </div>
            )}

            {}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              {showFixedIncomeFields ? (
                <button
                  type="button"
                  onClick={handleAdvanceToDeposit}
                  disabled={!name}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Avançar
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !name}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary-gradient text-white transition-all shadow-lg shadow-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Salvando..." : "Criar Ativo"}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </form>
        )}

        {}
        {step === 3 && showFixedIncomeFields && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {}
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-muted)]">Saldo Disponível:</span>
              </div>
              <span className={`font-medium ${availableBalance !== null && availableBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {isLoadingBalance ? "Carregando..." : availableBalance !== null ? formatCurrency(availableBalance) : "—"}
              </span>
            </div>

            {}
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">Ativo:</span>
              <span className="text-[var(--text-primary)] font-medium">
                {name}{institution && ` • ${institution}`}
              </span>
            </div>

            {}
            <div className={`bg-gradient-to-br ${hasInsufficientBalance ? 'from-red-500/10 to-orange-500/10 border-red-500/20' : 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20'} border rounded-xl p-4 space-y-4`}>
              <div className="flex items-center gap-2">
                <PiggyBank className={`w-4 h-4 ${hasInsufficientBalance ? 'text-red-400' : 'text-emerald-400'}`} />
                <span className={`text-sm font-medium ${hasInsufficientBalance ? 'text-red-400' : 'text-emerald-400'}`}>Depósito Inicial</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Valor *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">R$</span>
                  <CurrencyInput
                    value={initialDeposit}
                    onChange={setInitialDeposit}
                    placeholder="0,00"
                    className={`w-full bg-[var(--bg-hover)] border rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none transition-all ${hasInsufficientBalance ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[var(--border-color-strong)] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {}
              {hasInsufficientBalance && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-red-400 font-medium">Saldo insuficiente</p>
                    <p className="text-[var(--text-muted)] text-xs mt-0.5">
                      Você precisa de {formatCurrency(depositValue)} mas tem apenas {formatCurrency(availableBalance || 0)} disponível.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Data do Depósito *
                </label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  max={formatDateForInput(new Date())}
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              <p className="text-xs text-[var(--text-dimmed)]">
                Mínimo R$ 1,00. Novas operações só podem ser registradas a partir desta data.
              </p>
            </div>

            {}
            <div className="bg-[var(--bg-hover)] rounded-xl p-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipBalanceCheck}
                  onChange={(e) => setSkipBalanceCheck(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-primary-color focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
                />
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Investimento já existente</span>
                  <p className="text-xs text-[var(--text-dimmed)] mt-0.5">
                    Marque esta opção se você já tinha esse investimento antes de usar o sistema. O valor não será descontado do seu saldo.
                  </p>
                </div>
              </label>
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações opcionais..."
                rows={2}
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-primary-color focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-none"
              />
            </div>

            {}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !initialDeposit || parseFloat(initialDeposit) < 1 || hasInsufficientBalance}
                className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Salvando..." : skipBalanceCheck ? "Criar (Sem Desconto)" : "Criar Ativo"}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
