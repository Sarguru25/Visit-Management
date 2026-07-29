import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return successResponse({ customers: [], employees: [], visits: [] });
    }

    const customerWhere: Record<string, unknown> = {
      OR: [
        { name: { contains: query } },
        { companyName: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
      ],
    };

    if (session.role === "EMPLOYEE") {
      let empId = session.employeeId;
      if (!empId) {
        const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
        if (emp) empId = emp.id;
      }
      customerWhere.assignments = {
        some: { employeeId: empId }
      };
    }

    const customers = await prisma.customer.findMany({
      where: customerWhere,
      take: 5,
      select: {
        id: true,
        name: true,
        companyName: true,
        phone: true,
      },
    });

    let employees: Array<unknown> = [];
    if (session.role === "ADMIN") {
      employees = await prisma.employee.findMany({
        where: {
          user: {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { phone: { contains: query } },
            ],
          },
        },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
        },
      });
    }

    const visitWhere: Record<string, unknown> = {
      OR: [
        { location: { contains: query } },
        { visitReport: { contains: query } },
        { customer: { name: { contains: query } } },
        { customer: { companyName: { contains: query } } },
      ],
    };

    if (session.role === "EMPLOYEE") {
      let empId = session.employeeId;
      if (!empId) {
        const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
        if (emp) empId = emp.id;
      }
      visitWhere.employeeId = empId;
    }

    const visits = await prisma.visit.findMany({
      where: visitWhere,
      take: 5,
      include: {
        customer: { select: { name: true, companyName: true } },
      },
    });

    return successResponse({
      customers,
      employees,
      visits,
    });
  } catch (error) {
    console.error("GET /api/search Error:", error);
    return errorResponse("Search failed", 500);
  }
}
