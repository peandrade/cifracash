import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfYearDate = startOfYear(now);
    const sixMonthsAgo = subMonths(now, 6);

    // Fetch all necessary data in parallel
    const [
      monthlyTransactions,
      yearlyTransactions,
      investments,
      creditCards,
      goals,
      budgets,
      recurringExpenses,
      last6MonthsTransactions,
    ] = await Promise.all([
      // Current month transactions
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
        },
      }),
      // Year to date transactions
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfYearDate, lte: now },
        },
      }),
      // Investments
      prisma.investment.findMany({
        where: { userId },
      }),
      // Credit cards with invoices
      prisma.creditCard.findMany({
        where: { userId },
        include: {
          invoices: {
            where: { status: { not: "paid" } },
          },
        },
      }),
      // Financial goals
      prisma.financialGoal.findMany({
        where: { userId },
      }),
      // Budgets
      prisma.budget.findMany({
        where: { userId },
      }),
      // Recurring expenses
      prisma.recurringExpense.findMany({
        where: { userId, isActive: true },
      }),
      // Last 6 months transactions for trends
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: sixMonthsAgo, lte: now },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    // === CALCULATE SAVINGS RATE ===
    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.value, 0);

    const monthlyExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.value, 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const monthlySavingsRate = monthlyIncome > 0
      ? (monthlySavings / monthlyIncome) * 100
      : 0;

    const yearlyIncome = yearlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.value, 0);

    const yearlyExpenses = yearlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.value, 0);

    const yearlySavings = yearlyIncome - yearlyExpenses;
    const yearlySavingsRate = yearlyIncome > 0
      ? (yearlySavings / yearlyIncome) * 100
      : 0;

    // === CALCULATE CREDIT UTILIZATION ===
    const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
    const totalCreditUsed = creditCards.reduce((sum, card) => {
      const unpaidTotal = card.invoices.reduce((invSum, inv) => invSum + inv.total - inv.paidAmount, 0);
      return sum + unpaidTotal;
    }, 0);
    const creditUtilization = totalCreditLimit > 0
      ? (totalCreditUsed / totalCreditLimit) * 100
      : 0;

    // === CALCULATE EMERGENCY FUND STATUS ===
    const monthlyExpenseAverage = recurringExpenses.reduce((sum, exp) => sum + exp.value, 0) +
      (monthlyExpenses / 1); // Use current month expenses as base

    const emergencyGoal = goals.find((g) => g.category === "emergency");
    const emergencyFundMonths = monthlyExpenseAverage > 0 && emergencyGoal
      ? emergencyGoal.currentValue / monthlyExpenseAverage
      : 0;

    // === CALCULATE GOALS PROGRESS ===
    const totalGoalsTarget = goals.reduce((sum, g) => sum + g.targetValue, 0);
    const totalGoalsCurrent = goals.reduce((sum, g) => sum + g.currentValue, 0);
    const goalsProgress = totalGoalsTarget > 0
      ? (totalGoalsCurrent / totalGoalsTarget) * 100
      : 0;

    // === CALCULATE INVESTMENT DIVERSIFICATION ===
    const investmentsByType = investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.currentValue;
      return acc;
    }, {} as Record<string, number>);

    const totalInvestments = Object.values(investmentsByType).reduce((a, b) => a + b, 0);
    const investmentTypes = Object.keys(investmentsByType).length;
    const diversificationScore = Math.min(investmentTypes / 5, 1) * 100; // Max 5 types for 100%

    // === CALCULATE BUDGET ADHERENCE ===
    const categoryExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.value;
        return acc;
      }, {} as Record<string, number>);

    let budgetAdherence = 100;
    if (budgets.length > 0) {
      const budgetStatuses = budgets.map((budget) => {
        const spent = categoryExpenses[budget.category] || 0;
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        return Math.min(percentage, 200); // Cap at 200% to avoid extreme values
      });
      const avgBudgetUsage = budgetStatuses.reduce((a, b) => a + b, 0) / budgetStatuses.length;
      budgetAdherence = Math.max(0, 100 - Math.max(0, avgBudgetUsage - 100));
    }

    // === CALCULATE SPENDING TREND ===
    const monthlyData = new Map<string, { income: number; expense: number }>();
    last6MonthsTransactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0 });
      }
      const data = monthlyData.get(monthKey)!;
      if (t.type === "income") {
        data.income += t.value;
      } else {
        data.expense += t.value;
      }
    });

    const monthlyArray = Array.from(monthlyData.values());
    let spendingTrend = 0;
    if (monthlyArray.length >= 2) {
      const recentExpenses = monthlyArray.slice(-3).reduce((a, b) => a + b.expense, 0) / 3;
      const olderExpenses = monthlyArray.slice(0, -3).reduce((a, b) => a + b.expense, 0) / Math.max(monthlyArray.length - 3, 1);
      spendingTrend = olderExpenses > 0 ? ((recentExpenses - olderExpenses) / olderExpenses) * 100 : 0;
    }

    // === CALCULATE FINANCIAL HEALTH SCORE (0-1000) ===
    const scores = {
      savingsRate: Math.min(Math.max(monthlySavingsRate, 0), 50) * 2, // 0-100 (50%+ savings = max)
      creditUtilization: Math.max(0, 100 - creditUtilization * 3.33), // 0-100 (30% = 0 score)
      emergencyFund: Math.min(emergencyFundMonths / 6, 1) * 100, // 0-100 (6 months = max)
      goalsProgress: goalsProgress, // 0-100
      diversification: diversificationScore, // 0-100
      budgetAdherence: budgetAdherence, // 0-100
      spendingTrend: Math.max(0, 100 - Math.abs(spendingTrend)), // 0-100 (stable = max)
    };

    // Weighted average for final score
    const weights = {
      savingsRate: 0.25,
      creditUtilization: 0.20,
      emergencyFund: 0.20,
      goalsProgress: 0.10,
      diversification: 0.10,
      budgetAdherence: 0.10,
      spendingTrend: 0.05,
    };

    const weightedScore = Object.entries(scores).reduce((total, [key, value]) => {
      return total + value * weights[key as keyof typeof weights];
    }, 0);

    const finalScore = Math.round(weightedScore * 10); // Scale to 0-1000

    // Determine score level
    let scoreLevel: "excellent" | "good" | "fair" | "poor";
    let scoreMessage: string;
    if (finalScore >= 800) {
      scoreLevel = "excellent";
      scoreMessage = "Excelente! Sua saúde financeira está ótima.";
    } else if (finalScore >= 600) {
      scoreLevel = "good";
      scoreMessage = "Bom! Você está no caminho certo.";
    } else if (finalScore >= 400) {
      scoreLevel = "fair";
      scoreMessage = "Regular. Há espaço para melhorar.";
    } else {
      scoreLevel = "poor";
      scoreMessage = "Atenção! Revise suas finanças.";
    }

    // Generate improvement tips
    const tips: string[] = [];
    if (monthlySavingsRate < 20) {
      tips.push("Tente aumentar sua taxa de poupança para pelo menos 20%");
    }
    if (creditUtilization > 30) {
      tips.push("Reduza o uso do cartão de crédito para menos de 30% do limite");
    }
    if (emergencyFundMonths < 3) {
      tips.push("Priorize construir uma reserva de emergência de 3-6 meses");
    }
    if (investmentTypes < 3) {
      tips.push("Diversifique seus investimentos em mais classes de ativos");
    }
    if (budgetAdherence < 80) {
      tips.push("Revise seus orçamentos - você está gastando além do planejado");
    }

    return NextResponse.json({
      score: finalScore,
      scoreLevel,
      scoreMessage,
      tips,
      details: {
        savingsRate: {
          monthly: {
            income: monthlyIncome,
            expenses: monthlyExpenses,
            savings: monthlySavings,
            rate: monthlySavingsRate,
          },
          yearly: {
            income: yearlyIncome,
            expenses: yearlyExpenses,
            savings: yearlySavings,
            rate: yearlySavingsRate,
          },
        },
        creditUtilization: {
          limit: totalCreditLimit,
          used: totalCreditUsed,
          percentage: creditUtilization,
        },
        emergencyFund: {
          current: emergencyGoal?.currentValue || 0,
          monthlyExpenses: monthlyExpenseAverage,
          monthsCovered: emergencyFundMonths,
          target: 6,
        },
        goals: {
          total: goals.length,
          completed: goals.filter((g) => g.isCompleted).length,
          progress: goalsProgress,
        },
        investments: {
          total: totalInvestments,
          types: investmentTypes,
          diversification: diversificationScore,
          byType: investmentsByType,
        },
        budgetAdherence,
        spendingTrend,
      },
      componentScores: scores,
    });
  } catch (error) {
    console.error("Erro ao calcular saúde financeira:", error);
    return NextResponse.json(
      { error: "Erro ao calcular saúde financeira" },
      { status: 500 }
    );
  }
}
