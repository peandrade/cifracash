import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/goals/[id]
 * Busca uma meta específica com histórico de contribuições
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const goal = await prisma.financialGoal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }

    if (goal.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const progress = goal.targetValue > 0
      ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
      : 0;

    return NextResponse.json({ ...goal, progress });
  } catch (error) {
    console.error("Erro ao buscar meta:", error);
    return NextResponse.json({ error: "Erro ao buscar meta" }, { status: 500 });
  }
}

/**
 * PUT /api/goals/[id]
 * Atualiza uma meta
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, category, targetValue, targetDate, icon, color } = body;

    // Verifica se a meta pertence ao usuário
    const existing = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(targetValue !== undefined && { targetValue }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 });
  }
}

/**
 * DELETE /api/goals/[id]
 * Remove uma meta
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verifica se a meta pertence ao usuário
    const existing = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await prisma.financialGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    return NextResponse.json({ error: "Erro ao deletar meta" }, { status: 500 });
  }
}
