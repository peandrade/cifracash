// ============================================
// TRANSAÇÕES
// ============================================

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  value: number;
  category: string;
  description?: string | null;
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateTransactionInput {
  type: TransactionType;
  value: number;
  category: string;
  description?: string;
  date: Date;
}

// ============================================
// TEMPLATES DE TRANSAÇÃO
// ============================================

export interface TransactionTemplate {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  type: TransactionType;
  value?: number | null;
  usageCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: string;
  type: TransactionType;
  value?: number;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  type?: TransactionType;
  value?: number | null;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
  incomeChange?: number;
  expenseChange?: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export type EvolutionPeriod = "1w" | "15d" | "1m" | "6m" | "1y";

export interface MonthlyEvolution {
  month: string; // Can be day label or month name depending on period
  income: number;
  expense: number;
}

// ============================================
// INVESTIMENTOS
// ============================================

export type InvestmentType =
  | "stock"
  | "fii"
  | "etf"
  | "crypto"
  | "cdb"
  | "treasury"
  | "lci_lca"
  | "savings"
  | "other";

export type OperationType = "buy" | "sell" | "deposit" | "withdraw";

// Tipos que usam quantidade x preço
export const VARIABLE_INCOME_TYPES: InvestmentType[] = [
  "stock", "fii", "etf", "crypto"
];

// Tipos que usam saldo direto
export const FIXED_INCOME_TYPES: InvestmentType[] = [
  "cdb", "treasury", "lci_lca", "savings", "other"
];

export function isVariableIncome(type: InvestmentType): boolean {
  return VARIABLE_INCOME_TYPES.includes(type);
}

export function isFixedIncome(type: InvestmentType): boolean {
  return FIXED_INCOME_TYPES.includes(type);
}

// Tipos de indexador para renda fixa
export type IndexerType = "CDI" | "IPCA" | "SELIC" | "PREFIXADO" | "NA";

export const INDEXER_TYPES: { value: IndexerType; label: string }[] = [
  { value: "CDI", label: "% do CDI" },
  { value: "IPCA", label: "IPCA +" },
  { value: "SELIC", label: "SELIC +" },
  { value: "PREFIXADO", label: "Prefixado" },
  { value: "NA", label: "N/A" },
];

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  ticker?: string | null;
  institution?: string | null;

  // Renda Variável
  quantity: number;
  averagePrice: number;
  currentPrice: number;

  // Valores
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;

  // Renda Fixa
  interestRate?: number | null;    // Taxa (ex: 100 para 100% CDI, 5 para IPCA+5%)
  indexer?: IndexerType | null;    // CDI, IPCA, SELIC, PREFIXADO
  maturityDate?: Date | string | null; // Data de vencimento

  // Meta
  goalValue?: number | null;

  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  operations?: Operation[];
}

export interface Operation {
  id: string;
  investmentId: string;
  type: OperationType;
  quantity: number;
  price: number;
  total: number;
  date: Date | string;
  fees: number;
  notes?: string | null;
  createdAt: Date | string;
}

export interface CreateInvestmentInput {
  type: InvestmentType;
  name: string;
  ticker?: string;
  institution?: string;
  goalValue?: number;
  notes?: string;
  // Renda Fixa
  interestRate?: number;
  indexer?: IndexerType;
  maturityDate?: Date;
  // Depósito inicial (obrigatório para renda fixa)
  initialDeposit?: number;
  depositDate?: Date;
  // Controle de saldo
  skipBalanceCheck?: boolean; // Ignora verificação de saldo (para investimentos antigos)
}

export interface UpdateInvestmentInput {
  name?: string;
  ticker?: string;
  institution?: string;
  currentPrice?: number;
  currentValue?: number;
  totalInvested?: number;
  goalValue?: number | null;
  notes?: string;
  // Renda Fixa
  interestRate?: number | null;
  indexer?: IndexerType | null;
  maturityDate?: Date | null;
  noMaturity?: boolean;
}

export interface CreateOperationInput {
  investmentId: string;
  type: OperationType;
  quantity?: number;
  price?: number;
  total?: number;
  date: Date;
  fees?: number;
  notes?: string;
  // Controle de saldo (apenas para compra/depósito)
  skipBalanceCheck?: boolean; // Ignora verificação de saldo
}

export interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  totalAssets: number;
}

export interface AllocationData {
  type: InvestmentType;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}