import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/transactions/[id]
 *
 * Deleta uma transação pelo ID
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verifica se a transação existe e pertence ao usuário
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    if (transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Deleta a transação
    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    return NextResponse.json(
      { error: "Erro ao deletar transação" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transactions/[id]
 *
 * Busca uma transação pelo ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    if (transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Erro ao buscar transação:", error);
    return NextResponse.json(
      { error: "Erro ao buscar transação" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/transactions/[id]
 *
 * Atualiza uma transação parcialmente
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verifica se a transação existe e pertence ao usuário
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Prepara os dados para atualização
    const updateData: Record<string, unknown> = {};

    if (body.type && ["income", "expense"].includes(body.type)) {
      updateData.type = body.type;
    }

    if (typeof body.value === "number" && body.value > 0) {
      updateData.value = body.value;
    }

    if (body.category) {
      updateData.category = body.category;
    }

    if (body.description !== undefined) {
      updateData.description = body.description || null;
    }

    if (body.date) {
      // Corrige o fuso horário: parseia a data manualmente para evitar mudança de dia
      const dateParts = body.date.split("T")[0].split("-");
      updateData.date = new Date(
        parseInt(dateParts[0]),      // ano
        parseInt(dateParts[1]) - 1,  // mês (0-indexed)
        parseInt(dateParts[2]),      // dia
        12, 0, 0, 0                  // meio-dia para evitar problemas de timezone
      );
    }

    // Atualiza a transação
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar transação" },
      { status: 500 }
    );
  }
}
