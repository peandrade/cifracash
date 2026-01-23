import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Tipos que usam quantidade x preço
const VARIABLE_INCOME_TYPES = ["stock", "fii", "etf", "crypto"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/investments/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const investment = await prisma.investment.findUnique({
      where: { id },
      include: {
        operations: { orderBy: { date: "desc" } },
      },
    });

    if (!investment) {
      return NextResponse.json(
        { error: "Investimento não encontrado" },
        { status: 404 }
      );
    }

    if (investment.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json(investment);
  } catch (error) {
    console.error("Erro ao buscar investimento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar investimento" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/investments/[id]
 *
 * Renda Variável: atualiza currentPrice -> recalcula currentValue
 * Renda Fixa: atualiza currentValue diretamente (saldo atual)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.investment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Investimento não encontrado" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const isVariable = VARIABLE_INCOME_TYPES.includes(existing.type);
    const updateData: Record<string, unknown> = {};

    // Campos básicos
    if (body.name !== undefined) updateData.name = body.name;
    if (body.ticker !== undefined) updateData.ticker = body.ticker;
    if (body.institution !== undefined) updateData.institution = body.institution;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.goalValue !== undefined) updateData.goalValue = body.goalValue;

    // Campos de renda fixa
    if (body.interestRate !== undefined) updateData.interestRate = body.interestRate;
    if (body.indexer !== undefined) updateData.indexer = body.indexer;
    if (body.maturityDate !== undefined) {
      updateData.maturityDate = body.maturityDate ? new Date(body.maturityDate) : null;
    }

    if (isVariable) {
      // RENDA VARIÁVEL: Atualiza preço atual
      if (body.currentPrice !== undefined) {
        const currentPrice = Number(body.currentPrice);
        const currentValue = existing.quantity * currentPrice;
        const profitLoss = currentValue - existing.totalInvested;
        const profitLossPercent = existing.totalInvested > 0
          ? (profitLoss / existing.totalInvested) * 100
          : 0;

        updateData.currentPrice = currentPrice;
        updateData.currentValue = currentValue;
        updateData.profitLoss = profitLoss;
        updateData.profitLossPercent = profitLossPercent;
      }
    } else {
      // RENDA FIXA: Pode atualizar saldo atual e/ou total investido
      const newTotalInvested = body.totalInvested !== undefined
        ? Number(body.totalInvested)
        : existing.totalInvested;
      const newCurrentValue = body.currentValue !== undefined
        ? Number(body.currentValue)
        : existing.currentValue;

      // Atualiza totalInvested se fornecido
      if (body.totalInvested !== undefined) {
        updateData.totalInvested = newTotalInvested;
      }

      // Atualiza currentValue se fornecido
      if (body.currentValue !== undefined) {
        updateData.currentValue = newCurrentValue;
      }

      // Recalcula profit/loss sempre que um dos dois muda
      if (body.totalInvested !== undefined || body.currentValue !== undefined) {
        const profitLoss = newCurrentValue - newTotalInvested;
        const profitLossPercent = newTotalInvested > 0
          ? (profitLoss / newTotalInvested) * 100
          : 0;

        updateData.profitLoss = profitLoss;
        updateData.profitLossPercent = profitLossPercent;
      }
    }

    const investment = await prisma.investment.update({
      where: { id },
      data: updateData,
      include: {
        operations: { orderBy: { date: "desc" } },
      },
    });

    return NextResponse.json(investment);
  } catch (error) {
    console.error("Erro ao atualizar investimento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar investimento" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/investments/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.investment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Investimento não encontrado" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await prisma.investment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar investimento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar investimento" },
      { status: 500 }
    );
  }
}
