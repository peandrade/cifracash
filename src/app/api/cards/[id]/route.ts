import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const card = await prisma.creditCard.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          include: {
            purchases: {
              orderBy: { date: "desc" },
            },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    if (card.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Erro ao buscar cartão:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cartão" },
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

    const existing = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const card = await prisma.creditCard.update({
      where: { id },
      data: body,
      include: {
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 12,
        },
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Erro ao atualizar cartão:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cartão" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await prisma.creditCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar cartão:", error);
    return NextResponse.json(
      { error: "Erro ao deletar cartão" },
      { status: 500 }
    );
  }
}
