import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => (settingsMap[s.key] = s.value));

    return successResponse(settingsMap, "Settings retrieved");
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return errorResponse("Failed to fetch settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json(); // Record<string, string>

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    await logActivity({
      userId: session.userId,
      action: "SETTINGS_UPDATED",
      description: "Updated system settings and configurations.",
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(null, "Settings updated successfully");
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return errorResponse("Failed to update settings", 500);
  }
}
