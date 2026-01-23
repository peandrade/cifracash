import { create } from "zustand";

/**
 * Interface de uma categoria
 */
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

/**
 * Input para criar uma nova categoria
 */
export interface CreateCategoryInput {
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
}

/**
 * Input para atualizar uma categoria
 */
export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
}

/**
 * Interface do estado da store
 */
interface CategoryState {
  // Estado
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  addCategory: (data: CreateCategoryInput) => Promise<Category>;
  updateCategory: (id: string, data: UpdateCategoryInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Selectors
  getExpenseCategories: () => Category[];
  getIncomeCategories: () => Category[];
  getCategoryByName: (name: string, type: "income" | "expense") => Category | undefined;
  getCategoryColor: (name: string) => string;
  getCategoryIcon: (name: string) => string;
}

/**
 * Store de categorias com Zustand
 */
export const useCategoryStore = create<CategoryState>((set, get) => ({
  // Estado inicial
  categories: [],
  isLoading: false,
  error: null,

  /**
   * Busca todas as categorias da API
   */
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

  /**
   * Adiciona uma nova categoria
   */
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

      // Adiciona a nova categoria ao estado
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

  /**
   * Atualiza uma categoria existente
   */
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

      // Atualiza a categoria no estado
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

  /**
   * Exclui uma categoria
   */
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

      // Remove a categoria do estado
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

  /**
   * Retorna apenas categorias de despesa
   */
  getExpenseCategories: () => {
    return get().categories.filter((cat) => cat.type === "expense");
  },

  /**
   * Retorna apenas categorias de receita
   */
  getIncomeCategories: () => {
    return get().categories.filter((cat) => cat.type === "income");
  },

  /**
   * Busca uma categoria pelo nome e tipo
   */
  getCategoryByName: (name: string, type: "income" | "expense") => {
    return get().categories.find(
      (cat) => cat.name === name && cat.type === type
    );
  },

  /**
   * Retorna a cor de uma categoria pelo nome
   */
  getCategoryColor: (name: string) => {
    const category = get().categories.find((cat) => cat.name === name);
    return category?.color || "#64748B";
  },

  /**
   * Retorna o ícone de uma categoria pelo nome
   */
  getCategoryIcon: (name: string) => {
    const category = get().categories.find((cat) => cat.name === name);
    return category?.icon || "Tag";
  },
}));
