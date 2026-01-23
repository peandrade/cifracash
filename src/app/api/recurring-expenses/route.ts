import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface RecurringExpenseWithStatus {
  id: string;
  description: string;
  value: number;
  category: string;
  dueDay: number;
  isActive: boolean;
  lastLaunchedAt: string | null;
  notes: string | null;

  isLaunchedThisMonth: boolean;
  dueDate: string;
  isPastDue: boolean;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const expenses = await prisma.recurringExpense.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isActive: "desc" },
        { dueDay: "asc" },
      ],
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    const expensesWithStatus: RecurringExpenseWithStatus[] = expenses.map((expense) => {

      const lastLaunched = expense.lastLaunchedAt
        ? new Date(expense.lastLaunchedAt)
        : null;
      const isLaunchedThisMonth = lastLaunched
        ? lastLaunched.getMonth() === currentMonth &&
          lastLaunched.getFullYear() === currentYear
        : false;

      const dueDate = new Date(currentYear, currentMonth, expense.dueDay);
      const isPastDue = today > expense.dueDay && !isLaunchedThisMonth;

      return {
        id: expense.id,
        description: expense.description,
        value: expense.value,
        category: expense.category,
        dueDay: expense.dueDay,
        isActive: expense.isActive,
        lastLaunchedAt: expense.lastLaunchedAt?.toISOString() || null,
        notes: expense.notes,
        isLaunchedThisMonth,
        dueDate: dueDate.toISOString(),
        isPastDue,
      };
    });

    const activeExpenses = expensesWithStatus.filter((e) => e.isActive);
    const totalMonthly = activeExpenses.reduce((sum, e) => sum + e.value, 0);
    const totalLaunched = activeExpenses
      .filter((e) => e.isLaunchedThisMonth)
      .reduce((sum, e) => sum + e.value, 0);
    const totalPending = activeExpenses
      .filter((e) => !e.isLaunchedThisMonth)
      .reduce((sum, e) => sum + e.value, 0);
    const pendingCount = activeExpenses.filter((e) => !e.isLaunchedThisMonth).length;

    return NextResponse.json({
      expenses: expensesWithStatus,
      summary: {
        totalMonthly,
        totalLaunched,
        totalPending,
        launchedCount: activeExpenses.length - pendingCount,
        pendingCount,
        totalCount: activeExpenses.length,
      },
      currentMonth: currentMonth + 1,
      currentYear,
    });
  } catch (error) {
    console.error("Erro ao buscar despesas recorrentes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar despesas recorrentes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { description, value, category, dueDay, notes } = body;

    if (!description || !value || !category) {
      return NextResponse.json(
        { error: "Descrição, valor e categoria são obrigatórios" },
        { status: 400 }
      );
    }

    const expense = await prisma.recurringExpense.create({
      data: {
        description,
        value,
        category,
        dueDay: dueDay || 1,
        notes: notes || null,
        isActive: true,
        userId: session.user.id,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar despesa recorrente:", error);
    return NextResponse.json(
      { error: "Erro ao criar despesa recorrente" },
      { status: 500 }
    );
  }
}
