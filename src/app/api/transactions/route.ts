import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/transactions
 *
 * Retorna todas as transações ordenadas por data (mais recente primeiro)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar transações" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 *
 * Cria uma nova transação
 *
 * Body esperado:
 * {
 *   type: "income" | "expense",
 *   value: number,
 *   category: string,
 *   description?: string,
 *   date: string (ISO)
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validação básica
    if (!body.type || !body.value || !body.category || !body.date) {
      return NextResponse.json(
        { error: "Campos obrigatórios: type, value, category, date" },
        { status: 400 }
      );
    }

    // Valida o tipo
    if (!["income", "expense"].includes(body.type)) {
      return NextResponse.json(
        { error: "Tipo deve ser 'income' ou 'expense'" },
        { status: 400 }
      );
    }

    // Valida o valor
    if (typeof body.value !== "number" || body.value <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser um número positivo" },
        { status: 400 }
      );
    }

    // Corrige o fuso horário: parseia a data manualmente para evitar mudança de dia
    // Formato esperado: "YYYY-MM-DD" ou ISO string
    const dateParts = body.date.split("T")[0].split("-");
    const dateValue = new Date(
      parseInt(dateParts[0]),      // ano
      parseInt(dateParts[1]) - 1,  // mês (0-indexed)
      parseInt(dateParts[2]),      // dia
      12, 0, 0, 0                  // meio-dia para evitar problemas de timezone
    );

    // Cria a transação
    const transaction = await prisma.transaction.create({
      data: {
        type: body.type,
        value: body.value,
        category: body.category,
        description: body.description || null,
        date: dateValue,
        userId: session.user.id,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return NextResponse.json(
      { error: "Erro ao criar transação" },
      { status: 500 }
    );
  }
}
