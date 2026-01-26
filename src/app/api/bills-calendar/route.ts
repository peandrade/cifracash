import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, startOfMonth, endOfMonth, format } from "date-fns";

export interface BillEvent {
  id: string;
  type: "recurring" | "invoice";
  description: string;
  value: number;
  category: string;
  dueDate: string;
  day: number;
  isPaid: boolean;
  isPastDue: boolean;
  cardName?: string;
  cardColor?: string;
}

export interface DayBills {
  day: number;
  date: string;
  bills: BillEvent[];
  total: number;
  isToday: boolean;
  isPast: boolean;
}

export interface CashFlowProjection {
  month: string;
  monthLabel: string;
  expectedIncome: number;
  expectedExpenses: number;
  recurringExpenses: number;
  cardInvoices: number;
  netFlow: number;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    // Get recurring expenses
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // Get credit cards with unpaid/current invoices
    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        invoices: {
          where: {
            OR: [
              { status: "open" },
              { status: "closed" },
              {
                month: currentMonth + 1,
                year: currentYear,
              },
            ],
          },
        },
      },
    });

    // Build bill events for the current month
    const billEvents: BillEvent[] = [];

    // Add recurring expenses
    for (const expense of recurringExpenses) {
      const lastLaunched = expense.lastLaunchedAt
        ? new Date(expense.lastLaunchedAt)
        : null;
      const isLaunchedThisMonth = lastLaunched
        ? lastLaunched.getMonth() === currentMonth &&
          lastLaunched.getFullYear() === currentYear
        : false;

      billEvents.push({
        id: expense.id,
        type: "recurring",
        description: expense.description,
        value: expense.value,
        category: expense.category,
        dueDate: new Date(currentYear, currentMonth, expense.dueDay).toISOString(),
        day: expense.dueDay,
        isPaid: isLaunchedThisMonth,
        isPastDue: today > expense.dueDay && !isLaunchedThisMonth,
      });
    }

    // Add credit card invoices
    for (const card of creditCards) {
      const currentInvoice = card.invoices.find(
        (inv) => inv.month === currentMonth + 1 && inv.year === currentYear
      );

      if (currentInvoice && currentInvoice.total > 0) {
        const isPaid = currentInvoice.status === "paid" || currentInvoice.paidAmount >= currentInvoice.total;

        billEvents.push({
          id: currentInvoice.id,
          type: "invoice",
          description: `Fatura ${card.name}`,
          value: currentInvoice.total - currentInvoice.paidAmount,
          category: "Fatura Cartão",
          dueDate: currentInvoice.dueDate.toISOString(),
          day: card.dueDay,
          isPaid,
          isPastDue: today > card.dueDay && !isPaid,
          cardName: card.name,
          cardColor: card.color,
        });
      }
    }

    // Group bills by day
    const daysInMonth = endDate.getDate();
    const calendar: DayBills[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBills = billEvents.filter((bill) => bill.day === day);
      const dayDate = new Date(currentYear, currentMonth, day);

      calendar.push({
        day,
        date: dayDate.toISOString(),
        bills: dayBills,
        total: dayBills.reduce((sum, bill) => sum + bill.value, 0),
        isToday: day === today,
        isPast: day < today,
      });
    }

    // Calculate cash flow projection for next 3 months
    const cashFlowProjection: CashFlowProjection[] = [];

    // Get average income from last 3 months
    const threeMonthsAgo = addMonths(now, -3);
    const incomeTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: "income",
        date: { gte: threeMonthsAgo, lte: now },
      },
    });
    const avgIncome = incomeTransactions.length > 0
      ? incomeTransactions.reduce((sum, t) => sum + t.value, 0) / 3
      : 0;

    // Get average expenses from last 3 months
    const expenseTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        category: { not: "Fatura Cartão" },
        date: { gte: threeMonthsAgo, lte: now },
      },
    });
    const avgExpenses = expenseTransactions.length > 0
      ? expenseTransactions.reduce((sum, t) => sum + t.value, 0) / 3
      : 0;

    // Calculate recurring expenses total
    const totalRecurring = recurringExpenses.reduce((sum, e) => sum + e.value, 0);

    // Project next 3 months
    for (let i = 0; i < 3; i++) {
      const projectionDate = addMonths(now, i);
      const projectionMonth = projectionDate.getMonth() + 1;
      const projectionYear = projectionDate.getFullYear();

      // Get card invoices for this month
      let cardTotal = 0;
      for (const card of creditCards) {
        const invoice = card.invoices.find(
          (inv) => inv.month === projectionMonth && inv.year === projectionYear
        );
        if (invoice) {
          cardTotal += invoice.total - invoice.paidAmount;
        }
      }

      const expectedExpenses = (i === 0 ? avgExpenses : avgExpenses) + totalRecurring + cardTotal;

      cashFlowProjection.push({
        month: format(projectionDate, "yyyy-MM"),
        monthLabel: format(projectionDate, "MMM yyyy", { locale: require("date-fns/locale/pt-BR").ptBR }),
        expectedIncome: avgIncome,
        expectedExpenses,
        recurringExpenses: totalRecurring,
        cardInvoices: cardTotal,
        netFlow: avgIncome - expectedExpenses,
      });
    }

    // Calculate summary
    const totalPendingBills = billEvents.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.value, 0);
    const totalPaidBills = billEvents.filter((b) => b.isPaid).reduce((sum, b) => sum + b.value, 0);
    const overdueBills = billEvents.filter((b) => b.isPastDue);
    const upcomingBills = billEvents.filter((b) => !b.isPaid && !b.isPastDue && b.day >= today);

    return NextResponse.json({
      calendar,
      bills: billEvents,
      cashFlowProjection,
      summary: {
        totalBills: billEvents.length,
        totalValue: billEvents.reduce((sum, b) => sum + b.value, 0),
        totalPending: totalPendingBills,
        totalPaid: totalPaidBills,
        overdueCount: overdueBills.length,
        overdueValue: overdueBills.reduce((sum, b) => sum + b.value, 0),
        upcomingCount: upcomingBills.length,
        upcomingValue: upcomingBills.reduce((sum, b) => sum + b.value, 0),
        nextDue: upcomingBills.length > 0
          ? upcomingBills.sort((a, b) => a.day - b.day)[0]
          : null,
      },
      currentMonth: currentMonth + 1,
      currentYear,
    });
  } catch (error) {
    console.error("Erro ao buscar calendário de contas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar calendário de contas" },
      { status: 500 }
    );
  }
}
