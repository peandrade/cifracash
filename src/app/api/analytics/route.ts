import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format, getDay, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CategoryTrend {
  category: string;
  months: {
    month: string;
    value: number;
  }[];
  trend: number; // percentage change
  average: number;
}

interface DayOfWeekPattern {
  dayOfWeek: number;
  dayName: string;
  totalExpenses: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
}

interface SpendingVelocity {
  currentMonth: {
    spent: number;
    dailyAverage: number;
    daysElapsed: number;
    projectedTotal: number;
  };
  comparison: {
    vsLastMonth: number;
    vsSameMonthLastYear: number;
  };
}

interface YearComparison {
  currentYear: number;
  previousYear: number;
  months: {
    month: number;
    monthName: string;
    currentYearExpenses: number;
    previousYearExpenses: number;
    currentYearIncome: number;
    previousYearIncome: number;
  }[];
  totals: {
    currentYearExpenses: number;
    previousYearExpenses: number;
    currentYearIncome: number;
    previousYearIncome: number;
    expenseChange: number;
    incomeChange: number;
  };
}

interface TopInsight {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
  value?: number;
  category?: string;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;
    const sixMonthsAgo = subMonths(now, 6);
    const twelveMonthsAgo = subMonths(now, 12);
    const startOfCurrentYear = startOfYear(now);

    // Fetch all transactions for the last 12 months
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: twelveMonthsAgo, lte: now },
      },
      orderBy: { date: "asc" },
    });

    // Fetch last year's transactions for YoY comparison
    const lastYearStart = new Date(previousYear, 0, 1);
    const lastYearEnd = new Date(previousYear, 11, 31, 23, 59, 59);
    const lastYearTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: lastYearStart, lte: lastYearEnd },
      },
    });

    // === DAY OF WEEK PATTERNS ===
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const dayOfWeekData: Record<number, { total: number; count: number }> = {};

    for (let i = 0; i < 7; i++) {
      dayOfWeekData[i] = { total: 0, count: 0 };
    }

    const recentExpenses = transactions.filter(
      (t) => t.type === "expense" && new Date(t.date) >= sixMonthsAgo
    );

    for (const t of recentExpenses) {
      const day = getDay(new Date(t.date));
      dayOfWeekData[day].total += t.value;
      dayOfWeekData[day].count += 1;
    }

    const totalExpenses = Object.values(dayOfWeekData).reduce((sum, d) => sum + d.total, 0);

    const dayOfWeekPatterns: DayOfWeekPattern[] = Object.entries(dayOfWeekData).map(
      ([day, data]) => ({
        dayOfWeek: parseInt(day),
        dayName: dayNames[parseInt(day)],
        totalExpenses: data.total,
        transactionCount: data.count,
        averageTransaction: data.count > 0 ? data.total / data.count : 0,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      })
    );

    // === CATEGORY TRENDS (Last 6 months) ===
    const categoryMonthlyData: Record<string, Record<string, number>> = {};
    const lastSixMonthsExpenses = transactions.filter(
      (t) => t.type === "expense" && new Date(t.date) >= sixMonthsAgo
    );

    for (const t of lastSixMonthsExpenses) {
      const monthKey = format(new Date(t.date), "yyyy-MM");
      if (!categoryMonthlyData[t.category]) {
        categoryMonthlyData[t.category] = {};
      }
      categoryMonthlyData[t.category][monthKey] =
        (categoryMonthlyData[t.category][monthKey] || 0) + t.value;
    }

    // Generate last 6 month keys
    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      monthKeys.push(format(subMonths(now, i), "yyyy-MM"));
    }

    const categoryTrends: CategoryTrend[] = Object.entries(categoryMonthlyData)
      .map(([category, months]) => {
        const monthlyValues = monthKeys.map((key) => ({
          month: key,
          value: months[key] || 0,
        }));

        const values = monthlyValues.map((m) => m.value);
        const average = values.reduce((a, b) => a + b, 0) / values.length;

        // Calculate trend (comparing last 3 months vs first 3 months)
        const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const olderAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

        return {
          category,
          months: monthlyValues,
          trend,
          average,
        };
      })
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);

    // === SPENDING VELOCITY ===
    const currentMonthStart = startOfMonth(now);
    const currentMonthTransactions = transactions.filter(
      (t) => t.type === "expense" && new Date(t.date) >= currentMonthStart
    );
    const currentMonthSpent = currentMonthTransactions.reduce((sum, t) => sum + t.value, 0);
    const daysElapsed = now.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    const dailyAverage = daysElapsed > 0 ? currentMonthSpent / daysElapsed : 0;
    const projectedTotal = dailyAverage * daysInMonth;

    // Last month's total
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const lastMonthTotal = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date) >= lastMonthStart &&
          new Date(t.date) <= lastMonthEnd
      )
      .reduce((sum, t) => sum + t.value, 0);

    // Same month last year
    const sameMonthLastYearStart = new Date(previousYear, now.getMonth(), 1);
    const sameMonthLastYearEnd = new Date(previousYear, now.getMonth() + 1, 0, 23, 59, 59);
    const sameMonthLastYearTotal = lastYearTransactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date) >= sameMonthLastYearStart &&
          new Date(t.date) <= sameMonthLastYearEnd
      )
      .reduce((sum, t) => sum + t.value, 0);

    const spendingVelocity: SpendingVelocity = {
      currentMonth: {
        spent: currentMonthSpent,
        dailyAverage,
        daysElapsed,
        projectedTotal,
      },
      comparison: {
        vsLastMonth: lastMonthTotal > 0 ? ((projectedTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
        vsSameMonthLastYear:
          sameMonthLastYearTotal > 0
            ? ((projectedTotal - sameMonthLastYearTotal) / sameMonthLastYearTotal) * 100
            : 0,
      },
    };

    // === YEAR COMPARISON ===
    const yearComparisonMonths: YearComparison["months"] = [];
    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];

    for (let month = 0; month < 12; month++) {
      const currentYearExpenses = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            new Date(t.date).getMonth() === month &&
            new Date(t.date).getFullYear() === currentYear
        )
        .reduce((sum, t) => sum + t.value, 0);

      const previousYearExpenses = lastYearTransactions
        .filter(
          (t) =>
            t.type === "expense" &&
            new Date(t.date).getMonth() === month
        )
        .reduce((sum, t) => sum + t.value, 0);

      const currentYearIncome = transactions
        .filter(
          (t) =>
            t.type === "income" &&
            new Date(t.date).getMonth() === month &&
            new Date(t.date).getFullYear() === currentYear
        )
        .reduce((sum, t) => sum + t.value, 0);

      const previousYearIncome = lastYearTransactions
        .filter(
          (t) =>
            t.type === "income" &&
            new Date(t.date).getMonth() === month
        )
        .reduce((sum, t) => sum + t.value, 0);

      yearComparisonMonths.push({
        month,
        monthName: monthNames[month],
        currentYearExpenses,
        previousYearExpenses,
        currentYearIncome,
        previousYearIncome,
      });
    }

    const currentYearTotalExpenses = yearComparisonMonths.reduce(
      (sum, m) => sum + m.currentYearExpenses,
      0
    );
    const previousYearTotalExpenses = yearComparisonMonths.reduce(
      (sum, m) => sum + m.previousYearExpenses,
      0
    );
    const currentYearTotalIncome = yearComparisonMonths.reduce(
      (sum, m) => sum + m.currentYearIncome,
      0
    );
    const previousYearTotalIncome = yearComparisonMonths.reduce(
      (sum, m) => sum + m.previousYearIncome,
      0
    );

    const yearComparison: YearComparison = {
      currentYear,
      previousYear,
      months: yearComparisonMonths,
      totals: {
        currentYearExpenses: currentYearTotalExpenses,
        previousYearExpenses: previousYearTotalExpenses,
        currentYearIncome: currentYearTotalIncome,
        previousYearIncome: previousYearTotalIncome,
        expenseChange:
          previousYearTotalExpenses > 0
            ? ((currentYearTotalExpenses - previousYearTotalExpenses) / previousYearTotalExpenses) * 100
            : 0,
        incomeChange:
          previousYearTotalIncome > 0
            ? ((currentYearTotalIncome - previousYearTotalIncome) / previousYearTotalIncome) * 100
            : 0,
      },
    };

    // === TOP INSIGHTS ===
    const insights: TopInsight[] = [];

    // Biggest spending increase
    const increasingCategories = categoryTrends.filter((c) => c.trend > 20);
    if (increasingCategories.length > 0) {
      const biggest = increasingCategories[0];
      insights.push({
        type: "negative",
        title: "Gastos em alta",
        description: `${biggest.category} aumentou ${biggest.trend.toFixed(0)}% nos últimos meses`,
        value: biggest.trend,
        category: biggest.category,
      });
    }

    // Biggest spending decrease
    const decreasingCategories = categoryTrends.filter((c) => c.trend < -20);
    if (decreasingCategories.length > 0) {
      const biggest = decreasingCategories.sort((a, b) => a.trend - b.trend)[0];
      insights.push({
        type: "positive",
        title: "Economia identificada",
        description: `${biggest.category} reduziu ${Math.abs(biggest.trend).toFixed(0)}% nos últimos meses`,
        value: biggest.trend,
        category: biggest.category,
      });
    }

    // Spending velocity insight
    if (spendingVelocity.comparison.vsLastMonth > 20) {
      insights.push({
        type: "negative",
        title: "Ritmo acelerado",
        description: `Você está gastando ${spendingVelocity.comparison.vsLastMonth.toFixed(0)}% mais rápido que o mês passado`,
        value: spendingVelocity.comparison.vsLastMonth,
      });
    } else if (spendingVelocity.comparison.vsLastMonth < -20) {
      insights.push({
        type: "positive",
        title: "Ritmo controlado",
        description: `Seus gastos estão ${Math.abs(spendingVelocity.comparison.vsLastMonth).toFixed(0)}% menores que o mês passado`,
        value: spendingVelocity.comparison.vsLastMonth,
      });
    }

    // Day of week insight
    const highestSpendingDay = dayOfWeekPatterns.reduce((max, day) =>
      day.totalExpenses > max.totalExpenses ? day : max
    );
    if (highestSpendingDay.percentage > 20) {
      insights.push({
        type: "neutral",
        title: "Padrão de gastos",
        description: `${highestSpendingDay.dayName} é o dia que você mais gasta (${highestSpendingDay.percentage.toFixed(0)}% do total)`,
        value: highestSpendingDay.percentage,
      });
    }

    return NextResponse.json({
      dayOfWeekPatterns,
      categoryTrends,
      spendingVelocity,
      yearComparison,
      insights,
    });
  } catch (error) {
    console.error("Erro ao gerar analytics:", error);
    return NextResponse.json(
      { error: "Erro ao gerar analytics" },
      { status: 500 }
    );
  }
}
