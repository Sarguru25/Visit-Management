import { NextRequest } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";

    const whereClause: any = {
      user: {
        role: "EMPLOYEE",
        status: status ? status : undefined,
        OR: search
          ? [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
      department: department ? { contains: department } : undefined,
    };

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            visits: true,
          },
        },
      },
      orderBy: { user: { createdAt: "desc" } },
    });

    return successResponse(employees, "Employees retrieved successfully");
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return errorResponse("Failed to fetch employees", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.format());
    }

    const { firstName, lastName, email, password, phone, department, designation, status } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse("User with this email already exists", 400);
    }

    const hashedPassword = await hashPassword(password);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const newEmployee = await prisma.user.create({
      data: {
        name: fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        role: "EMPLOYEE",
        status,
        employee: {
          create: {
            department: department || "Sales",
            designation: designation || "Sales Executive",
            status,
          },
        },
      },
      include: { employee: true },
    });

    await logActivity({
      userId: session.userId,
      action: "EMPLOYEE_CREATED",
      description: `Created new employee ${fullName} (${email}).`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(newEmployee, "Employee created successfully", 201);
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return errorResponse("Failed to create employee", 500);
  }
}
