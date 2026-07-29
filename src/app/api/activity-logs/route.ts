import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";

    const whereClause: Record<string, unknown> = {};
    if (action) whereClause.action = action;

    if (search) {
      whereClause.OR = [
        { description: { contains: search } },
        { action: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return successResponse(logs, "Activity logs retrieved");
  } catch (error) {
    console.error("GET /api/activity-logs error:", error);
    return errorResponse("Failed to fetch activity logs", 500);
  }
}
