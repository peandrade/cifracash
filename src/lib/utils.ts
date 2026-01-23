import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS de forma inteligente
 * - clsx: permite condicionais e arrays de classes
 * - twMerge: resolve conflitos do Tailwind (ex: "p-2 p-4" vira "p-4")
 * 
 * Uso:
 * cn("base-class", condition && "conditional-class", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata número para moeda brasileira (BRL)
 * 
 * Uso:
 * formatCurrency(1234.56) → "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata data para padrão brasileiro
 * 
 * Uso:
 * formatDate(new Date()) → "20/01/2025"
 * formatDate("2025-01-20") → "20/01/2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

/**
 * Formata data para input type="date"
 * Usa timezone local para evitar deslocamento de 1 dia
 *
 * Uso:
 * formatDateForInput(new Date()) → "2025-01-20"
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converte data do banco (UTC) para string de input sem deslocamento de timezone
 * Pega apenas a parte da data ignorando a hora/timezone
 *
 * Uso:
 * parseDateFromDB("2025-01-20T00:00:00.000Z") → "2025-01-20"
 */
export function parseDateFromDB(date: Date | string): string {
  const dateStr = typeof date === "string" ? date : date.toISOString();
  // Pega apenas YYYY-MM-DD, ignorando timezone
  return dateStr.split("T")[0];
}

/**
 * Formata data do banco para exibição em pt-BR sem deslocamento de timezone
 *
 * Uso:
 * formatDateFromDB("2025-01-20T00:00:00.000Z") → "20/01/2025"
 */
export function formatDateFromDB(date: Date | string): string {
  const dateStr = parseDateFromDB(date);
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Calcula a porcentagem de um valor em relação ao total
 * 
 * Uso:
 * calculatePercentage(25, 100) → 25
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Gera um ID único simples
 * Para uso temporário antes de persistir no banco
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}