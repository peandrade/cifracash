import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * POST /api/recurring-expenses/launch
 * Lança despesas recorrentes pendentes como transações
 *
 * Body:
 * - expenseIds: string[] (opcional) - IDs específicos para lançar. Se não informado, lança todas pendentes.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { expenseIds } = body;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Busca despesas ativas
    let expenses = await prisma.recurringExpense.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        ...(expenseIds && expenseIds.length > 0 && { id: { in: expenseIds } }),
      },
    });

    // Filtra apenas as que não foram lançadas este mês
    expenses = expenses.filter((expense) => {
      if (!expense.lastLaunchedAt) return true;
      const lastLaunched = new Date(expense.lastLaunchedAt);
      return !(
        lastLaunched.getMonth() === currentMonth &&
        lastLaunched.getFullYear() === currentYear
      );
    });

    if (expenses.length === 0) {
      return NextResponse.json({
        launched: 0,
        message: "Nenhuma despesa pendente para lançar",
      });
    }

    // Cria transações para cada despesa
    const transactions = [];
    const updatedExpenses = [];

    for (const expense of expenses) {
      // Data da transação: dia de vencimento no mês atual (ou hoje se já passou)
      const dueDay = Math.min(expense.dueDay, new Date(currentYear, currentMonth + 1, 0).getDate());
      const transactionDate = new Date(currentYear, currentMonth, dueDay, 12, 0, 0);

      // Cria a transação
      const transaction = await prisma.transaction.create({
        data: {
          type: "expense",
          value: expense.value,
          category: expense.category,
          description: expense.description,
          date: transactionDate,
          userId: session.user.id,
        },
      });
      transactions.push(transaction);

      // Atualiza a despesa recorrente
      const updated = await prisma.recurringExpense.update({
        where: { id: expense.id },
        data: { lastLaunchedAt: now },
      });
      updatedExpenses.push(updated);
    }

    return NextResponse.json({
      launched: transactions.length,
      transactions,
      message: `${transactions.length} despesa(s) lançada(s) com sucesso`,
    });
  } catch (error) {
    console.error("Erro ao lançar despesas recorrentes:", error);
    return NextResponse.json(
      { error: "Erro ao lançar despesas recorrentes" },
      { status: 500 }
    );
  }
}
