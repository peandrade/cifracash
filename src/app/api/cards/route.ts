import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { CreateCardInput } from "@/types/credit-card";

/**
 * GET /api/cards
 * Lista todos os cartões com faturas
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cards = await prisma.creditCard.findMany({
      where: { isActive: true, userId: session.user.id },
      include: {
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
          include: {
            purchases: {
              orderBy: { date: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Erro ao buscar cartões:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cartões" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards
 * Cria um novo cartão
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: CreateCardInput = await request.json();

    if (!body.name || !body.closingDay || !body.dueDay) {
      return NextResponse.json(
        { error: "Nome, dia de fechamento e vencimento são obrigatórios" },
        { status: 400 }
      );
    }

    const card = await prisma.creditCard.create({
      data: {
        name: body.name,
        lastDigits: body.lastDigits || null,
        limit: body.limit || 0,
        closingDay: body.closingDay,
        dueDay: body.dueDay,
        color: body.color || "#8B5CF6",
        userId: session.user.id,
      },
      include: {
        invoices: true,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cartão:", error);
    return NextResponse.json(
      { error: "Erro ao criar cartão" },
      { status: 500 }
    );
  }
}
