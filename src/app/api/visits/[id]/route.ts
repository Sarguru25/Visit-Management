import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        lead: true,
        employee: {
          include: { user: { select: { name: true, email: true, phone: true } } },
        },
      },
    });

    if (!visit) return errorResponse("Visit not found", 404);

    if (session.role === "EMPLOYEE" && visit.employeeId !== session.employeeId) {
      return errorResponse("Forbidden: You can only view your own visits", 403);
    }

    return successResponse(visit, "Visit details retrieved");
  } catch (error) {
    console.error("GET /api/visits/[id] error:", error);
    return errorResponse("Failed to fetch visit", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();

    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) return errorResponse("Visit not found", 404);

    if (session.role === "EMPLOYEE" && visit.employeeId !== session.employeeId) {
      return errorResponse("Forbidden: You can only edit your own visits", 403);
    }

    const updatedVisit = await prisma.visit.update({
      where: { id },
      data: {
        visitDate: body.visitDate !== undefined ? body.visitDate : visit.visitDate,
        visitTime: body.visitTime !== undefined ? body.visitTime : visit.visitTime,
        visitType: body.visitType !== undefined ? body.visitType : visit.visitType,
        location: body.location !== undefined ? body.location : visit.location,
        latitude: body.latitude !== undefined ? body.latitude : visit.latitude,
        longitude: body.longitude !== undefined ? body.longitude : visit.longitude,
        status: body.status !== undefined ? body.status : visit.status,
        visitReport: body.visitReport !== undefined ? body.visitReport : visit.visitReport,
        nextFollowupDate: body.nextFollowupDate !== undefined ? body.nextFollowupDate : visit.nextFollowupDate,
        attachment: body.attachment !== undefined ? body.attachment : visit.attachment,
      },
      include: { lead: true },
    });

    await logActivity({
      userId: session.userId,
      action: "VISIT_UPDATED",
      description: `Updated visit report for lead ${updatedVisit.lead.fullName}.`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(updatedVisit, "Visit updated successfully");
  } catch (error) {
    console.error("PUT /api/visits/[id] error:", error);
    return errorResponse("Failed to update visit", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!visit) return errorResponse("Visit not found", 404);

    if (session.role === "EMPLOYEE" && visit.employeeId !== session.employeeId) {
      return errorResponse("Forbidden: You can only delete your own visits", 403);
    }

    await prisma.visit.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      action: "VISIT_DELETED",
      description: `Deleted visit record for lead ${visit.lead.fullName}.`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(null, "Visit deleted successfully");
  } catch (error) {
    console.error("DELETE /api/visits/[id] error:", error);
    return errorResponse("Failed to delete visit", 500);
  }
}
