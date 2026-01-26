import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const defaultSettings = {
  currency: "BRL",
  financialMonthStartDay: 1,
  numberFormat: "br",
  dateFormat: "dd/MM/yyyy",
  weekStartDay: "sunday",
  timezone: "auto",
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        generalSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Merge with defaults to ensure all fields exist
    const settings = {
      ...defaultSettings,
      ...(user.generalSettings as object || {}),
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Get current settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { generalSettings: true },
    });

    // Merge current settings with new ones
    const currentSettings = (user?.generalSettings as object) || {};
    const newSettings = {
      ...defaultSettings,
      ...currentSettings,
      ...body,
    };

    // Update user with merged settings
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        generalSettings: newSettings,
      },
    });

    return NextResponse.json(newSettings);
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Erro ao atualizar configurações" }, { status: 500 });
  }
}
