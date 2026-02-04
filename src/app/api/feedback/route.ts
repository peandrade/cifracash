import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFeedbackSchema, validateBody } from "@/lib/schemas";
import {
  withAuth,
  errorResponse,
  getPaginationParams,
  paginatedResponse,
} from "@/lib/api-utils";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/rate-limit";

/**
 * GET /api/feedback
 *
 * List feedbacks from the authenticated user (history).
 */
export async function GET(request: NextRequest) {
  return withAuth(async (session) => {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const userId = session.user.id;

    // If all=true, return all feedbacks
    if (all) {
      const feedbacks = await prisma.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(feedbacks);
    }

    // Paginated response
    const { page, pageSize, skip } = getPaginationParams(request.url);

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.feedback.count({ where: { userId } }),
    ]);

    return paginatedResponse(feedbacks, page, pageSize, total);
  });
}

/**
 * POST /api/feedback
 *
 * Create a new feedback.
 * Rate limited to 5 feedbacks per hour.
 */
export async function POST(request: Request) {
  // Rate limiting - 5 feedbacks per hour
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    limit: 5,
    windowSeconds: 3600,
    identifier: "feedback-create",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    const body = await req.json();

    // Validate with Zod schema
    const validation = validateBody(createFeedbackSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400, "VALIDATION_ERROR", validation.details);
    }

    const { type, description, attachments } = validation.data;

    const feedback = await prisma.feedback.create({
      data: {
        type,
        description,
        attachments,
        userId: session.user.id,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  }, request);
}
