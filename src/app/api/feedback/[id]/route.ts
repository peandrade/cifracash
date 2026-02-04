import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { feedbackStatusSchema, validateBody } from "@/lib/schemas";
import {
  withAuth,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/api-utils";
import { isAdmin } from "@/lib/admin";
import { z } from "zod";

const updateFeedbackSchema = z.object({
  status: feedbackStatusSchema,
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/feedback/[id]
 *
 * Get a single feedback by ID (admin only).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    if (!isAdmin(session.user.id)) {
      return forbiddenResponse();
    }

    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!feedback) {
      return notFoundResponse("Feedback");
    }

    return NextResponse.json(feedback);
  });
}

/**
 * PATCH /api/feedback/[id]
 *
 * Update feedback status (admin only).
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    if (!isAdmin(session.user.id)) {
      return forbiddenResponse();
    }

    const { id } = await params;
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(updateFeedbackSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400, "VALIDATION_ERROR", validation.details);
    }

    const { status } = validation.data;

    // Check if feedback exists
    const existing = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse("Feedback");
    }

    // Update feedback
    const feedback = await prisma.feedback.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(feedback);
  }, request);
}

/**
 * DELETE /api/feedback/[id]
 *
 * Delete a feedback (admin only).
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (session) => {
    if (!isAdmin(session.user.id)) {
      return forbiddenResponse();
    }

    const { id } = await params;

    // Check if feedback exists
    const existing = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse("Feedback");
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  });
}
