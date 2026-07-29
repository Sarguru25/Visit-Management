import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const body = await req.json();

    const template = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) return errorResponse("Template not found", 404);

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: {
        subject: body.subject !== undefined ? body.subject : template.subject,
        body: body.body !== undefined ? body.body : template.body,
        status: body.status !== undefined ? body.status : template.status,
        companyId: body.companyId !== undefined ? body.companyId : template.companyId,
      },
    });

    await logActivity({
      userId: session.userId,
      action: "EMAIL_TEMPLATE_UPDATED",
      description: `Updated email template: ${template.name}.`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(updated, "Email template updated successfully");
  } catch (error) {
    console.error("PUT /api/email-templates/[id] error:", error);
    return errorResponse("Failed to update email template", 500);
  }
}
