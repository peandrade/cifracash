import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withAuth,
  forbiddenResponse,
  getPaginationParams,
  paginatedResponse,
} from "@/lib/api-utils";
import { isAdmin } from "@/lib/admin";

/**
 * GET /api/feedback/admin
 *
 * List all feedbacks (admin only).
 * Supports filtering by status and type.
 */
export async function GET(request: NextRequest) {
  return withAuth(async (session) => {
    // Check if user is admin
    if (!isAdmin(session.user.id)) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const all = searchParams.get("all") === "true";

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    // If all=true, return all feedbacks
    if (all) {
      const feedbacks = await prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(feedbacks);
    }

    // Paginated response
    const { page, pageSize, skip } = getPaginationParams(request.url);

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.feedback.count({ where }),
    ]);

    return paginatedResponse(feedbacks, page, pageSize, total);
  });
}
