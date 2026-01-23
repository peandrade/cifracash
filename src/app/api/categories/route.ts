import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";

// Ícones padrão para categorias existentes
const DEFAULT_ICONS: Record<string, string> = {
  // Despesas
  "Aluguel": "Home",
  "Supermercado": "ShoppingCart",
  "Restaurante": "UtensilsCrossed",
  "Delivery": "Bike",
  "Transporte": "Car",
  "Luz": "Lightbulb",
  "Água": "Droplets",
  "Internet": "Wifi",
  "Streaming": "Play",
  "Lazer": "Gamepad2",
  "Saúde": "Heart",
  "Educação": "GraduationCap",
  "Roupas": "Shirt",
  "Pix": "ArrowLeftRight",
  "Fatura Cartão": "CreditCard",
  "Outros": "MoreHorizontal",
  // Receitas
  "Salário": "Wallet",
  "Freelance": "Laptop",
  "Investimentos": "TrendingUp",
  "Dividendos": "CircleDollarSign",
};

/**
 * GET /api/categories
 *
 * Retorna todas as categorias (padrão + personalizadas do usuário)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca categorias personalizadas do usuário
    const customCategories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    });

    // Monta categorias padrão de despesa
    const defaultExpenseCategories = EXPENSE_CATEGORIES.map((name) => ({
      id: `default-expense-${name}`,
      name,
      type: "expense" as const,
      icon: DEFAULT_ICONS[name] || "Tag",
      color: CATEGORY_COLORS[name] || "#64748B",
      isDefault: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Monta categorias padrão de receita
    const defaultIncomeCategories = INCOME_CATEGORIES.map((name) => ({
      id: `default-income-${name}`,
      name,
      type: "income" as const,
      icon: DEFAULT_ICONS[name] || "Tag",
      color: CATEGORY_COLORS[name] || "#64748B",
      isDefault: true,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Combina todas as categorias
    const allCategories = [
      ...defaultExpenseCategories,
      ...defaultIncomeCategories,
      ...customCategories.map((c) => ({ ...c, isDefault: false })),
    ];

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 *
 * Cria uma nova categoria personalizada
 *
 * Body esperado:
 * {
 *   name: string,
 *   type: "income" | "expense",
 *   icon: string (nome do ícone Lucide),
 *   color: string (hex color)
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validação básica
    if (!body.name || !body.type || !body.icon || !body.color) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, type, icon, color" },
        { status: 400 }
      );
    }

    // Valida o tipo
    if (!["income", "expense"].includes(body.type)) {
      return NextResponse.json(
        { error: "Tipo deve ser 'income' ou 'expense'" },
        { status: 400 }
      );
    }

    // Verifica se já existe uma categoria com esse nome para o usuário
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: body.name,
        type: body.type,
        userId: session.user.id,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome" },
        { status: 400 }
      );
    }

    // Verifica se conflita com categoria padrão
    const defaultCategories = body.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (defaultCategories.includes(body.name)) {
      return NextResponse.json(
        { error: "Não é possível criar uma categoria com o mesmo nome de uma categoria padrão" },
        { status: 400 }
      );
    }

    // Cria a categoria
    const category = await prisma.category.create({
      data: {
        name: body.name,
        type: body.type,
        icon: body.icon,
        color: body.color,
        isDefault: false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
