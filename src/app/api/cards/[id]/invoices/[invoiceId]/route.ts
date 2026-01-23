import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string; invoiceId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: cardId, invoiceId } = await params;
    const body = await request.json();

    const card = await prisma.creditCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });
    }

    if (card.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { creditCard: true },
    });

    if (!currentInvoice) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    let paymentAmount = 0;

    if (body.status) {
      updateData.status = body.status;

      if (body.status === "paid") {
        paymentAmount = currentInvoice.total - currentInvoice.paidAmount;
        updateData.paidAmount = currentInvoice.total;
      }
    }

    if (body.paidAmount !== undefined && body.paidAmount > currentInvoice.paidAmount) {
      paymentAmount = body.paidAmount - currentInvoice.paidAmount;
      updateData.paidAmount = body.paidAmount;
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        purchases: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (paymentAmount > 0) {
      const cardName = currentInvoice.creditCard?.name || "Cartão";
      const monthName = new Date(currentInvoice.year, currentInvoice.month - 1)
        .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

      await prisma.transaction.create({
        data: {
          type: "expense",
          value: paymentAmount,
          category: "Fatura Cartão",
          description: `Fatura ${cardName} - ${monthName}`,
          date: new Date(),
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Erro ao atualizar fatura:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar fatura" },
      { status: 500 }
    );
  }
}
