import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/purchases/[id]
 * Remove uma compra e atualiza o total da fatura
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Busca a compra
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            creditCard: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Compra não encontrada" },
        { status: 404 }
      );
    }

    // Verifica se o cartão pertence ao usuário
    if (purchase.invoice.creditCard.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Se for parcelada, remove todas as parcelas
    if (purchase.parentPurchaseId) {
      const allInstallments = await prisma.purchase.findMany({
        where: { parentPurchaseId: purchase.parentPurchaseId },
      });

      for (const installment of allInstallments) {
        // Atualiza o total da fatura
        await prisma.invoice.update({
          where: { id: installment.invoiceId },
          data: {
            total: { decrement: installment.value },
          },
        });

        // Remove a parcela
        await prisma.purchase.delete({
          where: { id: installment.id },
        });
      }
    } else {
      // Remove compra única
      await prisma.invoice.update({
        where: { id: purchase.invoiceId },
        data: {
          total: { decrement: purchase.value },
        },
      });

      await prisma.purchase.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar compra:", error);
    return NextResponse.json(
      { error: "Erro ao deletar compra" },
      { status: 500 }
    );
  }
}
