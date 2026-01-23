import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface WealthDataPoint {
  month: string; // "2024-01"
  label: string; // "Jan/24"
  transactionBalance: number; // Saldo de transações (receitas - despesas)
  investmentValue: number; // Valor investido
  cardDebt: number; // Dívida no cartão
  totalWealth: number; // Patrimônio líquido
  goalsSaved: number; // Valor guardado em metas
}

/**
 * GET /api/wealth-evolution
 * Retorna evolução patrimonial ao longo do tempo
 * Query params:
 * - period: "6m" | "1y" | "2y" | "all" (default: "1y")
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "1y";

    // Calcula data inicial baseado no período
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "6m":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "1y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case "2y":
        startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1);
        break;
      case "all":
        startDate = new Date(2020, 0, 1); // Começa de 2020
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    }

    // Busca todos os dados necessários
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

    // Busca saldo inicial (antes do período)
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

    // Calcula saldos iniciais
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

    // Gera lista de meses no período
    const months: string[] = [];
    const current = new Date(startDate);
    while (current <= now) {
      months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
      current.setMonth(current.getMonth() + 1);
    }

    // Agrupa dados por mês
    const dataByMonth: Record<string, WealthDataPoint> = {};

    // Inicializa todos os meses
    let runningTransactionBalance = initialTransactionBalance;
    let runningInvestmentValue = initialInvestmentValue;

    for (const month of months) {
      const [year, monthNum] = month.split("-").map(Number);
      const monthLabel = new Date(year, monthNum - 1).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });

      dataByMonth[month] = {
        month,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        transactionBalance: runningTransactionBalance,
        investmentValue: runningInvestmentValue,
        cardDebt: 0,
        totalWealth: 0,
        goalsSaved: 0,
      };
    }

    // Processa transações
    runningTransactionBalance = initialTransactionBalance;
    for (const month of months) {
      const [year, monthNum] = month.split("-").map(Number);

      const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() + 1 === monthNum;
      });

      for (const t of monthTransactions) {
        if (t.type === "income") {
          runningTransactionBalance += t.value;
        } else {
          runningTransactionBalance -= t.value;
        }
      }

      dataByMonth[month].transactionBalance = runningTransactionBalance;
    }

    // Processa operações de investimento
    runningInvestmentValue = initialInvestmentValue;
    for (const month of months) {
      const [year, monthNum] = month.split("-").map(Number);

      const monthOperations = operations.filter((op) => {
        const d = new Date(op.date);
        return d.getFullYear() === year && d.getMonth() + 1 === monthNum;
      });

      for (const op of monthOperations) {
        if (op.type === "buy" || op.type === "deposit") {
          runningInvestmentValue += op.total;
        } else if (op.type === "sell" || op.type === "withdraw") {
          runningInvestmentValue -= op.total;
        }
      }

      dataByMonth[month].investmentValue = runningInvestmentValue;
    }

    // Processa dívidas de cartão (faturas não pagas)
    for (const invoice of invoices) {
      const month = `${invoice.year}-${String(invoice.month).padStart(2, "0")}`;
      if (dataByMonth[month]) {
        // Soma valor não pago da fatura
        const unpaid = invoice.total - invoice.paidAmount;
        if (unpaid > 0) {
          dataByMonth[month].cardDebt += unpaid;
        }
      }
    }

    // Propaga dívida do cartão para meses seguintes (se não paga)
    for (const month of months) {
      // A dívida acumulada é a soma das faturas não pagas até o momento
      const [year, monthNum] = month.split("-").map(Number);

      const relevantInvoices = invoices.filter((inv) => {
        const invDate = new Date(inv.year, inv.month - 1);
        const monthDate = new Date(year, monthNum - 1);
        return invDate <= monthDate && inv.status !== "paid";
      });

      dataByMonth[month].cardDebt = relevantInvoices.reduce(
        (sum, inv) => sum + Math.max(inv.total - inv.paidAmount, 0),
        0
      );
    }

    // Adiciona valor das metas (guardado)
    const totalGoalsSaved = goals.reduce((sum, g) => sum + g.currentValue, 0);
    // Distribui proporcionalmente (simplificação - na realidade seria por contribuição)
    for (const month of months) {
      dataByMonth[month].goalsSaved = totalGoalsSaved;
    }

    // Calcula patrimônio total
    for (const month of months) {
      const d = dataByMonth[month];
      // Patrimônio = Saldo + Investimentos + Metas - Dívidas
      d.totalWealth = d.transactionBalance + d.investmentValue + d.goalsSaved - d.cardDebt;
    }

    // Converte para array e ordena
    const evolution = months.map((m) => dataByMonth[m]);

    // Calcula resumo atual
    const current_data = evolution[evolution.length - 1] || {
      transactionBalance: 0,
      investmentValue: 0,
      cardDebt: 0,
      totalWealth: 0,
      goalsSaved: 0,
    };

    const previousMonth = evolution[evolution.length - 2];
    const wealthChange = previousMonth
      ? current_data.totalWealth - previousMonth.totalWealth
      : 0;
    const wealthChangePercent = previousMonth && previousMonth.totalWealth !== 0
      ? ((current_data.totalWealth - previousMonth.totalWealth) / Math.abs(previousMonth.totalWealth)) * 100
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
