import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fetchSingleQuote } from "@/lib/quotes-service";
import { isFixedIncome } from "@/types";
import type { CreateInvestmentInput, InvestmentType } from "@/types";

const QUOTABLE_TYPES = ["stock", "fii", "etf", "crypto"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const investments = await prisma.investment.findMany({
      where: { userId: session.user.id },
      include: {
        operations: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(investments);
  } catch (error) {
    console.error("Erro ao buscar investimentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar investimentos" },
      { status: 500 }
    );
  }
}

async function getAvailableBalance(userId: string): Promise<number> {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    select: { type: true, value: true },
  });

  let balance = 0;
  transactions.forEach((t) => {
    if (t.type === "income") {
      balance += t.value;
    } else {
      balance -= t.value;
    }
  });

  return balance;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: CreateInvestmentInput = await request.json();

    if (!body.type || !body.name) {
      return NextResponse.json(
        { error: "Tipo e nome são obrigatórios" },
        { status: 400 }
      );
    }

    const isFixed = isFixedIncome(body.type as InvestmentType);

    if (isFixed) {
      if (!body.initialDeposit || body.initialDeposit < 1) {
        return NextResponse.json(
          { error: "Depósito inicial deve ser de pelo menos R$ 1,00" },
          { status: 400 }
        );
      }
      if (!body.depositDate) {
        return NextResponse.json(
          { error: "Data do depósito inicial é obrigatória" },
          { status: 400 }
        );
      }

      if (!body.skipBalanceCheck) {
        const availableBalance = await getAvailableBalance(session.user.id);
        if (availableBalance < body.initialDeposit) {
          return NextResponse.json(
            {
              error: "Saldo insuficiente",
              code: "INSUFFICIENT_BALANCE",
              availableBalance,
              required: body.initialDeposit,
            },
            { status: 400 }
          );
        }
      }
    }

    let currentPrice = 0;
    if (body.ticker && QUOTABLE_TYPES.includes(body.type)) {
      try {
        console.log(`[Investments API] Buscando cotação para ${body.ticker}...`);
        const quote = await fetchSingleQuote(body.ticker, body.type);
        if (quote.source !== "error" && quote.price > 0) {
          currentPrice = quote.price;
          console.log(`[Investments API] Cotação encontrada: ${currentPrice}`);
        } else {
          console.log(`[Investments API] Cotação não encontrada: ${quote.error}`);
        }
      } catch (error) {
        console.error("[Investments API] Erro ao buscar cotação:", error);

      }
    }

    const initialDeposit = isFixed ? body.initialDeposit! : 0;
    const depositDate = isFixed ? new Date(body.depositDate!) : new Date();

    const investment = await prisma.investment.create({
      data: {
        type: body.type,
        name: body.name,
        ticker: body.ticker || null,
        institution: body.institution || null,
        notes: body.notes || null,
        quantity: isFixed ? 1 : 0,
        averagePrice: isFixed ? initialDeposit : 0,
        currentPrice: isFixed ? initialDeposit : currentPrice,
        totalInvested: isFixed ? initialDeposit : 0,
        currentValue: isFixed ? initialDeposit : 0,
        profitLoss: 0,
        profitLossPercent: 0,

        interestRate: body.interestRate || null,
        indexer: body.indexer || null,
        maturityDate: body.maturityDate ? new Date(body.maturityDate) : null,
        userId: session.user.id,
      },
    });

    if (isFixed) {
      await prisma.operation.create({
        data: {
          investmentId: investment.id,
          type: "buy",
          quantity: 1,
          price: initialDeposit,
          total: initialDeposit,
          date: depositDate,
          fees: 0,
          notes: "Depósito inicial",
        },
      });

      if (!body.skipBalanceCheck) {
        await prisma.transaction.create({
          data: {
            type: "expense",
            value: initialDeposit,
            category: "Investimento",
            description: `Aplicação: ${body.name}`,
            date: depositDate,
            userId: session.user.id,
          },
        });
      }
    }

    const investmentWithOperations = await prisma.investment.findUnique({
      where: { id: investment.id },
      include: {
        operations: {
          orderBy: { date: "desc" },
        },
      },
    });

    return NextResponse.json(investmentWithOperations, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar investimento:", error);
    return NextResponse.json(
      { error: "Erro ao criar investimento" },
      { status: 500 }
    );
  }
}
