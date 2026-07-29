import { NextRequest } from "next/server";
import { getSessionUser, removeAuthCookie } from "@/lib/auth";
import { successResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) {
      await logActivity({
        userId: user.userId,
        action: "USER_LOGOUT",
        description: `User ${user.email} logged out.`,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
    }

    await removeAuthCookie();
    return successResponse(null, "Logged out successfully");
  } catch (error) {
    console.error("Logout API Error:", error);
    return successResponse(null, "Logged out");
  }
}
