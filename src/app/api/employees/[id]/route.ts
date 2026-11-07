import { NextRequest } from "next/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
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
        assignments: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        visits: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { customer: true },
        },
        companies: {
          include: { company: true },
        },
        _count: {
          select: { assignments: true, visits: true },
        },
      },
    });

    if (!employee) return errorResponse("Employee not found", 404);

    return successResponse(employee, "Employee details retrieved");
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return errorResponse("Failed to fetch employee", 500);
  }
}

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

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) return errorResponse("Employee not found", 404);

    const { name, phone, department, designation, status, newPassword, truflowTarget, zeetorkTarget, target } = body;

    let hashedPassword = undefined;
    if (newPassword && newPassword.trim().length >= 6) {
      hashedPassword = await hashPassword(newPassword);
    }

    await prisma.user.update({
      where: { id: employee.userId },
      data: {
        name: name !== undefined ? name : employee.user.name,
        phone: phone !== undefined ? phone : employee.user.phone,
        status: status !== undefined ? status : employee.user.status,
        password: hashedPassword,
      },
    });

    const truflowVal = truflowTarget !== undefined ? Math.max(0, Number(truflowTarget) || 0) : employee.truflowTarget;
    const zeetorkVal = zeetorkTarget !== undefined ? Math.max(0, Number(zeetorkTarget) || 0) : employee.zeetorkTarget;
    const totalTargetVal = target !== undefined
      ? Math.max(0, Number(target) || 0)
      : (truflowTarget !== undefined || zeetorkTarget !== undefined)
        ? ((truflowVal || 0) + (zeetorkVal || 0))
        : employee.target;

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        department: department !== undefined ? department : employee.department,
        designation: designation !== undefined ? designation : employee.designation,
        status: status !== undefined ? status : employee.status,
        target: totalTargetVal,
        truflowTarget: truflowVal,
        zeetorkTarget: zeetorkVal,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, status: true },
        },
        companies: {
          include: { company: true },
        },
      },
    });

    // Sync EmployeeCompany targets
    try {
      const allCompanies = await prisma.company.findMany();
      const truflowComp = allCompanies.find((c) => c.name.toLowerCase().includes("truflow") || c.code === "TRU");
      const zeetorkComp = allCompanies.find((c) => c.name.toLowerCase().includes("zeetork") || c.code === "ZTK");

      if (truflowComp && truflowVal !== null && truflowVal !== undefined) {
        await prisma.employeeCompany.upsert({
          where: {
            employeeId_companyId: {
              employeeId: id,
              companyId: truflowComp.id,
            },
          },
          create: {
            employeeId: id,
            companyId: truflowComp.id,
            target: truflowVal,
          },
          update: {
            target: truflowVal,
          },
        });
      }

      if (zeetorkComp && zeetorkVal !== null && zeetorkVal !== undefined) {
        await prisma.employeeCompany.upsert({
          where: {
            employeeId_companyId: {
              employeeId: id,
              companyId: zeetorkComp.id,
            },
          },
          create: {
            employeeId: id,
            companyId: zeetorkComp.id,
            target: zeetorkVal,
          },
          update: {
            target: zeetorkVal,
          },
        });
      }
    } catch (compErr) {
      console.error("Error updating EmployeeCompany targets:", compErr);
    }

    await logActivity({
      userId: session.userId,
      action: "EMPLOYEE_UPDATED",
      description: `Updated employee ${updatedEmployee.user.name} (${updatedEmployee.user.email}).`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(updatedEmployee, "Employee updated successfully");
  } catch (error) {
    console.error("PUT /api/employees/[id] error:", error);
    return errorResponse("Failed to update employee", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) return errorResponse("Employee not found", 404);

    // Delete User (cascade deletes Employee)
    await prisma.user.delete({
      where: { id: employee.userId },
    });

    await logActivity({
      userId: session.userId,
      action: "EMPLOYEE_DELETED",
      description: `Deleted employee ${employee.user.name} (${employee.user.email}).`,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(null, "Employee deleted successfully");
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return errorResponse("Failed to delete employee", 500);
  }
}
