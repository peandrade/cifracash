import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.recurringExpense.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Despesa recorrente não encontrada" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await prisma.recurringExpense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar despesa recorrente:", error);
    return NextResponse.json(
      { error: "Erro ao deletar despesa recorrente" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { description, value, category, dueDay, isActive, notes } = body;

    const existing = await prisma.recurringExpense.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Despesa recorrente não encontrada" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const expense = await prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(value !== undefined && { value }),
        ...(category !== undefined && { category }),
        ...(dueDay !== undefined && { dueDay }),
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Erro ao atualizar despesa recorrente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar despesa recorrente" },
      { status: 500 }
    );
  }
}
