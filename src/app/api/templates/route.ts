import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/templates
 *
 * Retorna todos os templates de transação do usuário ordenados por uso
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const templates = await prisma.transactionTemplate.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { usageCount: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Erro ao buscar templates:", error);
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 *
 * Cria um novo template de transação
 *
 * Body esperado:
 * {
 *   name: string,
 *   description?: string,
 *   category: string,
 *   type: "income" | "expense",
 *   value?: number
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
    if (!body.name || !body.category || !body.type) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, category, type" },
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

    // Valida o valor se fornecido
    if (body.value !== undefined && body.value !== null) {
      if (typeof body.value !== "number" || body.value < 0) {
        return NextResponse.json(
          { error: "Valor deve ser um número não negativo" },
          { status: 400 }
        );
      }
    }

    // Cria o template
    const template = await prisma.transactionTemplate.create({
      data: {
        name: body.name,
        description: body.description || null,
        category: body.category,
        type: body.type,
        value: body.value || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar template:", error);
    return NextResponse.json(
      { error: "Erro ao criar template" },
      { status: 500 }
    );
  }
}
