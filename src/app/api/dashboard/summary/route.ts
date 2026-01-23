import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      transactions,
      investments,
      creditCards,
      goals,
      monthlyTransactions,
    ] = await Promise.all([

      prisma.transaction.findMany({
        where: { userId },
        select: { type: true, value: true },
      }),

      prisma.investment.findMany({
        where: { userId },
        select: { currentValue: true, totalInvested: true, profitLoss: true },
      }),

      prisma.creditCard.findMany({
        where: { userId, isActive: true },
        include: {
          invoices: {
            where: {
              status: { in: ["open", "closed", "overdue"] },
            },
          },
        },
      }),

      prisma.financialGoal.findMany({
        where: { userId },
        select: { targetValue: true, currentValue: true, isCompleted: true },
      }),

      prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: { type: true, value: true },
      }),
    ]);

    const balance = transactions.reduce((acc, t) => {
      return t.type === "income" ? acc + t.value : acc - t.value;
    }, 0);

    const totalInvested = investments.reduce((acc, i) => acc + i.totalInvested, 0);
    const currentInvestmentValue = investments.reduce((acc, i) => acc + i.currentValue, 0);
    const investmentProfitLoss = investments.reduce((acc, i) => acc + i.profitLoss, 0);

    const totalCardLimit = creditCards.reduce((acc, c) => acc + c.limit, 0);
    const usedCardLimit = creditCards.reduce((acc, c) => {
      const used = c.invoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
      return acc + used;
    }, 0);
    const availableCardLimit = totalCardLimit - usedCardLimit;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const overdueDebts = creditCards.reduce((acc, c) => {
      const overdue = c.invoices
        .filter((inv) => {

          if (inv.status === "paid" || inv.total <= inv.paidAmount) {
            return false;
          }

          if (inv.status === "overdue") {
            return true;
          }

          const isPastMonth = inv.year < currentYear ||
            (inv.year === currentYear && inv.month < currentMonth);

          const isCurrentMonthOverdue = inv.year === currentYear &&
            inv.month === currentMonth &&
            new Date(inv.dueDate) < now;

          return isPastMonth || isCurrentMonthOverdue;
        })
        .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
      return acc + overdue;
    }, 0);

    const nextInvoices = creditCards.flatMap((c) =>
      c.invoices
        .filter((inv) => inv.status !== "paid" && inv.total > inv.paidAmount)
        .map((inv) => ({
          cardId: c.id,
          cardName: c.name,
          total: inv.total - inv.paidAmount,
          dueDate: inv.dueDate,
        }))
    );
    const nextInvoice = nextInvoices.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.isCompleted).length;
    const totalGoalTarget = goals.reduce((acc, g) => acc + g.targetValue, 0);
    const totalGoalCurrent = goals.reduce((acc, g) => acc + g.currentValue, 0);
    const goalsProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.value, 0);
    const monthlyExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.value, 0);
    const monthlyBalance = monthlyIncome - monthlyExpenses;

    const totalWealth = balance + currentInvestmentValue + totalGoalCurrent - overdueDebts;

    return NextResponse.json({

      balance: {
        current: balance,
        monthlyIncome,
        monthlyExpenses,
        monthlyBalance,
      },

      investments: {
        totalInvested,
        currentValue: currentInvestmentValue,
        profitLoss: investmentProfitLoss,
        profitLossPercent: totalInvested > 0 ? (investmentProfitLoss / totalInvested) * 100 : 0,
        count: investments.length,
      },

      cards: {
        totalLimit: totalCardLimit,
        usedLimit: usedCardLimit,
        availableLimit: availableCardLimit,
        usagePercent: totalCardLimit > 0 ? (usedCardLimit / totalCardLimit) * 100 : 0,
        count: creditCards.length,
        nextInvoice: nextInvoice
          ? {
              cardId: nextInvoice.cardId,
              cardName: nextInvoice.cardName,
              total: nextInvoice.total,
              dueDate: nextInvoice.dueDate,
            }
          : null,
      },

      goals: {
        total: totalGoals,
        completed: completedGoals,
        targetValue: totalGoalTarget,
        currentValue: totalGoalCurrent,
        progress: goalsProgress,
      },

      wealth: {
        total: totalWealth,
        breakdown: {
          balance,
          investments: currentInvestmentValue,
          goals: totalGoalCurrent,
          debts: overdueDebts > 0 ? -overdueDebts : 0,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar resumo do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar resumo" },
      { status: 500 }
    );
  }
}
