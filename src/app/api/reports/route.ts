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
    const employeeId = searchParams.get("employeeId") || "";
    const customerId = searchParams.get("customerId") || searchParams.get("leadId") || "";
    const companyId = searchParams.get("companyId") || "";
    const visitType = searchParams.get("visitType") || "";
    const visitStatus = searchParams.get("visitStatus") || "";
    // Note: We no longer have leadStatus, but if we had customer assignment status we'd check it here.
    const assignmentStatus = searchParams.get("assignmentStatus") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const segment = searchParams.get("segment") || "";
    const type = searchParams.get("type") || "";

    const whereClause: Record<string, unknown> = {};

    if (employeeId) whereClause.employeeId = employeeId;
    if (customerId) whereClause.customerId = customerId;
    if (companyId) whereClause.companyId = companyId;
    if (visitType) whereClause.visitType = visitType;
    if (visitStatus) whereClause.status = visitStatus;

    if (segment || type) {
      whereClause.customer = {
        ...(segment ? { companyName: segment } : {}),
        ...(type ? { industry: type } : {}),
      };
    }

    if (dateFrom || dateTo) {
      whereClause.visitDate = {};
      if (dateFrom) (whereClause.visitDate as Record<string, string>).gte = dateFrom;
      if (dateTo) (whereClause.visitDate as Record<string, string>).lte = dateTo;
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            name: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        company: { select: { name: true } },
        employee: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { visitDate: "desc" },
    });

    // Compute summary metrics
    const totalVisits = visits.length;
    const completedVisits = visits.filter((v) => v.status === "COMPLETED").length;
    const pendingVisits = visits.filter((v) => v.status === "PENDING").length;
    const cancelledVisits = visits.filter((v) => v.status === "CANCELLED").length;

    return successResponse(
      {
        summary: {
          totalVisits,
          completedVisits,
          pendingVisits,
          cancelledVisits,
        },
        visits,
      },
      "Reports generated successfully"
    );
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return errorResponse("Failed to generate report", 500);
  }
}
