import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            designation: true,
            department: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse("User not found", 444);
    }

    return successResponse(user, "Current user session");
  } catch (error) {
    console.error("GET /api/auth/me Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
