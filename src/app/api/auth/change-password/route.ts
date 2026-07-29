import { NextRequest } from "next/server";
import { getSessionUser, comparePassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.format());
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) return errorResponse("User not found", 404);

    const match = await comparePassword(parsed.data.currentPassword, user.password);
    if (!match) {
      return errorResponse("Current password is incorrect", 400);
    }

    const hashed = await hashPassword(parsed.data.newPassword);

    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashed },
    });

    await logActivity({
      userId: session.userId,
      action: "PASSWORD_CHANGED",
      description: `User ${user.email} changed their password.`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(null, "Password updated successfully");
  } catch (error) {
    console.error("POST /api/auth/change-password Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
