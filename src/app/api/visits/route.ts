import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { sendVisitThankYouEmail, sendLeadGreetingEmail } from "@/lib/email";
import { z } from "zod";

const createVisitSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  companyId: z.string().min(1, "Company is required"),
  visitDate: z.string().min(1, "Visit date is required"),
  visitTime: z.string().optional().nullable(),
  visitType: z.enum(["COLD_VISIT", "FOLLOW_UP", "DEMO", "PRESENTATION", "INSTALLATION", "SUPPORT", "COLLECTION", "OTHER"]).default("COLD_VISIT"),
  location: z.string().min(1, "Location is required"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  status: z.enum(["COMPLETED", "PENDING", "CANCELLED"]).default("COMPLETED"),
  visitReport: z.string().optional().nullable(),
  nextFollowupDate: z.string().optional().nullable(),
  attachment: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const visitType = searchParams.get("visitType") || "";
    const customerId = searchParams.get("customerId") || searchParams.get("leadId") || "";
    const companyId = searchParams.get("companyId") || "";
    const employeeIdParam = searchParams.get("employeeId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const whereClause: Record<string, unknown> = {};

    // Role scope
    if (session.role === "EMPLOYEE") {
      let empId = session.employeeId;
      if (!empId) {
        const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
        if (emp) empId = emp.id;
      }
      if (!empId) return errorResponse("Employee profile missing", 403);
      whereClause.employeeId = empId;
    } else if (employeeIdParam) {
      whereClause.employeeId = employeeIdParam;
    }

    if (customerId) whereClause.customerId = customerId;
    if (companyId) whereClause.companyId = companyId;
    if (status) whereClause.status = status;
    if (visitType) whereClause.visitType = visitType;

    if (dateFrom || dateTo) {
      whereClause.visitDate = {};
      if (dateFrom) (whereClause.visitDate as Record<string, string>).gte = dateFrom;
      if (dateTo) (whereClause.visitDate as Record<string, string>).lte = dateTo;
    }

    if (search) {
      whereClause.OR = [
        { location: { contains: search } },
        { visitReport: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { companyName: { contains: search } } },
      ];
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        company: { select: { id: true, name: true } },
        employee: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { visitDate: "desc" },
    });

    return successResponse(visits, "Visits retrieved successfully");
  } catch (error) {
    console.error("GET /api/visits error:", error);
    return errorResponse("Failed to fetch visits", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = createVisitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.format());
    }

    const data = parsed.data;

    // Fetch customer details
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      include: { assignments: true }
    });

    if (!customer) return errorResponse("Customer not found", 404);

    let targetEmployeeId = data.employeeId;

    if (session.role === "EMPLOYEE") {
      let empId = session.employeeId;
      if (!empId) {
        const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
        if (emp) empId = emp.id;
      }
      
      const isAssigned = customer.assignments.some(a => a.employeeId === empId && a.companyId === data.companyId);
      if (!isAssigned) {
        return errorResponse("Forbidden: You are not assigned to this customer for this company", 403);
      }
      
      targetEmployeeId = empId;
    }

    // If still no targetEmployeeId (e.g. Admin is creating it), derive from the assignment
    if (!targetEmployeeId) {
      const assignment = customer.assignments.find(a => a.companyId === data.companyId);
      if (assignment) {
        targetEmployeeId = assignment.employeeId;
      }
    }

    if (!targetEmployeeId) {
      return errorResponse("Could not determine which employee this visit belongs to. Ensure the customer is assigned to this company.", 400);
    }

    const empExists = await prisma.employee.findUnique({ where: { id: targetEmployeeId } });
    if (!empExists) {
      return errorResponse("Assigned employee profile does not exist.", 400);
    }

    const newVisit = await prisma.visit.create({
      data: {
        customerId: data.customerId,
        companyId: data.companyId,
        employeeId: targetEmployeeId,
        visitDate: new Date(data.visitDate),
        visitTime: data.visitTime || null,
        visitType: data.visitType,
        location: data.location,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        status: data.status,
        visitReport: data.visitReport || null,
        nextFollowupDate: data.nextFollowupDate ? new Date(data.nextFollowupDate) : null,
        attachment: data.attachment || null,
      },
      include: {
        customer: true,
        company: { select: { name: true } },
        employee: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (customer.email && newVisit.status === "COMPLETED") {
      // NOTE: sendVisitThankYouEmail is just a stub imported above
      sendVisitThankYouEmail({
        customerEmail: customer.email,
        customerName: customer.name,
        visitDate: newVisit.visitDate.toISOString().split("T")[0],
        visitType: newVisit.visitType.replace("_", " "),
        nextFollowupDate: newVisit.nextFollowupDate ? newVisit.nextFollowupDate.toISOString().split("T")[0] : "N/A",
      }).catch((err: any) => console.error("Email send trigger error:", err));
    }
    
    // Send greeting email after visit is created (if email exists)
    if (customer.email) {
      sendLeadGreetingEmail({
        customerEmail: customer.email,
        customerName: customer.name,
      }).catch((err: any) => console.error("Greeting email send trigger error:", err));
    }

    await logActivity({
      userId: session.userId,
      companyId: data.companyId,
      module: "VISIT",
      action: "VISIT_ADDED",
      description: `Added ${newVisit.visitType} visit for customer ${customer.name}.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(newVisit, "Visit recorded successfully", 201);
  } catch (error) {
    console.error("POST /api/visits error:", error);
    return errorResponse("Failed to record visit", 500);
  }
}
