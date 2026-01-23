import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { CreatePurchaseInput } from "@/types/credit-card";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Calcula em qual fatura a compra deve cair
 * Retorna o mês/ano do VENCIMENTO (como funciona no banco real)
 * Ex: Fechamento dia 29, Vencimento dia 5
 *     Compra em 15/01 -> Fatura de FEVEREIRO (vence 05/02)
 */
function calculateInvoiceMonth(
  purchaseDate: Date,
  closingDay: number,
  dueDay: number
): { month: number; year: number } {
  const day = purchaseDate.getDate();
  let closingMonth = purchaseDate.getMonth() + 1;
  let closingYear = purchaseDate.getFullYear();

  // Se a compra foi APÓS o fechamento, vai pro próximo ciclo de fechamento
  if (day > closingDay) {
    closingMonth += 1;
    if (closingMonth > 12) {
      closingMonth = 1;
      closingYear += 1;
    }
  }

  // Agora calcula o mês do VENCIMENTO
  // Se o dia do vencimento é <= dia do fechamento, o vencimento é no mês seguinte ao fechamento
  let dueMonth = closingMonth;
  let dueYear = closingYear;
  if (dueDay <= closingDay) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }

  return { month: dueMonth, year: dueYear };
}

/**
 * Obtém ou cria a fatura para um mês/ano
 * ATENÇÃO: month/year agora representa o mês do VENCIMENTO
 */
async function getOrCreateInvoice(
  creditCardId: string,
  month: number,
  year: number,
  closingDay: number,
  dueDay: number
) {
  let invoice = await prisma.invoice.findUnique({
    where: {
      creditCardId_month_year: { creditCardId, month, year },
    },
  });

  if (!invoice) {
    // month/year é o mês do VENCIMENTO
    // Calcula data de vencimento diretamente
    const dueDate = new Date(year, month - 1, dueDay);

    // Calcula data de fechamento (pode ser no mês anterior ao vencimento)
    let closingMonth = month;
    let closingYear = year;
    if (dueDay <= closingDay) {
      // Se due day é antes ou igual ao closing day, o fechamento foi no mês anterior
      closingMonth -= 1;
      if (closingMonth < 1) {
        closingMonth = 12;
        closingYear -= 1;
      }
    }
    const closingDate = new Date(closingYear, closingMonth - 1, closingDay);

    invoice = await prisma.invoice.create({
      data: {
        creditCardId,
        month,
        year,
        closingDate,
        dueDate,
        status: "open",
        total: 0,
      },
    });
  }

  return invoice;
}

/**
 * POST /api/cards/[id]/purchases
 * Adiciona uma compra ao cartão (com suporte a parcelamento)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: creditCardId } = await params;
    const body: Omit<CreatePurchaseInput, "creditCardId"> = await request.json();

    // Validação
    if (!body.description || !body.value || !body.date || !body.category) {
      return NextResponse.json(
        { error: "Descrição, valor, data e categoria são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca o cartão e verifica propriedade
    const card = await prisma.creditCard.findUnique({
      where: { id: creditCardId },
      include: {
        invoices: {
          where: {
            status: { in: ["open", "closed"] }, // Faturas não pagas
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

    // Calcula limite usado (soma das faturas não pagas)
    const usedLimit = card.invoices.reduce(
      (sum, inv) => sum + (inv.total - inv.paidAmount),
      0
    );
    const availableLimit = card.limit - usedLimit;

    // Valida se a compra excede o limite disponível
    if (body.value > availableLimit) {
      return NextResponse.json(
        {
          error: "Compra excede o limite disponível",
          availableLimit,
          requestedValue: body.value,
        },
        { status: 400 }
      );
    }

    // Corrige o fuso horário: parseia a data manualmente para evitar mudança de dia
    const dateStr = typeof body.date === "string" ? body.date : body.date.toISOString();
    const dateParts = dateStr.split("T")[0].split("-");
    const purchaseDate = new Date(
      parseInt(dateParts[0]),      // ano
      parseInt(dateParts[1]) - 1,  // mês (0-indexed)
      parseInt(dateParts[2]),      // dia
      12, 0, 0, 0                  // meio-dia para evitar problemas de timezone
    );
    const installments = body.installments || 1;
    const installmentValue = body.value / installments;
    const parentPurchaseId = installments > 1 ? `parent_${Date.now()}` : null;

    // Cria uma compra para cada parcela
    for (let i = 0; i < installments; i++) {
      // Calcula a data da parcela
      const installmentDate = new Date(purchaseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);

      // Calcula qual fatura essa parcela vai (retorna mês do VENCIMENTO)
      const { month, year } = calculateInvoiceMonth(
        installmentDate,
        card.closingDay,
        card.dueDay
      );

      // Obtém ou cria a fatura
      const invoice = await getOrCreateInvoice(
        creditCardId,
        month,
        year,
        card.closingDay,
        card.dueDay
      );

      // Cria a compra
      await prisma.purchase.create({
        data: {
          invoiceId: invoice.id,
          description: installments > 1
            ? `${body.description} (${i + 1}/${installments})`
            : body.description,
          value: installmentValue,
          totalValue: body.value,
          category: body.category,
          date: purchaseDate,
          installments,
          currentInstallment: i + 1,
          isRecurring: body.isRecurring || false,
          parentPurchaseId,
          notes: body.notes || null,
        },
      });

      // Atualiza o total da fatura
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          total: { increment: installmentValue },
        },
      });
    }

    // Retorna o cartão atualizado
    const updatedCard = await prisma.creditCard.findUnique({
      where: { id: creditCardId },
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

    return NextResponse.json(
      {
        card: updatedCard,
        message: installments > 1
          ? `Compra parcelada em ${installments}x adicionada`
          : "Compra adicionada",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao adicionar compra:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar compra" },
      { status: 500 }
    );
  }
}
