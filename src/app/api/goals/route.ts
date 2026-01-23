import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GoalCategory } from "@prisma/client";

export interface GoalWithProgress {
  id: string;
  name: string;
  description: string | null;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  targetDate: Date | null;
  icon: string | null;
  color: string;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Campos calculados
  progress: number;
  remaining: number;
  monthlyNeeded: number | null; // Quanto precisa guardar por mês para atingir
  contributionsCount: number;
}

/**
 * GET /api/goals
 * Lista todas as metas financeiras com progresso calculado
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const goals = await prisma.financialGoal.findMany({
      where: { userId: session.user.id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: [{ isCompleted: "asc" }, { targetDate: "asc" }],
    });

    // Calcula progresso e valores adicionais
    const goalsWithProgress: GoalWithProgress[] = goals.map((goal) => {
      const progress = goal.targetValue > 0
        ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
        : 0;
      const remaining = Math.max(goal.targetValue - goal.currentValue, 0);

      // Calcula quanto precisa guardar por mês
      let monthlyNeeded: number | null = null;
      if (goal.targetDate && remaining > 0) {
        const now = new Date();
        const target = new Date(goal.targetDate);
        const monthsDiff =
          (target.getFullYear() - now.getFullYear()) * 12 +
          (target.getMonth() - now.getMonth());

        if (monthsDiff > 0) {
          monthlyNeeded = remaining / monthsDiff;
        }
      }

      return {
        ...goal,
        progress,
        remaining,
        monthlyNeeded,
        contributionsCount: goal.contributions.length,
      };
    });

    // Calcula resumo
    const summary = {
      totalGoals: goals.length,
      completedGoals: goals.filter((g) => g.isCompleted).length,
      totalTargetValue: goals.reduce((sum, g) => sum + g.targetValue, 0),
      totalCurrentValue: goals.reduce((sum, g) => sum + g.currentValue, 0),
      overallProgress: goals.length > 0
        ? goals.reduce((sum, g) => sum + g.currentValue, 0) /
          goals.reduce((sum, g) => sum + g.targetValue, 0) * 100
        : 0,
    };

    return NextResponse.json({ goals: goalsWithProgress, summary });
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return NextResponse.json({ error: "Erro ao buscar metas" }, { status: 500 });
  }
}

/**
 * POST /api/goals
 * Cria uma nova meta financeira
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, targetValue, targetDate, icon, color, currentValue } = body;

    if (!name || !category || !targetValue) {
      return NextResponse.json(
        { error: "Nome, categoria e valor alvo são obrigatórios" },
        { status: 400 }
      );
    }

    const goal = await prisma.financialGoal.create({
      data: {
        name,
        description,
        category,
        targetValue,
        currentValue: currentValue || 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        icon,
        color: color || "#8B5CF6",
        userId: session.user.id,
      },
    });

    // Se já tem valor inicial, cria contribuição
    if (currentValue && currentValue > 0) {
      await prisma.goalContribution.create({
        data: {
          goalId: goal.id,
          value: currentValue,
          date: new Date(),
          notes: "Valor inicial",
        },
      });
    }

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 });
  }
}
