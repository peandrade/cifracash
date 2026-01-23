import { create } from "zustand";

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  isDefault: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
}

interface CategoryState {

  categories: Category[];
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  addCategory: (data: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, data: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  getExpenseCategories: () => Category[];
  getIncomeCategories: () => Category[];
  getCategoryByName: (name: string, type: "income" | "expense") => Category | undefined;
  getCategoryColor: (name: string) => string;
  getCategoryIcon: (name: string) => string;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({

  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        throw new Error("Erro ao buscar categorias");
      }

      const data = await response.json();
      set({ categories: data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
    }
  },

  addCategory: async (data: CreateCategoryInput) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar categoria");
      }

      const newCategory = await response.json();

      set((state) => ({
        categories: [...state.categories, newCategory],
        isLoading: false,
      }));

      return newCategory;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
      throw error;
    }
  },

  updateCategory: async (id: string, data: UpdateCategoryInput) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar categoria");
      }

      const updatedCategory = await response.json();

      set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === id ? updatedCategory : cat
        ),
        isLoading: false,
      }));

      return updatedCategory;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir categoria");
      }

      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
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

  getExpenseCategories: () => {
    return get().categories.filter((cat) => cat.type === "expense");
  },

  getIncomeCategories: () => {
    return get().categories.filter((cat) => cat.type === "income");
  },

  getCategoryByName: (name: string, type: "income" | "expense") => {
    return get().categories.find(
      (cat) => cat.name === name && cat.type === type
    );
  },

  getCategoryColor: (name: string) => {
    const category = get().categories.find((cat) => cat.name === name);
    return category?.color || "#64748B";
  },

  getCategoryIcon: (name: string) => {
    const category = get().categories.find((cat) => cat.name === name);
    return category?.icon || "Tag";
  },
}));
