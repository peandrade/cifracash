import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * Solicita recuperação de senha
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Busca o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Por segurança, sempre retorna sucesso mesmo se email não existir
    // Isso evita enumerar emails válidos
    if (!user) {
      return NextResponse.json({
        message: "Se o email existir, você receberá instruções para redefinir sua senha.",
      });
    }

    // Invalida tokens anteriores não utilizados
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Marca como usado para invalidar
      },
    });

    // Gera novo token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salva o token
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Monta URL de reset
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Envia email
    const emailHtml = generatePasswordResetEmail(resetUrl, user.name || undefined);
    await sendEmail({
      to: user.email,
      subject: "Recuperação de Senha - FinControl",
      html: emailHtml,
    });

    return NextResponse.json({
      message: "Se o email existir, você receberá instruções para redefinir sua senha.",
    });
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
