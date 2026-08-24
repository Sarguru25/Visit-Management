import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyName: z.string().optional().nullable(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  assignments: z.array(z.object({
    companyId: z.string().min(1, "Company is required"),
    employeeId: z.string().optional().nullable(),
  })).min(1, "At least one assignment is required"),
  locations: z.array(z.object({
    name: z.string().min(1),
    type: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    contacts: z.array(z.object({
      name: z.string().min(1),
      designation: z.string().optional().nullable(),
      department: z.string().optional().nullable(),
      mobile: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      isPrimary: z.boolean().optional(),
    })).optional()
  })).optional()
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const employeeIdParam = searchParams.get("employeeId") || "";
    const companyIdParam = searchParams.get("companyId") || "";
    const segmentParam = searchParams.get("segment") || "";
    const typeParam = searchParams.get("type") || "";

    const whereClause: any = {};
    
    // Removed forced employee filtering to allow all salespersons to see all customers
    let targetEmployeeId = employeeIdParam;

    if (targetEmployeeId) {
      whereClause.assignments = {
        some: { employeeId: targetEmployeeId }
      };
    }

    if (companyIdParam) {
      if (!whereClause.assignments) whereClause.assignments = { some: {} };
      whereClause.assignments.some.companyId = companyIdParam;
    }

    if (segmentParam) {
      whereClause.companyName = segmentParam;
    }

    if (typeParam) {
      whereClause.industry = typeParam;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            company: { select: { id: true, name: true, code: true } },
            employee: { include: { user: { select: { name: true, email: true } } } }
          }
        },
        _count: { select: { visits: true, contacts: { where: { status: 'ACTIVE' } } } },
        contacts: {
          where: { isPrimary: true, status: 'ACTIVE' },
          take: 1
        },
        visits: {
          take: 1,
          orderBy: { visitDate: "desc" },
          select: { visitDate: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(customers, "Customers retrieved successfully");
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return errorResponse("Failed to fetch customers", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.format());
    }

    const data = parsed.data;

    // For EMPLOYEES, ensure employeeId is set to themselves if not provided
    const userAssignments = data.assignments.map(a => {
      let targetEmployeeId = a.employeeId;
      if (session.role !== "ADMIN" || !targetEmployeeId) {
        targetEmployeeId = session.employeeId; // which is set in session
      }
      return {
        companyId: a.companyId,
        employeeId: targetEmployeeId
      };
    });

    // We must have employee IDs for all
    for (const a of userAssignments) {
      if (!a.employeeId) {
        // attempt to find employee profile if missing from session
        const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
        if (emp) {
          a.employeeId = emp.id;
        } else {
          return errorResponse("Associated employee profile required for assignment", 400);
        }
      }
    }

    // Check if phone already exists (unique global customer)
    let customer = await prisma.customer.findUnique({ where: { phone: data.phone } });

    if (customer) {
      return errorResponse("A customer with this phone number already exists. Please edit the existing customer instead.", 400);
    }

    customer = await prisma.customer.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        pincode: data.pincode || null,
        industry: data.industry || null,
        remarks: data.remarks || null,
        createdBy: session.userId,
      }
    });

    if (data.locations && data.locations.length > 0) {
      for (const loc of data.locations) {
        const newLoc = await prisma.location.create({
          data: {
            customerId: customer.id,
            name: loc.name,
            type: loc.type || null,
            pincode: loc.pincode || null,
            address: loc.address || null,
            city: loc.city || null,
            state: loc.state || null,
            country: loc.country || null,
            notes: loc.notes || null,
          }
        });
        if (loc.contacts && loc.contacts.length > 0) {
          await prisma.contact.createMany({
            data: loc.contacts.map((c, i) => ({
              customerId: customer.id,
              locationId: newLoc.id,
              name: c.name,
              designation: c.designation || null,
              department: c.department || null,
              mobile: c.mobile || null,
              email: c.email || null,
              notes: c.notes || null,
              isPrimary: c.isPrimary !== undefined ? c.isPrimary : (i === 0 && data.locations?.indexOf(loc) === 0)
            }))
          });
        }
      }
    }

    // Create Assignments
    for (const assignmentData of userAssignments) {
      // Deactivate existing
      await prisma.customerAssignment.updateMany({
        where: {
          customerId: customer.id,
          companyId: assignmentData.companyId
        },
        data: { status: "INACTIVE" }
      });

      await prisma.customerAssignment.create({
        data: {
          customerId: customer.id,
          companyId: assignmentData.companyId,
          employeeId: assignmentData.employeeId as string,
          status: "ACTIVE"
        }
      });

      await logActivity({
        userId: session.userId,
        companyId: assignmentData.companyId,
        action: "CUSTOMER_ASSIGNED",
        description: `Assigned customer ${customer.name} to employee.`,
        module: "CUSTOMER",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
    }

    return successResponse(customer, "Customer created and assigned successfully", 201);
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return errorResponse("Failed to create customer", 500);
  }
}
