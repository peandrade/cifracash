import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/balance
 * Retorna o saldo disponível (dinheiro em conta)
 * Saldo = Receitas - Despesas
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca todas as transações
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      select: {
        type: true,
        value: true,
      },
    });

    // Calcula o saldo
    let balance = 0;
    transactions.forEach((t) => {
      if (t.type === "income") {
        balance += t.value;
      } else {
        balance -= t.value;
      }
    });

    return NextResponse.json({
      balance,
      formatted: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(balance),
    });
  } catch (error) {
    console.error("Erro ao calcular saldo:", error);
    return NextResponse.json(
      { error: "Erro ao calcular saldo" },
      { status: 500 }
    );
  }
}
