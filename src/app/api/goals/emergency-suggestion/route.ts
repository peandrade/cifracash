import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/goals/emergency-suggestion
 * Calcula sugestão de reserva de emergência baseado nas despesas mensais
 * Retorna: média de despesas * 6 (6 meses de reserva)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Busca despesas dos últimos 6 meses
    const expenses = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: "expense",
        date: {
          gte: sixMonthsAgo,
        },
      },
    });

    // Busca compras no cartão dos últimos 6 meses
    const purchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: sixMonthsAgo,
        },
        invoice: {
          creditCard: {
            userId: session.user.id,
          },
        },
      },
    });

    // Busca despesas recorrentes ativas
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    // Calcula total de despesas
    const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.value, 0);
    const totalRecurring = recurringExpenses.reduce((sum, r) => sum + r.value, 0);

    // Calcula número de meses com dados
    const monthsWithData = Math.max(
      Math.min(
        (now.getFullYear() - sixMonthsAgo.getFullYear()) * 12 +
          (now.getMonth() - sixMonthsAgo.getMonth()) + 1,
        6
      ),
      1
    );

    // Média mensal de despesas (transações + cartão)
    const averageMonthlyExpenses = (totalExpenses + totalPurchases) / monthsWithData;

    // Considera também as despesas recorrentes se forem maiores
    const estimatedMonthlyExpenses = Math.max(averageMonthlyExpenses, totalRecurring);

    // Reserva de emergência = 6x despesas mensais
    const emergencyFundTarget = estimatedMonthlyExpenses * 6;

    // Busca meta de emergência existente
    const existingEmergencyGoal = await prisma.financialGoal.findFirst({
      where: {
        userId: session.user.id,
        category: "emergency",
      },
    });

    return NextResponse.json({
      averageMonthlyExpenses: Math.round(averageMonthlyExpenses * 100) / 100,
      recurringExpenses: totalRecurring,
      estimatedMonthlyExpenses: Math.round(estimatedMonthlyExpenses * 100) / 100,
      suggestedTarget: Math.round(emergencyFundTarget * 100) / 100,
      monthsAnalyzed: monthsWithData,
      existingGoal: existingEmergencyGoal
        ? {
            id: existingEmergencyGoal.id,
            currentValue: existingEmergencyGoal.currentValue,
            targetValue: existingEmergencyGoal.targetValue,
          }
        : null,
      breakdown: {
        transactionExpenses: Math.round(totalExpenses * 100) / 100,
        cardPurchases: Math.round(totalPurchases * 100) / 100,
        recurringMonthly: totalRecurring,
      },
    });
  } catch (error) {
    console.error("Erro ao calcular sugestão de emergência:", error);
    return NextResponse.json(
      { error: "Erro ao calcular sugestão de emergência" },
      { status: 500 }
    );
  }
}
