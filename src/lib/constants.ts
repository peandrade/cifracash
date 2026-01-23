import type { InvestmentType } from "@/types";

// ============================================
// TRANSAÇÕES - CATEGORIAS
// ============================================

export const EXPENSE_CATEGORIES = [
  "Aluguel",
  "Supermercado",
  "Restaurante",
  "Delivery",
  "Transporte",
  "Luz",
  "Água",
  "Internet",
  "Streaming",
  "Lazer",
  "Saúde",
  "Educação",
  "Roupas",
  "Pix",
  "Fatura Cartão",
  "Outros",
] as const;

export const INCOME_CATEGORIES = [
  "Salário",
  "Freelance",
  "Investimentos",
  "Dividendos",
  "Pix",
  "Outros",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  // Despesas
  Aluguel: "#8B5CF6",
  Supermercado: "#F59E0B",
  Restaurante: "#EC4899",
  Delivery: "#EF4444",
  Transporte: "#3B82F6",
  Luz: "#10B981",
  Água: "#06B6D4",
  Internet: "#6366F1",
  Streaming: "#A855F7",
  Lazer: "#F97316",
  Saúde: "#14B8A6",
  Educação: "#8B5CF6",
  Roupas: "#E879F9",
  Pix: "#32BCAD",
  "Fatura Cartão": "#7C3AED",
  // Receitas
  Salário: "#22C55E",
  Freelance: "#84CC16",
  Investimentos: "#0EA5E9",
  Dividendos: "#10B981",
  // Default
  Outros: "#64748B",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS["Outros"];
}

export function getMonthYearLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ============================================
// INVESTIMENTOS - TIPOS E CORES
// ============================================

export const INVESTMENT_TYPES: InvestmentType[] = [
  "stock",
  "fii",
  "etf",
  "crypto",
  "cdb",
  "treasury",
  "lci_lca",
  "savings",
  "other",
];

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  stock: "Ações",
  fii: "Fundos Imobiliários",
  etf: "ETFs",
  crypto: "Criptomoedas",
  cdb: "CDB",
  treasury: "Tesouro Direto",
  lci_lca: "LCI/LCA",
  savings: "Poupança",
  other: "Outros",
};

export const INVESTMENT_TYPE_COLORS: Record<InvestmentType, string> = {
  stock: "#3B82F6",      // Azul
  fii: "#8B5CF6",        // Roxo
  etf: "#06B6D4",        // Ciano
  crypto: "#F59E0B",     // Amarelo
  cdb: "#10B981",        // Verde
  treasury: "#22C55E",   // Verde claro
  lci_lca: "#14B8A6",    // Teal
  savings: "#64748B",    // Cinza
  other: "#6366F1",      // Indigo
};

export const INVESTMENT_TYPE_ICONS: Record<InvestmentType, string> = {
  stock: "📈",
  fii: "🏢",
  etf: "📊",
  crypto: "₿",
  cdb: "🏦",
  treasury: "🇧🇷",
  lci_lca: "🏠",
  savings: "🐷",
  other: "💼",
};

export function getInvestmentTypeLabel(type: InvestmentType): string {
  return INVESTMENT_TYPE_LABELS[type] || "Outros";
}

export function getInvestmentTypeColor(type: InvestmentType): string {
  return INVESTMENT_TYPE_COLORS[type] || INVESTMENT_TYPE_COLORS.other;
}

export function getInvestmentTypeIcon(type: InvestmentType): string {
  return INVESTMENT_TYPE_ICONS[type] || "💼";
}

// ============================================
// INVESTIMENTOS - CATEGORIAS POR TIPO
// ============================================

export const INVESTMENT_CATEGORIES = {
  variableIncome: ["stock", "fii", "etf", "crypto"] as InvestmentType[],
  fixedIncome: ["cdb", "treasury", "lci_lca", "savings"] as InvestmentType[],
};

export function isVariableIncome(type: InvestmentType): boolean {
  return INVESTMENT_CATEGORIES.variableIncome.includes(type);
}

export function isFixedIncome(type: InvestmentType): boolean {
  return INVESTMENT_CATEGORIES.fixedIncome.includes(type);
}

// ============================================
// METAS FINANCEIRAS - CATEGORIAS
// ============================================

export type GoalCategoryType = "emergency" | "travel" | "car" | "house" | "education" | "retirement" | "other";

export const GOAL_CATEGORIES: GoalCategoryType[] = [
  "emergency",
  "travel",
  "car",
  "house",
  "education",
  "retirement",
  "other",
];

export const GOAL_CATEGORY_LABELS: Record<GoalCategoryType, string> = {
  emergency: "Reserva de Emergência",
  travel: "Viagem",
  car: "Carro",
  house: "Casa Própria",
  education: "Educação",
  retirement: "Aposentadoria",
  other: "Outro",
};

export const GOAL_CATEGORY_COLORS: Record<GoalCategoryType, string> = {
  emergency: "#EF4444",   // Vermelho
  travel: "#F59E0B",      // Amarelo
  car: "#3B82F6",         // Azul
  house: "#8B5CF6",       // Roxo
  education: "#06B6D4",   // Ciano
  retirement: "#10B981",  // Verde
  other: "#64748B",       // Cinza
};

export const GOAL_CATEGORY_ICONS: Record<GoalCategoryType, string> = {
  emergency: "🛡️",
  travel: "✈️",
  car: "🚗",
  house: "🏠",
  education: "🎓",
  retirement: "🏖️",
  other: "🎯",
};

export function getGoalCategoryLabel(category: GoalCategoryType): string {
  return GOAL_CATEGORY_LABELS[category] || "Outro";
}

export function getGoalCategoryColor(category: GoalCategoryType): string {
  return GOAL_CATEGORY_COLORS[category] || GOAL_CATEGORY_COLORS.other;
}

export function getGoalCategoryIcon(category: GoalCategoryType): string {
  return GOAL_CATEGORY_ICONS[category] || "🎯";
}