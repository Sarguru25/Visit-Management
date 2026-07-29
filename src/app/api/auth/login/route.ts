import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid input credentials", 400, parsed.error.format());
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { employee: true },
    });

    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    if (user.status !== "ACTIVE") {
      return errorResponse("Account is inactive. Please contact your administrator.", 403);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return errorResponse("Invalid email or password", 401);
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "EMPLOYEE",
      employeeId: user.employee?.id,
    });

    await setAuthCookie(token);

    await logActivity({
      userId: user.id,
      action: "USER_LOGIN",
      description: `User ${user.email} (${user.role}) logged in successfully.`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.id,
      },
    }, "Login successful");
  } catch (error) {
    console.error("Login API Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
