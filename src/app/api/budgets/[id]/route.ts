import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/budgets/[id]
 * Remove um orçamento
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verifica se o orçamento pertence ao usuário
    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar orçamento" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/budgets/[id]
 * Atualiza um orçamento
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { limit } = body;

    if (limit === undefined) {
      return NextResponse.json(
        { error: "Limite é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se o orçamento pertence ao usuário
    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: { limit },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar orçamento" },
      { status: 500 }
    );
  }
}
