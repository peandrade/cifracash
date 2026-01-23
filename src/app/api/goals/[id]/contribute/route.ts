import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/goals/[id]/contribute
 * Adiciona uma contribuição à meta
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { value, date, notes } = body;

    if (!value || value <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser maior que zero" },
        { status: 400 }
      );
    }

    // Busca a meta
    const goal = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }

    if (goal.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Cria a contribuição
    const contribution = await prisma.goalContribution.create({
      data: {
        goalId: id,
        value,
        date: date ? new Date(date) : new Date(),
        notes,
      },
    });

    // Atualiza o valor atual da meta
    const newCurrentValue = goal.currentValue + value;
    const isCompleted = newCurrentValue >= goal.targetValue;

    await prisma.financialGoal.update({
      where: { id },
      data: {
        currentValue: newCurrentValue,
        isCompleted,
        completedAt: isCompleted && !goal.isCompleted ? new Date() : goal.completedAt,
      },
    });

    return NextResponse.json({
      contribution,
      newCurrentValue,
      isCompleted,
    });
  } catch (error) {
    console.error("Erro ao adicionar contribuição:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar contribuição" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/goals/[id]/contribute
 * Remove uma contribuição (body: { contributionId })
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { contributionId } = body;

    if (!contributionId) {
      return NextResponse.json(
        { error: "ID da contribuição é obrigatório" },
        { status: 400 }
      );
    }

    // Busca a meta para verificar propriedade
    const goal = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }

    if (goal.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Busca a contribuição
    const contribution = await prisma.goalContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution || contribution.goalId !== id) {
      return NextResponse.json(
        { error: "Contribuição não encontrada" },
        { status: 404 }
      );
    }

    // Remove a contribuição
    await prisma.goalContribution.delete({
      where: { id: contributionId },
    });

    // Atualiza o valor da meta
    const newCurrentValue = Math.max(goal.currentValue - contribution.value, 0);
    await prisma.financialGoal.update({
      where: { id },
      data: {
        currentValue: newCurrentValue,
        isCompleted: newCurrentValue >= goal.targetValue,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover contribuição:", error);
    return NextResponse.json(
      { error: "Erro ao remover contribuição" },
      { status: 500 }
    );
  }
}
