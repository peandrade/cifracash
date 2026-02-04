import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse } from "@/lib/api-utils";
import {
  checkRateLimit,
  getClientIp,
  rateLimitPresets,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { z } from "zod";

const createPinSchema = z.object({
  pin: z
    .string()
    .length(6, "PIN deve ter 6 dígitos")
    .regex(/^\d+$/, "PIN deve conter apenas números"),
  accountPassword: z.string().min(1, "Senha da conta é obrigatória"),
});

const verifyPinSchema = z.object({
  pin: z
    .string()
    .length(6, "PIN deve ter 6 dígitos")
    .regex(/^\d+$/, "PIN deve conter apenas números"),
});

const resetPinSchema = z.object({
  accountPassword: z.string().min(1, "Senha da conta é obrigatória"),
  newPin: z
    .string()
    .length(6, "PIN deve ter 6 dígitos")
    .regex(/^\d+$/, "PIN deve conter apenas números"),
});

/**
 * GET /api/user/discrete-pin
 *
 * Check if user has a discrete PIN configured.
 */
export async function GET() {
  return withAuth(async (session) => {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discretePin: true },
    });

    return NextResponse.json({
      hasPin: !!user?.discretePin,
    });
  });
}

/**
 * POST /api/user/discrete-pin
 *
 * Create a discrete PIN (requires account password for verification).
 */
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    ...rateLimitPresets.auth,
    identifier: "discrete-pin-create",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    const body = await req.json();
    const validation = createPinSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.issues[0]?.message || "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { pin, accountPassword } = validation.data;

    // Verify account password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, discretePin: true },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404, "NOT_FOUND");
    }

    const isPasswordValid = await bcrypt.compare(accountPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse("Senha da conta incorreta", 401, "UNAUTHORIZED");
    }

    // Hash and save the PIN
    const hashedPin = await bcrypt.hash(pin, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { discretePin: hashedPin },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  }, request);
}

/**
 * PUT /api/user/discrete-pin
 *
 * Verify a discrete PIN.
 */
export async function PUT(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    ...rateLimitPresets.auth,
    identifier: "discrete-pin-verify",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    const body = await req.json();
    const validation = verifyPinSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.issues[0]?.message || "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { pin } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discretePin: true },
    });

    if (!user?.discretePin) {
      return errorResponse("PIN não configurado", 400, "BAD_REQUEST");
    }

    const isPinValid = await bcrypt.compare(pin, user.discretePin);

    return NextResponse.json({ valid: isPinValid });
  }, request);
}

/**
 * PATCH /api/user/discrete-pin
 *
 * Reset/change PIN (requires account password).
 */
export async function PATCH(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    ...rateLimitPresets.auth,
    identifier: "discrete-pin-reset",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    const body = await req.json();
    const validation = resetPinSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.issues[0]?.message || "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { accountPassword, newPin } = validation.data;

    // Verify account password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404, "NOT_FOUND");
    }

    const isPasswordValid = await bcrypt.compare(accountPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse("Senha da conta incorreta", 401, "UNAUTHORIZED");
    }

    // Hash and save the new PIN
    const hashedPin = await bcrypt.hash(newPin, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { discretePin: hashedPin },
    });

    return NextResponse.json({ success: true });
  }, request);
}

/**
 * DELETE /api/user/discrete-pin
 *
 * Remove discrete PIN (requires account password).
 */
export async function DELETE(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    ...rateLimitPresets.auth,
    identifier: "discrete-pin-delete",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    const body = await req.json();
    const validation = z.object({
      accountPassword: z.string().min(1, "Senha da conta é obrigatória"),
    }).safeParse(body);

    if (!validation.success) {
      return errorResponse(
        validation.error.issues[0]?.message || "Dados inválidos",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { accountPassword } = validation.data;

    // Verify account password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404, "NOT_FOUND");
    }

    const isPasswordValid = await bcrypt.compare(accountPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse("Senha da conta incorreta", 401, "UNAUTHORIZED");
    }

    // Remove PIN
    await prisma.user.update({
      where: { id: session.user.id },
      data: { discretePin: null },
    });

    return NextResponse.json({ success: true });
  }, request);
}
