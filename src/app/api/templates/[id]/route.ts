import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.transactionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Erro ao buscar template:", error);
    return NextResponse.json(
      { error: "Erro ao buscar template" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingTemplate = await prisma.transactionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    if (body.type && !["income", "expense"].includes(body.type)) {
      return NextResponse.json(
        { error: "Tipo deve ser 'income' ou 'expense'" },
        { status: 400 }
      );
    }

    if (body.value !== undefined && body.value !== null) {
      if (typeof body.value !== "number" || body.value < 0) {
        return NextResponse.json(
          { error: "Valor deve ser um número não negativo" },
          { status: 400 }
        );
      }
    }

    const template = await prisma.transactionTemplate.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.category && { category: body.category }),
        ...(body.type && { type: body.type }),
        ...(body.value !== undefined && { value: body.value }),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Erro ao atualizar template:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existingTemplate = await prisma.transactionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    await prisma.transactionTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir template:", error);
    return NextResponse.json(
      { error: "Erro ao excluir template" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existingTemplate = await prisma.transactionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    const template = await prisma.transactionTemplate.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Erro ao usar template:", error);
    return NextResponse.json(
      { error: "Erro ao usar template" },
      { status: 500 }
    );
  }
}
