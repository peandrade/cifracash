// ============================================
// CARTÕES DE CRÉDITO
// ============================================

export type InvoiceStatus = "open" | "closed" | "paid" | "overdue";

export interface CreditCard {
  id: string;
  name: string;
  lastDigits?: string | null;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  creditCardId: string;
  creditCard?: CreditCard;
  month: number;
  year: number;
  closingDate: Date | string;
  dueDate: Date | string;
  status: InvoiceStatus;
  total: number;
  paidAmount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  purchases?: Purchase[];
}

export interface Purchase {
  id: string;
  invoiceId: string;
  invoice?: Invoice;
  description: string;
  value: number;
  totalValue: number;
  category: string;
  date: Date | string;
  installments: number;
  currentInstallment: number;
  isRecurring: boolean;
  parentPurchaseId?: string | null;
  notes?: string | null;
  createdAt: Date | string;
}

export interface CreateCardInput {
  name: string;
  lastDigits?: string;
  limit?: number;
  closingDay: number;
  dueDay: number;
  color?: string;
}

export interface CreatePurchaseInput {
  creditCardId: string;
  description: string;
  value: number;
  category: string;
  date: Date;
  installments?: number;
  isRecurring?: boolean;
  notes?: string;
}

export interface CardSummary {
  totalLimit: number;
  usedLimit: number;
  availableLimit: number;
  currentInvoice: number;
  nextInvoice: number;
}

export interface InvoicePreview {
  month: number;
  year: number;
  label: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date | string;
}