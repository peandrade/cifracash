"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, PiggyBank, Wallet, Hash, DollarSign, AlertTriangle } from "lucide-react";
import { formatDateForInput, parseDateFromDB, formatDateFromDB, formatCurrency } from "@/lib/utils";
import { isFixedIncome } from "@/types";
import { CurrencyInput } from "@/components/ui/currency-input";
import type { Investment, CreateOperationInput, OperationType } from "@/types";

type SellMode = "quantity" | "value";

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  onSave: (data: CreateOperationInput) => Promise<void>;
  isSubmitting: boolean;
}

export function OperationModal({
  isOpen,
  onClose,
  investment,
  onSave,
  isSubmitting,
}: OperationModalProps) {
  const [type, setType] = useState<OperationType>("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [totalValue, setTotalValue] = useState(""); // Para renda fixa
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [fees, setFees] = useState("");
  const [notes, setNotes] = useState("");

  // Modo de venda: por quantidade ou por valor
  const [sellMode, setSellMode] = useState<SellMode>("quantity");
  const [sellTargetValue, setSellTargetValue] = useState(""); // Valor desejado para venda

  // Controle de saldo
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [skipBalanceCheck, setSkipBalanceCheck] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const isFixed = investment ? isFixedIncome(investment.type) : false;

  // Calcula quantidade automaticamente quando vender por valor
  const priceNum = parseFloat(price) || 0;
  const sellTargetNum = parseFloat(sellTargetValue) || 0;
  const calculatedQuantity = priceNum > 0 && sellTargetNum > 0
    ? Math.floor((sellTargetNum / priceNum) * 1000000) / 1000000 // Arredonda para baixo com 6 casas
    : 0;
  const calculatedValue = calculatedQuantity * priceNum;

  // Atualiza quantidade quando calcular por valor
  useEffect(() => {
    if (type === "sell" && sellMode === "value" && calculatedQuantity > 0) {
      setQuantity(calculatedQuantity.toString());
    }
  }, [calculatedQuantity, type, sellMode]);

  // Reset sellMode quando muda o tipo de operação
  useEffect(() => {
    if (type === "buy") {
      setSellMode("quantity");
      setSellTargetValue("");
    }
  }, [type]);

  // Busca o saldo disponível quando abrir o modal
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investment) return;

    // Para renda fixa, usa valor total com quantidade 1
    if (isFixed) {
      if (!totalValue) return;
      await onSave({
        investmentId: investment.id,
        type, // buy = depósito, sell = resgate
        quantity: 1,
        price: parseFloat(totalValue),
        date: new Date(date),
        fees: fees ? parseFloat(fees) : 0,
        notes: notes || undefined,
        skipBalanceCheck: type === "buy" ? skipBalanceCheck : undefined,
      });
    } else {
      if (!quantity || !price) return;
      await onSave({
        investmentId: investment.id,
        type,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        date: new Date(date),
        fees: fees ? parseFloat(fees) : 0,
        notes: notes || undefined,
        skipBalanceCheck: type === "buy" ? skipBalanceCheck : undefined,
      });
    }

    // Reset
    setType("buy");
    setQuantity("");
    setPrice("");
    setTotalValue("");
    setDate(formatDateForInput(new Date()));
    setFees("");
    setNotes("");
    setSellMode("quantity");
    setSellTargetValue("");
    setSkipBalanceCheck(false);
    onClose();
  };

  const total = isFixed
    ? (parseFloat(totalValue) || 0) + (parseFloat(fees) || 0)
    : (parseFloat(quantity) || 0) * (parseFloat(price) || 0) + (parseFloat(fees) || 0);

  // Validação de limites para venda/resgate
  const quantityNum = parseFloat(quantity) || 0;
  const totalValueNum = parseFloat(totalValue) || 0;

  const exceedsQuantity = !isFixed && type === "sell" && investment && quantityNum > investment.quantity;
  const exceedsValue = isFixed && type === "sell" && investment && totalValueNum > investment.currentValue;
  const exceedsSellTargetValue = !isFixed && type === "sell" && sellMode === "value" && investment && sellTargetNum > investment.currentValue;
  const hasExcessError = exceedsQuantity || exceedsValue || exceedsSellTargetValue;

  // Verificação de saldo insuficiente para compra/depósito
  const hasInsufficientBalance = type === "buy" && availableBalance !== null && total > availableBalance && !skipBalanceCheck;

  if (!isOpen || !investment) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-md shadow-2xl animate-slideUp max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color-strong)] flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Nova Operação</h2>
            <p className="text-[var(--text-dimmed)] text-sm">
              {investment.ticker || investment.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Tipo de operação */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType("buy")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                type === "buy"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
              }`}
            >
              {isFixed ? <PiggyBank className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {isFixed ? "Depósito" : "Compra"}
            </button>
            <button
              type="button"
              onClick={() => setType("sell")}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                type === "sell"
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
              }`}
            >
              {isFixed ? <Wallet className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isFixed ? "Resgate" : "Venda"}
            </button>
          </div>

          {/* Saldo Disponível - apenas para compra/depósito */}
          {type === "buy" && (
            <div className="bg-[var(--bg-hover)] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-muted)]">Saldo Disponível:</span>
              </div>
              <span className={`font-medium ${availableBalance !== null && availableBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {isLoadingBalance ? "Carregando..." : availableBalance !== null ? formatCurrency(availableBalance) : "—"}
              </span>
            </div>
          )}

          {/* Campos para Renda Variável */}
          {!isFixed && (
            <>
              {/* Preço Unitário - sempre aparece primeiro */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  Preço Unitário
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                    R$
                  </span>
                  <CurrencyInput
                    value={price}
                    onChange={setPrice}
                    placeholder="0,00"
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    required
                  />
                </div>
                {type === "sell" && investment.currentPrice > 0 && (
                  <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                    Último preço: R$ {investment.currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {/* Seleção de modo de venda - apenas para venda */}
              {type === "sell" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                    Vender por
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSellMode("quantity");
                        setSellTargetValue("");
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                        sellMode === "quantity"
                          ? "bg-violet-600 text-white"
                          : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
                      }`}
                    >
                      <Hash className="w-4 h-4" />
                      Quantidade
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellMode("value")}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                        sellMode === "value"
                          ? "bg-violet-600 text-white"
                          : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)]"
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Valor
                    </button>
                  </div>
                </div>
              )}

              {/* Campo de valor desejado - apenas para venda por valor */}
              {type === "sell" && sellMode === "value" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">
                      Valor Desejado
                    </label>
                    {investment.currentValue > 0 && (
                      <button
                        type="button"
                        onClick={() => setSellTargetValue(investment.currentValue.toString())}
                        className="text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 rounded-md transition-all"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                      R$
                    </span>
                    <CurrencyInput
                      value={sellTargetValue}
                      onChange={setSellTargetValue}
                      placeholder="0,00"
                      className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  {investment.currentValue > 0 && (
                    <p className={`mt-1 text-xs ${exceedsSellTargetValue ? "text-red-400 font-medium" : "text-[var(--text-dimmed)]"}`}>
                      {exceedsSellTargetValue
                        ? `Valor excede o disponível (R$ ${investment.currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                        : `Valor total disponível: R$ ${investment.currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </p>
                  )}

                  {/* Preview do cálculo */}
                  {calculatedQuantity > 0 && priceNum > 0 && (
                    <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                      <p className="text-sm text-violet-400 font-medium mb-1">Cálculo automático:</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Cotas a vender:</span>
                        <span className="text-[var(--text-primary)] font-medium">
                          {calculatedQuantity.toLocaleString("pt-BR", { maximumFractionDigits: 6 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-[var(--text-muted)]">Valor real:</span>
                        <span className="text-[var(--text-primary)] font-medium">
                          R$ {calculatedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {calculatedValue !== sellTargetNum && (
                        <p className="text-xs text-violet-400/70 mt-2">
                          * Valor arredondado para baixo (cotas inteiras ou fração disponível)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quantidade - para compra ou venda por quantidade */}
              {(type === "buy" || sellMode === "quantity") && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">
                      Quantidade
                    </label>
                    {type === "sell" && investment.quantity > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuantity(investment.quantity.toString())}
                        className="text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 rounded-md transition-all"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.000001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    required
                  />
                  {type === "sell" && investment.quantity > 0 && (
                    <p className={`mt-1 text-xs ${exceedsQuantity ? "text-red-400 font-medium" : "text-[var(--text-dimmed)]"}`}>
                      {exceedsQuantity
                        ? `Quantidade excede o disponível (${investment.quantity.toLocaleString("pt-BR")} cotas)`
                        : `Disponível: ${investment.quantity.toLocaleString("pt-BR")} cotas`
                      }
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Campo de Valor para Renda Fixa */}
          {isFixed && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--text-muted)]">
                  {type === "buy" ? "Valor do Depósito" : "Valor do Resgate"}
                </label>
                {type === "sell" && investment.currentValue > 0 && (
                  <button
                    type="button"
                    onClick={() => setTotalValue(investment.currentValue.toString())}
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 rounded-md transition-all"
                  >
                    MAX
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                  R$
                </span>
                <CurrencyInput
                  value={totalValue}
                  onChange={setTotalValue}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  required
                />
              </div>
              {type === "sell" && investment.currentValue > 0 && (
                <p className={`mt-1 text-xs ${exceedsValue ? "text-red-400 font-medium" : "text-[var(--text-dimmed)]"}`}>
                  {exceedsValue
                    ? `Valor excede o saldo disponível (R$ ${investment.currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                    : `Saldo atual: R$ ${investment.currentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </p>
              )}
            </div>
          )}

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Data da Operação
            </label>
            {(() => {
              // Calcula a data mínima (última operação)
              const lastOpDate = investment.operations && investment.operations.length > 0
                ? [...investment.operations].sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  )[0].date
                : null;
              // Usa as funções que ignoram timezone
              const minDateStr = lastOpDate ? parseDateFromDB(lastOpDate) : undefined;
              const minDateDisplay = lastOpDate ? formatDateFromDB(lastOpDate) : null;

              return (
                <>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={minDateStr}
                    max={formatDateForInput(new Date())}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    required
                  />
                  {minDateDisplay && (
                    <p className="mt-1 text-xs text-[var(--text-dimmed)]">
                      Data mínima: {minDateDisplay}
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          {/* Taxas - apenas para renda variável */}
          {!isFixed && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                Taxas/Corretagem (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dimmed)]">
                  R$
                </span>
                <CurrencyInput
                  value={fees}
                  onChange={setFees}
                  placeholder="0,00"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Total */}
          {total > 0 && (
            <div className="bg-[var(--bg-hover)] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Total da Operação</span>
                <span className={`text-xl font-bold ${type === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                  R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Aviso de saldo insuficiente */}
          {type === "buy" && hasInsufficientBalance && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-red-400 font-medium">Saldo insuficiente</p>
                <p className="text-[var(--text-muted)] text-xs mt-0.5">
                  Você precisa de {formatCurrency(total)} mas tem apenas {formatCurrency(availableBalance || 0)} disponível.
                </p>
              </div>
            </div>
          )}

          {/* Opção para ignorar verificação de saldo */}
          {type === "buy" && (
            <div className="bg-[var(--bg-hover)] rounded-xl p-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipBalanceCheck}
                  onChange={(e) => setSkipBalanceCheck(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-[var(--border-color-strong)] bg-[var(--bg-hover)] text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                />
                <div>
                  <span className="text-sm text-[var(--text-primary)]">Não descontar do saldo</span>
                  <p className="text-xs text-[var(--text-dimmed)] mt-0.5">
                    Marque se a operação já foi feita fora do sistema ou se não quer afetar seu saldo em conta.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Compra mensal"
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color-strong)] rounded-xl py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-dimmed)] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
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
              disabled={
                isSubmitting ||
                hasExcessError ||
                hasInsufficientBalance ||
                (isFixed
                  ? !totalValue
                  : (type === "sell" && sellMode === "value"
                      ? (!sellTargetValue || !price || calculatedQuantity <= 0)
                      : (!quantity || !price)
                    )
                )
              }
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-lg disabled:opacity-50 ${
                type === "buy"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25"
                  : "bg-gradient-to-r from-red-500 to-orange-500 shadow-red-500/25"
              }`}
            >
              {isSubmitting
                ? "Salvando..."
                : isFixed
                  ? type === "buy"
                    ? skipBalanceCheck ? "Registrar (Sem Desconto)" : "Registrar Depósito"
                    : "Registrar Resgate"
                  : type === "buy"
                    ? skipBalanceCheck ? "Registrar (Sem Desconto)" : "Registrar Compra"
                    : "Registrar Venda"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}