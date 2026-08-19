import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            company: { select: { name: true, id: true, code: true } },
            employee: {
              include: {
                user: { select: { name: true, email: true, phone: true } },
              },
            },
          },
        },
        visits: {
          orderBy: { visitDate: "desc" },
          include: {
            company: { select: { name: true, id: true } },
            employee: {
              include: { user: { select: { name: true } } },
            },
          },
        },
        sales: {
          orderBy: { invoiceDate: "desc" },
          include: {
            company: { select: { name: true } },
          }
        },
        followUps: {
          orderBy: { date: "asc" }
        },
        contacts: {
          orderBy: { createdAt: "desc" },
          include: {
            location: true
          }
        }
      },
    });

    if (!customer) return errorResponse("Customer not found", 404);

    let empId = session.employeeId;
    if (session.role === "EMPLOYEE" && !empId) {
      const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
      if (emp) empId = emp.id;
    }

    if (session.role === "EMPLOYEE") {
      const isAssigned = customer.assignments.some((a: any) => a.employeeId === empId);
      if (!isAssigned) {
        return errorResponse("Forbidden: You can only view your assigned customers", 403);
      }
    }

    return successResponse(customer, "Customer details retrieved");
  } catch (error) {
    console.error("GET /api/customers/[id] error:", error);
    return errorResponse("Failed to fetch customer", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { assignments: true }
    });
    
    if (!customer) return errorResponse("Customer not found", 404);

    let empId = session.employeeId;
    if (session.role === "EMPLOYEE" && !empId) {
      const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
      if (emp) empId = emp.id;
    }

    if (session.role === "EMPLOYEE") {
      const isAssigned = customer.assignments.some((a: any) => a.employeeId === empId);
      if (!isAssigned) {
        return errorResponse("Forbidden: You can only edit your assigned customers", 403);
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : customer.name,
        companyName: body.companyName !== undefined ? body.companyName : customer.companyName,
        phone: body.phone !== undefined ? body.phone : customer.phone,
        email: body.email !== undefined ? (body.email || null) : customer.email,
        address: body.address !== undefined ? body.address : customer.address,
        city: body.city !== undefined ? (body.city || null) : customer.city,
        state: body.state !== undefined ? (body.state || null) : customer.state,
        country: body.country !== undefined ? (body.country || null) : customer.country,
        pincode: body.pincode !== undefined ? (body.pincode || null) : customer.pincode,
        industry: body.industry !== undefined ? (body.industry || null) : customer.industry,
        remarks: body.remarks !== undefined ? (body.remarks || null) : customer.remarks,
      },
    });

    await logActivity({
      userId: session.userId,
      module: "CUSTOMER",
      action: "CUSTOMER_UPDATED",
      description: `Updated customer details for ${updatedCustomer.name}.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    if (body.assignments && Array.isArray(body.assignments)) {
      if (session.role === "ADMIN") {
        // Admin can overwrite all assignments
        // Deactivate old assignments
        await prisma.customerAssignment.updateMany({
          where: { customerId: id },
          data: { status: "INACTIVE" }
        });

        for (const a of body.assignments) {
          if (a.companyId && a.employeeId) {
            await prisma.customerAssignment.create({
              data: {
                customerId: id,
                companyId: a.companyId,
                employeeId: a.employeeId,
                status: "ACTIVE"
              }
            });
          }
        }
      }
    }

    return successResponse(updatedCustomer, "Customer updated successfully");
  } catch (error) {
    console.error("PUT /api/customers/[id] error:", error);
    return errorResponse("Failed to update customer", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { assignments: true }
    });
    
    if (!customer) return errorResponse("Customer not found", 404);

    let empId = session.employeeId;
    if (session.role === "EMPLOYEE" && !empId) {
      const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
      if (emp) empId = emp.id;
    }

    if (session.role === "EMPLOYEE") {
      return errorResponse("Forbidden: Only ADMIN can delete global customers", 403);
    }

    await prisma.customer.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      module: "CUSTOMER",
      action: "CUSTOMER_DELETED",
      description: `Deleted customer ${customer.name}.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(null, "Customer deleted successfully");
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error);
    return errorResponse("Failed to delete customer", 500);
  }
}
