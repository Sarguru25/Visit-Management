import { NextRequest } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  truflowTarget: z.union([z.number(), z.string()]).optional().nullable(),
  zeetorkTarget: z.union([z.number(), z.string()]).optional().nullable(),
  target: z.union([z.number(), z.string()]).optional().nullable(),
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
        companies: {
          include: { company: true },
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

    // Targets are only visible to ADMIN
    const sanitizedEmployees = employees.map((emp) => {
      if (session.role !== "ADMIN") {
        const { target, truflowTarget, zeetorkTarget, companies, ...rest } = emp;
        return rest;
      }
      return emp;
    });

    return successResponse(sanitizedEmployees, "Employees retrieved successfully");
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

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      designation,
      status,
      truflowTarget,
      zeetorkTarget,
      target,
    } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse("User with this email already exists", 400);
    }

    const hashedPassword = await hashPassword(password);
    const fullName = lastName && lastName.trim() ? `${firstName.trim()} ${lastName.trim()}` : firstName.trim();

    const truflowVal = truflowTarget ? Math.max(0, Number(truflowTarget) || 0) : 0;
    const zeetorkVal = zeetorkTarget ? Math.max(0, Number(zeetorkTarget) || 0) : 0;
    const totalTargetVal = target !== undefined && target !== null && target !== ""
      ? Math.max(0, Number(target) || 0)
      : (truflowVal + zeetorkVal);

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
            target: totalTargetVal,
            truflowTarget: truflowVal,
            zeetorkTarget: zeetorkVal,
          },
        },
      },
      include: { employee: true },
    });

    // Store target data in EmployeeCompany for both companies (Truflow and Zeetork)
    try {
      const allCompanies = await prisma.company.findMany();
      const truflowComp = allCompanies.find((c) => c.name.toLowerCase().includes("truflow") || c.code === "TRU");
      const zeetorkComp = allCompanies.find((c) => c.name.toLowerCase().includes("zeetork") || c.code === "ZTK");

      if (truflowComp && newEmployee.employee) {
        await prisma.employeeCompany.upsert({
          where: {
            employeeId_companyId: {
              employeeId: newEmployee.employee.id,
              companyId: truflowComp.id,
            },
          },
          create: {
            employeeId: newEmployee.employee.id,
            companyId: truflowComp.id,
            target: truflowVal,
          },
          update: {
            target: truflowVal,
          },
        });
      }

      if (zeetorkComp && newEmployee.employee) {
        await prisma.employeeCompany.upsert({
          where: {
            employeeId_companyId: {
              employeeId: newEmployee.employee.id,
              companyId: zeetorkComp.id,
            },
          },
          create: {
            employeeId: newEmployee.employee.id,
            companyId: zeetorkComp.id,
            target: zeetorkVal,
          },
          update: {
            target: zeetorkVal,
          },
        });
      }
    } catch (compErr) {
      console.error("Error creating EmployeeCompany target records:", compErr);
    }

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
