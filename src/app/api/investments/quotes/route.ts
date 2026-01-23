import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchQuotes } from "@/lib/quotes-service";
import { InvestmentType } from "@prisma/client";

// Tipos que suportam atualização automática de cotação
const QUOTABLE_TYPES: InvestmentType[] = [
  InvestmentType.stock,
  InvestmentType.fii,
  InvestmentType.etf,
  InvestmentType.crypto,
];

/**
 * POST /api/investments/quotes
 * Atualiza as cotações de todos os investimentos com ticker
 */
export async function POST() {
  try {
    console.log("[Quotes API] Iniciando busca de investimentos...");

    // Busca investimentos que têm ticker e são de tipos suportados
    const investments = await prisma.investment.findMany({
      where: {
        ticker: { not: null },
        type: { in: QUOTABLE_TYPES },
      },
      select: {
        id: true,
        ticker: true,
        type: true,
        quantity: true,
        totalInvested: true,
      },
    });

    console.log(`[Quotes API] Encontrados ${investments.length} investimentos`);

    if (investments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum investimento para atualizar",
        updated: 0,
        errors: [],
      });
    }

    console.log("[Quotes API] Buscando cotações...");

    // Busca cotações
    const quotes = await fetchQuotes(
      investments.map((inv) => ({ ticker: inv.ticker!, type: inv.type }))
    );

    console.log(`[Quotes API] Cotações recebidas: ${quotes.size}`);

    const updated: string[] = [];
    const errors: Array<{ ticker: string; error: string }> = [];

    // Atualiza cada investimento
    for (const investment of investments) {
      const ticker = investment.ticker!.toUpperCase();
      const quote = quotes.get(ticker);

      if (!quote || quote.source === "error") {
        errors.push({
          ticker: investment.ticker!,
          error: quote?.error || "Cotação não encontrada",
        });
        continue;
      }

      // Calcula novo valor
      const currentPrice = quote.price;
      const currentValue = investment.quantity * currentPrice;
      const profitLoss = currentValue - investment.totalInvested;
      const profitLossPercent =
        investment.totalInvested > 0
          ? (profitLoss / investment.totalInvested) * 100
          : 0;

      // Atualiza no banco
      await prisma.investment.update({
        where: { id: investment.id },
        data: {
          currentPrice,
          currentValue,
          profitLoss,
          profitLossPercent,
        },
      });

      updated.push(investment.ticker!);
    }

    return NextResponse.json({
      success: true,
      message: `${updated.length} cotações atualizadas`,
      updated: updated.length,
      updatedTickers: updated,
      errors,
    });
  } catch (error) {
    console.error("Erro ao atualizar cotações:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar cotações",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/investments/quotes
 * Retorna as cotações atuais sem atualizar o banco
 * (útil para preview)
 */
export async function GET() {
  try {
    const investments = await prisma.investment.findMany({
      where: {
        ticker: { not: null },
        type: { in: QUOTABLE_TYPES },
      },
      select: {
        id: true,
        ticker: true,
        type: true,
        name: true,
        currentPrice: true,
      },
    });

    if (investments.length === 0) {
      return NextResponse.json({
        success: true,
        quotes: [],
      });
    }

    const quotes = await fetchQuotes(
      investments.map((inv) => ({ ticker: inv.ticker!, type: inv.type }))
    );

    const results = investments.map((inv) => {
      const quote = quotes.get(inv.ticker!.toUpperCase());
      return {
        id: inv.id,
        ticker: inv.ticker,
        name: inv.name,
        type: inv.type,
        oldPrice: inv.currentPrice,
        newPrice: quote?.price || null,
        change: quote?.change,
        changePercent: quote?.changePercent,
        source: quote?.source || "error",
        error: quote?.error,
      };
    });

    return NextResponse.json({
      success: true,
      quotes: results,
    });
  } catch (error) {
    console.error("Erro ao buscar cotações:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar cotações",
      },
      { status: 500 }
    );
  }
}
