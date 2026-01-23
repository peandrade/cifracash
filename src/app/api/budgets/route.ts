import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface BudgetWithSpent {
  id: string;
  category: string;
  limit: number;
  month: number; // 0 = orçamento fixo
  year: number;  // 0 = orçamento fixo
  spent: number;
  percentage: number;
  remaining: number;
}

/**
 * GET /api/budgets
 * Lista todos os orçamentos com os gastos do mês atual
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // Busca orçamentos (fixos month=0/year=0 e do mês específico)
    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { month: 0, year: 0 }, // Orçamentos fixos
          { month, year }, // Orçamentos do mês específico
        ],
      },
      orderBy: { category: "asc" },
    });

    // Busca gastos do mês por categoria (transações)
    // Exclui "Fatura Cartão" pois as compras já são contadas separadamente
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId: session.user.id,
        type: "expense",
        category: {
          not: "Fatura Cartão", // Evita contagem dupla com compras do cartão
        },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        value: true,
      },
    });

    // Busca gastos do cartão de crédito do mês
    const cardPurchases = await prisma.purchase.groupBy({
      by: ["category"],
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        invoice: {
          creditCard: {
            userId: session.user.id,
          },
        },
      },
      _sum: {
        value: true,
      },
    });

    // Combina os gastos por categoria
    const spentByCategory: Record<string, number> = {};

    for (const expense of expenses) {
      spentByCategory[expense.category] = (spentByCategory[expense.category] || 0) + (expense._sum.value || 0);
    }

    for (const purchase of cardPurchases) {
      spentByCategory[purchase.category] = (spentByCategory[purchase.category] || 0) + (purchase._sum.value || 0);
    }

    // Monta resposta com gastos
    const budgetsWithSpent: BudgetWithSpent[] = budgets.map((budget) => {
      const spent = spentByCategory[budget.category] || 0;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      const remaining = budget.limit - spent;

      return {
        id: budget.id,
        category: budget.category,
        limit: budget.limit,
        month: budget.month,
        year: budget.year,
        spent,
        percentage,
        remaining,
      };
    });

    // Calcula totais
    const totalLimit = budgetsWithSpent.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0);

    return NextResponse.json({
      budgets: budgetsWithSpent,
      summary: {
        totalLimit,
        totalSpent,
        totalRemaining: totalLimit - totalSpent,
        totalPercentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
      },
      month,
      year,
    });
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar orçamentos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budgets
 * Cria ou atualiza um orçamento
 *
 * Nota: month=0 e year=0 representam orçamento fixo (todos os meses)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { category, limit, month, year, isFixed } = body;

    if (!category || limit === undefined) {
      return NextResponse.json(
        { error: "Categoria e limite são obrigatórios" },
        { status: 400 }
      );
    }

    // Se isFixed, usa 0 para representar "todos os meses"
    const budgetMonth = isFixed ? 0 : (month || new Date().getMonth() + 1);
    const budgetYear = isFixed ? 0 : (year || new Date().getFullYear());

    // Upsert: cria ou atualiza
    const budget = await prisma.budget.upsert({
      where: {
        category_month_year_userId: {
          category,
          month: budgetMonth,
          year: budgetYear,
          userId: session.user.id,
        },
      },
      update: {
        limit,
      },
      create: {
        category,
        limit,
        month: budgetMonth,
        year: budgetYear,
        userId: session.user.id,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar orçamento" },
      { status: 500 }
    );
  }
}
