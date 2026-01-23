import { create } from "zustand";
import type {
  Investment,
  CreateInvestmentInput,
  UpdateInvestmentInput,
  CreateOperationInput,
  InvestmentSummary,
  AllocationData,
  InvestmentType,
} from "@/types";
import {
  getInvestmentTypeLabel,
  getInvestmentTypeColor,
} from "@/lib/constants";

interface QuotesRefreshResult {
  success: boolean;
  updated: number;
  errors: Array<{ ticker: string; error: string }>;
}

interface YieldsRefreshResult {
  success: boolean;
  updated: number;
  lastUpdate: string | null;
}

interface InvestmentStore {
  investments: Investment[];
  isLoading: boolean;
  isRefreshingQuotes: boolean;
  isRefreshingYields: boolean;
  error: string | null;
  lastQuotesUpdate: Date | null;
  lastYieldsUpdate: Date | null;

  fetchInvestments: () => Promise<void>;
  addInvestment: (data: CreateInvestmentInput) => Promise<void>;
  updateInvestment: (id: string, data: UpdateInvestmentInput) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addOperation: (data: CreateOperationInput) => Promise<void>;
  refreshQuotes: () => Promise<QuotesRefreshResult>;
  refreshYields: () => Promise<YieldsRefreshResult>;

  getSummary: () => InvestmentSummary;
  getAllocationByType: () => AllocationData[];
  getInvestmentsByType: (type: InvestmentType) => Investment[];
}

export const useInvestmentStore = create<InvestmentStore>((set, get) => ({
  investments: [],
  isLoading: false,
  isRefreshingQuotes: false,
  isRefreshingYields: false,
  error: null,
  lastQuotesUpdate: null,
  lastYieldsUpdate: null,

  fetchInvestments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/investments");
      if (!response.ok) throw new Error("Erro ao buscar investimentos");
      const data = await response.json();
      set({ investments: data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
    }
  },

  addInvestment: async (data: CreateInvestmentInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar investimento");
      const newInvestment = await response.json();
      set((state) => ({
        investments: [newInvestment, ...state.investments],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
      throw error;
    }
  },

  updateInvestment: async (id: string, data: UpdateInvestmentInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/investments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar investimento");
      const updated = await response.json();
      set((state) => ({
        investments: state.investments.map((inv) =>
          inv.id === id ? updated : inv
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteInvestment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/investments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar investimento");
      set((state) => ({
        investments: state.investments.filter((inv) => inv.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
      throw error;
    }
  },

  addOperation: async (data: CreateOperationInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `/api/investments/${data.investmentId}/operations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("Erro ao criar operação");
      const { investment: updated } = await response.json();
      set((state) => ({
        investments: state.investments.map((inv) =>
          inv.id === data.investmentId ? updated : inv
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
      throw error;
    }
  },

  refreshQuotes: async (): Promise<QuotesRefreshResult> => {
    set({ isRefreshingQuotes: true, error: null });
    try {
      const response = await fetch("/api/investments/quotes", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Erro ao atualizar cotações");

      const result = await response.json();

      // Recarrega os investimentos para ter os valores atualizados
      if (result.updated > 0) {
        const investmentsResponse = await fetch("/api/investments");
        if (investmentsResponse.ok) {
          const investments = await investmentsResponse.json();
          set({ investments });
        }
      }

      set({
        isRefreshingQuotes: false,
        lastQuotesUpdate: new Date(),
      });

      return {
        success: result.success,
        updated: result.updated,
        errors: result.errors || [],
      };
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isRefreshingQuotes: false,
      });
      return {
        success: false,
        updated: 0,
        errors: [{ ticker: "all", error: error instanceof Error ? error.message : "Erro desconhecido" }],
      };
    }
  },

  refreshYields: async (): Promise<YieldsRefreshResult> => {
    set({ isRefreshingYields: true, error: null });
    try {
      const response = await fetch("/api/investments/yields");
      if (!response.ok) throw new Error("Erro ao calcular rendimentos");

      const result = await response.json();

      // Recarrega os investimentos para ter os valores atualizados
      const investmentsResponse = await fetch("/api/investments");
      if (investmentsResponse.ok) {
        const investments = await investmentsResponse.json();
        set({ investments });
      }

      set({
        isRefreshingYields: false,
        lastYieldsUpdate: new Date(),
      });

      return {
        success: true,
        updated: result.yields?.filter((y: { calculation: unknown }) => y.calculation).length || 0,
        lastUpdate: result.lastUpdate,
      };
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isRefreshingYields: false,
      });
      return {
        success: false,
        updated: 0,
        lastUpdate: null,
      };
    }
  },

  getSummary: (): InvestmentSummary => {
    const { investments } = get();
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercent,
      totalAssets: investments.length,
    };
  },

  getAllocationByType: (): AllocationData[] => {
    const { investments } = get();
    const byType = investments.reduce((acc, inv) => {
      if (!acc[inv.type]) acc[inv.type] = 0;
      acc[inv.type] += inv.currentValue;
      return acc;
    }, {} as Record<InvestmentType, number>);

    const total = Object.values(byType).reduce((sum, val) => sum + val, 0);

    return Object.entries(byType)
      .map(([type, value]) => ({
        type: type as InvestmentType,
        label: getInvestmentTypeLabel(type as InvestmentType),
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: getInvestmentTypeColor(type as InvestmentType),
      }))
      .sort((a, b) => b.value - a.value);
  },

  getInvestmentsByType: (type: InvestmentType): Investment[] => {
    return get().investments.filter((inv) => inv.type === type);
  },
}));