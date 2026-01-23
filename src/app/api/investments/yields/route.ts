import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  fetchCDIHistory,
  calculateFixedIncomeYield,
  calculateIOF,
  calculateIR,
  type YieldCalculationResult,
} from "@/lib/cdi-history-service";

export interface InvestmentYield {
  investmentId: string;
  investmentName: string;
  type: string;
  indexer: string | null;
  contractedRate: number | null;
  totalInvested: number;
  calculation: YieldCalculationResult | null;
  depositCount?: number;
  error?: string;
}

export interface YieldsResponse {
  yields: InvestmentYield[];
  cdiHistory: {
    startDate: string;
    endDate: string;
    totalDays: number;
  } | null;
  lastUpdate: string;
}

/**
 * GET /api/investments/yields
 * Calcula os rendimentos de todos os investimentos de renda fixa
 *
 * IMPORTANTE: Calcula o rendimento de CADA aporte individualmente,
 * pois cada depósito tem sua própria data de início e período de rendimento.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca histórico do CDI (mais dias para cobrir investimentos antigos)
    const cdiHistory = await fetchCDIHistory(1500); // ~4 anos

    if (!cdiHistory) {
      return NextResponse.json(
        { error: "Não foi possível buscar histórico do CDI" },
        { status: 503 }
      );
    }

    // Busca investimentos de renda fixa com operações
    const investments = await prisma.investment.findMany({
      where: {
        userId: session.user.id,
        type: {
          in: ["cdb", "treasury", "lci_lca", "savings", "other"],
        },
      },
      include: {
        operations: {
          orderBy: { date: "asc" },
        },
      },
    });

    const yields: InvestmentYield[] = [];

    for (const inv of investments) {
      // Pula se não tiver indexador ou for N/A
      if (!inv.indexer || inv.indexer === "NA") {
        yields.push({
          investmentId: inv.id,
          investmentName: inv.name,
          type: inv.type,
          indexer: inv.indexer,
          contractedRate: inv.interestRate,
          totalInvested: inv.totalInvested,
          calculation: null,
          error: "Investimento sem indexador definido",
        });
        continue;
      }

      // Pula se não tiver operações (sem aportes)
      if (inv.operations.length === 0) {
        yields.push({
          investmentId: inv.id,
          investmentName: inv.name,
          type: inv.type,
          indexer: inv.indexer,
          contractedRate: inv.interestRate,
          totalInvested: inv.totalInvested,
          calculation: null,
          error: "Sem operações registradas",
        });
        continue;
      }

      // Filtra operações de depósito e resgate
      const deposits = inv.operations.filter(op => op.type === "deposit" || op.type === "buy");
      const withdrawals = inv.operations.filter(op => op.type === "sell" || op.type === "withdraw");

      if (deposits.length === 0) {
        yields.push({
          investmentId: inv.id,
          investmentName: inv.name,
          type: inv.type,
          indexer: inv.indexer,
          contractedRate: inv.interestRate,
          totalInvested: inv.totalInvested,
          calculation: null,
          error: "Sem aporte registrado",
        });
        continue;
      }

      // Calcula rendimento de CADA aporte individualmente
      let totalGrossValue = 0;
      let totalGrossYield = 0;
      let totalPrincipal = 0;
      let totalNetYield = 0;
      let totalIofAmount = 0;
      let totalIrAmount = 0;
      let maxCalendarDays = 0;
      let totalBusinessDays = 0;

      for (const deposit of deposits) {
        const depositDate = new Date(deposit.date).toISOString().split("T")[0];
        const depositValue = deposit.price;

        const result = calculateFixedIncomeYield(
          depositValue,
          depositDate,
          inv.interestRate || 100,
          inv.indexer,
          cdiHistory
        );

        if (result) {
          totalGrossValue += result.grossValue;
          totalGrossYield += result.grossYield;
          totalPrincipal += depositValue;
          totalNetYield += result.netYield;
          totalIofAmount += result.iofAmount;
          totalIrAmount += result.irAmount;

          if (result.calendarDays > maxCalendarDays) {
            maxCalendarDays = result.calendarDays;
            totalBusinessDays = result.businessDays;
          }
        } else {
          totalPrincipal += depositValue;
          totalGrossValue += depositValue;
        }
      }

      // Subtrai resgates
      let totalWithdrawals = 0;
      for (const withdrawal of withdrawals) {
        totalWithdrawals += withdrawal.price;
      }

      // Valor líquido final
      const totalNetValue = totalGrossValue - totalIofAmount - totalIrAmount - totalWithdrawals;

      // Calcula percentuais consolidados
      const effectivePrincipal = totalPrincipal - totalWithdrawals;
      const grossYieldPercent = effectivePrincipal > 0 ? (totalGrossYield / effectivePrincipal) * 100 : 0;
      const netYieldPercent = effectivePrincipal > 0 ? (totalNetYield / effectivePrincipal) * 100 : 0;

      // Alíquotas médias
      const avgIofPercent = totalGrossYield > 0 ? (totalIofAmount / totalGrossYield) * 100 : calculateIOF(maxCalendarDays);
      const avgIrPercent = calculateIR(maxCalendarDays);

      const calculation: YieldCalculationResult = {
        grossValue: totalGrossValue - totalWithdrawals,
        grossYield: totalGrossYield,
        grossYieldPercent,
        iofAmount: totalIofAmount,
        iofPercent: avgIofPercent,
        irAmount: totalIrAmount,
        irPercent: avgIrPercent,
        netValue: totalNetValue,
        netYield: totalNetYield,
        netYieldPercent,
        businessDays: totalBusinessDays,
        calendarDays: maxCalendarDays,
        dailyRates: [],
      };

      yields.push({
        investmentId: inv.id,
        investmentName: inv.name,
        type: inv.type,
        indexer: inv.indexer,
        contractedRate: inv.interestRate,
        totalInvested: inv.totalInvested,
        calculation,
        depositCount: deposits.length,
      });
    }

    // Atualiza os valores no banco de dados
    for (const yieldData of yields) {
      if (yieldData.calculation) {
        await prisma.investment.update({
          where: { id: yieldData.investmentId },
          data: {
            currentValue: yieldData.calculation.grossValue,
            profitLoss: yieldData.calculation.grossYield,
            profitLossPercent: yieldData.calculation.grossYieldPercent,
          },
        });
      }
    }

    const response: YieldsResponse = {
      yields,
      cdiHistory: {
        startDate: cdiHistory.startDate,
        endDate: cdiHistory.endDate,
        totalDays: cdiHistory.entries.length,
      },
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao calcular rendimentos:", error);
    return NextResponse.json(
      { error: "Erro ao calcular rendimentos" },
      { status: 500 }
    );
  }
}
