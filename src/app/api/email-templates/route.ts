import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return successResponse(templates, "Email templates retrieved");
  } catch (error) {
    console.error("GET /api/email-templates error:", error);
    return errorResponse("Failed to fetch email templates", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const { name, subject, body: templateBody, status, companyId } = body;

    if (!name || !subject || !templateBody || !companyId) {
      return errorResponse("Name, subject, body, and company are required", 400);
    }

    const newTemplate = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: templateBody,
        status: status || "ACTIVE",
        companyId,
      },
    });

    await logActivity({
      userId: session.userId,
      action: "EMAIL_TEMPLATE_CREATED",
      description: `Created email template: ${name}.`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(newTemplate, "Email template created", 201);
  } catch (error) {
    console.error("POST /api/email-templates error:", error);
    return errorResponse("Failed to create email template", 500);
  }
}
