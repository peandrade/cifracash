import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface WealthDataPoint {
  month: string;
  label: string;
  transactionBalance: number;
  investmentValue: number;
  cardDebt: number;
  totalWealth: number;
  goalsSaved: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "1y";

    const now = new Date();
    let startDate: Date;
    const groupByDay = period === "1w" || period === "1m";

    switch (period) {
      case "1w":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "1m":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "3m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "6m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "1y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    }

    const [transactions, operations, invoices, goals] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          date: { gte: startDate },
        },
        orderBy: { date: "asc" },
      }),
      prisma.operation.findMany({
        where: {
          date: { gte: startDate },
          investment: {
            userId: session.user.id,
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.invoice.findMany({
        where: {
          creditCard: {
            userId: session.user.id,
          },
          OR: [
            { year: { gt: startDate.getFullYear() } },
            {
              AND: [
                { year: startDate.getFullYear() },
                { month: { gte: startDate.getMonth() + 1 } },
              ],
            },
          ],
        },
        include: { purchases: true },
      }),
      prisma.financialGoal.findMany({
        where: { userId: session.user.id },
      }),
    ]);

    const initialTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { lt: startDate },
      },
    });

    const initialOperations = await prisma.operation.findMany({
      where: {
        date: { lt: startDate },
        investment: {
          userId: session.user.id,
        },
      },
    });

    let initialTransactionBalance = 0;
    for (const t of initialTransactions) {
      if (t.type === "income") {
        initialTransactionBalance += t.value;
      } else {
        initialTransactionBalance -= t.value;
      }
    }

    let initialInvestmentValue = 0;
    for (const op of initialOperations) {
      if (op.type === "buy" || op.type === "deposit") {
        initialInvestmentValue += op.total;
      } else if (op.type === "sell" || op.type === "withdraw") {
        initialInvestmentValue -= op.total;
      }
    }

    const periods: string[] = [];
    const dataByPeriod: Record<string, WealthDataPoint> = {};
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    if (groupByDay) {
      // Group by day for short periods
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);

      while (current <= now) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        periods.push(key);

        const label = period === "1w"
          ? `${dayNames[current.getDay()]} ${current.getDate()}`
          : `${String(current.getDate()).padStart(2, "0")}/${String(current.getMonth() + 1).padStart(2, "0")}`;

        dataByPeriod[key] = {
          month: key,
          label,
          transactionBalance: initialTransactionBalance,
          investmentValue: initialInvestmentValue,
          cardDebt: 0,
          totalWealth: 0,
          goalsSaved: 0,
        };

        current.setDate(current.getDate() + 1);
      }
    } else {
      // Group by month for longer periods
      const current = new Date(startDate);
      while (current <= now) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        periods.push(key);

        const monthLabel = new Date(current.getFullYear(), current.getMonth()).toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });

        dataByPeriod[key] = {
          month: key,
          label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          transactionBalance: initialTransactionBalance,
          investmentValue: initialInvestmentValue,
          cardDebt: 0,
          totalWealth: 0,
          goalsSaved: 0,
        };

        current.setMonth(current.getMonth() + 1);
      }
    }

    // Process transactions
    let runningTransactionBalance = initialTransactionBalance;
    for (const key of periods) {
      const filteredTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        if (groupByDay) {
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return dateKey === key;
        } else {
          const [year, monthNum] = key.split("-").map(Number);
          return d.getFullYear() === year && d.getMonth() + 1 === monthNum;
        }
      });

      for (const t of filteredTransactions) {
        if (t.type === "income") {
          runningTransactionBalance += t.value;
        } else {
          runningTransactionBalance -= t.value;
        }
      }

      dataByPeriod[key].transactionBalance = runningTransactionBalance;
    }

    // Process operations
    let runningInvestmentValue = initialInvestmentValue;
    for (const key of periods) {
      const filteredOperations = operations.filter((op) => {
        const d = new Date(op.date);
        if (groupByDay) {
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return dateKey === key;
        } else {
          const [year, monthNum] = key.split("-").map(Number);
          return d.getFullYear() === year && d.getMonth() + 1 === monthNum;
        }
      });

      for (const op of filteredOperations) {
        if (op.type === "buy" || op.type === "deposit") {
          runningInvestmentValue += op.total;
        } else if (op.type === "sell" || op.type === "withdraw") {
          runningInvestmentValue -= op.total;
        }
      }

      dataByPeriod[key].investmentValue = runningInvestmentValue;
    }

    // Process card debt
    for (const key of periods) {
      let keyDate: Date;

      if (groupByDay) {
        const [year, month, day] = key.split("-").map(Number);
        keyDate = new Date(year, month - 1, day);
      } else {
        const [year, month] = key.split("-").map(Number);
        keyDate = new Date(year, month - 1);
      }

      const relevantInvoices = invoices.filter((inv) => {
        const invDate = new Date(inv.year, inv.month - 1);
        return invDate <= keyDate && inv.status !== "paid";
      });

      dataByPeriod[key].cardDebt = relevantInvoices.reduce(
        (sum, inv) => sum + Math.max(inv.total - inv.paidAmount, 0),
        0
      );
    }

    // Add goals saved
    const totalGoalsSaved = goals.reduce((sum, g) => sum + g.currentValue, 0);
    for (const key of periods) {
      dataByPeriod[key].goalsSaved = totalGoalsSaved;
    }

    // Calculate total wealth
    for (const key of periods) {
      const d = dataByPeriod[key];
      d.totalWealth = d.transactionBalance + d.investmentValue + d.goalsSaved - d.cardDebt;
    }

    const evolution = periods.map((p) => dataByPeriod[p]);

    const current_data = evolution[evolution.length - 1] || {
      transactionBalance: 0,
      investmentValue: 0,
      cardDebt: 0,
      totalWealth: 0,
      goalsSaved: 0,
    };

    const previousPeriod = evolution[evolution.length - 2];
    const wealthChange = previousPeriod
      ? current_data.totalWealth - previousPeriod.totalWealth
      : 0;
    const wealthChangePercent = previousPeriod && previousPeriod.totalWealth !== 0
      ? ((current_data.totalWealth - previousPeriod.totalWealth) / Math.abs(previousPeriod.totalWealth)) * 100
      : 0;

    return NextResponse.json({
      evolution,
      summary: {
        currentWealth: current_data.totalWealth,
        transactionBalance: current_data.transactionBalance,
        investmentValue: current_data.investmentValue,
        goalsSaved: current_data.goalsSaved,
        cardDebt: current_data.cardDebt,
        wealthChange,
        wealthChangePercent,
      },
      period,
    });
  } catch (error) {
    console.error("Erro ao calcular evolução patrimonial:", error);
    return NextResponse.json(
      { error: "Erro ao calcular evolução patrimonial" },
      { status: 500 }
    );
  }
}
