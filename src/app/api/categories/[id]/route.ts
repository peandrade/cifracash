import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * PUT /api/categories/[id]
 *
 * Atualiza uma categoria personalizada
 *
 * Body esperado:
 * {
 *   name?: string,
 *   icon?: string,
 *   color?: string
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verifica se a categoria existe e pertence ao usuário
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    if (category.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Não autorizado a editar esta categoria" },
        { status: 403 }
      );
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: "Não é possível editar categorias padrão" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Atualiza a categoria
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: body.name ?? category.name,
        icon: body.icon ?? category.icon,
        color: body.color ?? category.color,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 *
 * Exclui uma categoria personalizada
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verifica se a categoria existe e pertence ao usuário
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    if (category.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Não autorizado a excluir esta categoria" },
        { status: 403 }
      );
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: "Não é possível excluir categorias padrão" },
        { status: 400 }
      );
    }

    // Verifica se há transações usando esta categoria
    const transactionsCount = await prisma.transaction.count({
      where: {
        category: category.name,
        userId: session.user.id,
      },
    });

    if (transactionsCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir esta categoria. Existem ${transactionsCount} transações usando ela.`,
          transactionsCount
        },
        { status: 400 }
      );
    }

    // Exclui a categoria
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    return NextResponse.json(
      { error: "Erro ao excluir categoria" },
      { status: 500 }
    );
  }
}
