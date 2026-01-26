import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from "date-fns";

interface CardSpendingByCategory {
  category: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

interface CardMonthlySpending {
  month: string;
  monthLabel: string;
  total: number;
  cardBreakdown: {
    cardId: string;
    cardName: string;
    cardColor: string;
    total: number;
  }[];
}

interface CardAlert {
  type: "payment_due" | "high_usage" | "closing_soon";
  cardId: string;
  cardName: string;
  cardColor: string;
  message: string;
  value?: number;
  daysUntil?: number;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const currentDay = now.getDate();
    const sixMonthsAgo = subMonths(now, 6);

    // Fetch credit cards with invoices and purchases
    const creditCards = await prisma.creditCard.findMany({
      where: { userId, isActive: true },
      include: {
        invoices: {
          include: {
            purchases: true,
          },
        },
      },
    });

    // === SPENDING BY CATEGORY (Last 6 months) ===
    const allPurchases = creditCards.flatMap((card) =>
      card.invoices.flatMap((inv) =>
        inv.purchases.filter((p) => new Date(p.date) >= sixMonthsAgo)
      )
    );

    const categoryTotals: Record<string, { total: number; count: number }> = {};
    for (const purchase of allPurchases) {
      if (!categoryTotals[purchase.category]) {
        categoryTotals[purchase.category] = { total: 0, count: 0 };
      }
      categoryTotals[purchase.category].total += purchase.value;
      categoryTotals[purchase.category].count += 1;
    }

    const totalSpending = Object.values(categoryTotals).reduce(
      (sum, cat) => sum + cat.total,
      0
    );

    const spendingByCategory: CardSpendingByCategory[] = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        total: data.total,
        percentage: totalSpending > 0 ? (data.total / totalSpending) * 100 : 0,
        transactionCount: data.count,
      }))
      .sort((a, b) => b.total - a.total);

    // === MONTHLY SPENDING TREND ===
    const monthlySpending: CardMonthlySpending[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM", {
        locale: require("date-fns/locale/pt-BR").ptBR,
      });

      const cardBreakdown: CardMonthlySpending["cardBreakdown"] = [];

      for (const card of creditCards) {
        const monthPurchases = card.invoices.flatMap((inv) =>
          inv.purchases.filter((p) => {
            const purchaseDate = new Date(p.date);
            return purchaseDate >= monthStart && purchaseDate <= monthEnd;
          })
        );

        const cardTotal = monthPurchases.reduce((sum, p) => sum + p.value, 0);

        if (cardTotal > 0) {
          cardBreakdown.push({
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color,
            total: cardTotal,
          });
        }
      }

      monthlySpending.push({
        month: monthKey,
        monthLabel,
        total: cardBreakdown.reduce((sum, c) => sum + c.total, 0),
        cardBreakdown,
      });
    }

    // === ALERTS ===
    const alerts: CardAlert[] = [];

    for (const card of creditCards) {
      // Check for payment due
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const currentInvoice = card.invoices.find(
        (inv) => inv.month === currentMonth && inv.year === currentYear
      );

      if (currentInvoice) {
        const dueDate = new Date(currentInvoice.dueDate);
        const daysUntilDue = differenceInDays(dueDate, now);

        // Payment due soon
        if (
          daysUntilDue >= 0 &&
          daysUntilDue <= 5 &&
          currentInvoice.status !== "paid" &&
          currentInvoice.total > currentInvoice.paidAmount
        ) {
          alerts.push({
            type: "payment_due",
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color,
            message:
              daysUntilDue === 0
                ? "Fatura vence HOJE!"
                : `Fatura vence em ${daysUntilDue} dia${daysUntilDue !== 1 ? "s" : ""}`,
            value: currentInvoice.total - currentInvoice.paidAmount,
            daysUntil: daysUntilDue,
          });
        }
      }

      // Check for closing soon
      const daysUntilClosing =
        card.closingDay >= currentDay
          ? card.closingDay - currentDay
          : 30 - currentDay + card.closingDay;

      if (daysUntilClosing <= 3) {
        alerts.push({
          type: "closing_soon",
          cardId: card.id,
          cardName: card.name,
          cardColor: card.color,
          message:
            daysUntilClosing === 0
              ? "Fatura fecha HOJE!"
              : `Fatura fecha em ${daysUntilClosing} dia${daysUntilClosing !== 1 ? "s" : ""}`,
          daysUntil: daysUntilClosing,
        });
      }

      // Check for high usage
      const usedLimit = card.invoices.reduce((sum, inv) => {
        if (inv.status !== "paid") {
          return sum + (inv.total - inv.paidAmount);
        }
        return sum;
      }, 0);

      const usagePercent = card.limit > 0 ? (usedLimit / card.limit) * 100 : 0;

      if (usagePercent >= 80) {
        alerts.push({
          type: "high_usage",
          cardId: card.id,
          cardName: card.name,
          cardColor: card.color,
          message: `Uso do limite em ${usagePercent.toFixed(0)}%`,
          value: usedLimit,
        });
      }
    }

    // Sort alerts by priority
    alerts.sort((a, b) => {
      const priority = { payment_due: 0, closing_soon: 1, high_usage: 2 };
      return priority[a.type] - priority[b.type];
    });

    // === SUMMARY ===
    const totalLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
    const totalUsed = creditCards.reduce((sum, card) => {
      const used = card.invoices.reduce((invSum, inv) => {
        if (inv.status !== "paid") {
          return invSum + (inv.total - inv.paidAmount);
        }
        return invSum;
      }, 0);
      return sum + used;
    }, 0);

    const averageMonthlySpending =
      monthlySpending.reduce((sum, m) => sum + m.total, 0) / monthlySpending.length;

    return NextResponse.json({
      spendingByCategory,
      monthlySpending,
      alerts,
      summary: {
        totalCards: creditCards.length,
        totalLimit,
        totalUsed,
        usagePercentage: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
        averageMonthlySpending,
        totalSpendingLast6Months: totalSpending,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar analytics de cartões:", error);
    return NextResponse.json(
      { error: "Erro ao gerar analytics de cartões" },
      { status: 500 }
    );
  }
}
