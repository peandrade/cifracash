import { create } from "zustand";
import type {
  TransactionTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "@/types";

interface TemplateState {

  templates: TransactionTemplate[];
  isLoading: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;
  addTemplate: (data: CreateTemplateInput) => Promise<TransactionTemplate>;
  updateTemplate: (id: string, data: UpdateTemplateInput) => Promise<TransactionTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  useTemplate: (id: string) => Promise<TransactionTemplate>;

  getExpenseTemplates: () => TransactionTemplate[];
  getIncomeTemplates: () => TransactionTemplate[];
  getMostUsedTemplates: (limit?: number) => TransactionTemplate[];
}

export const useTemplateStore = create<TemplateState>((set, get) => ({

  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/templates");

      if (!response.ok) {
        throw new Error("Erro ao buscar templates");
      }

      const data = await response.json();
      set({ templates: data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
    }
  },

  addTemplate: async (data: CreateTemplateInput) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar template");
      }

      const newTemplate = await response.json();

      set((state) => ({
        templates: [newTemplate, ...state.templates],
        isLoading: false,
      }));

      return newTemplate;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: UpdateTemplateInput) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar template");
      }

      const updatedTemplate = await response.json();

      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? updatedTemplate : t
        ),
        isLoading: false,
      }));

      return updatedTemplate;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir template");
      }

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
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

  useTemplate: async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erro ao usar template");
      }

      const updatedTemplate = await response.json();

      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? updatedTemplate : t
        ),
      }));

      return updatedTemplate;
    } catch (error) {
      console.error("Erro ao incrementar uso do template:", error);
      throw error;
    }
  },

  getExpenseTemplates: () => {
    return get().templates.filter((t) => t.type === "expense");
  },

  getIncomeTemplates: () => {
    return get().templates.filter((t) => t.type === "income");
  },

  getMostUsedTemplates: (limit = 5) => {
    return [...get().templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  },
}));
