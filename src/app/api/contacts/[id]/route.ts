import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const updateContactSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  locationId: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true }
        },
        visits: {
          orderBy: { visitDate: 'desc' },
          include: {
            company: { select: { id: true, name: true } },
            employee: { include: { user: { select: { name: true } } } }
          }
        }
      }
    });

    if (!contact) return errorResponse("Contact not found", 404);

    return successResponse(contact, "Contact retrieved successfully");
  } catch (error) {
    console.error("GET /api/contacts/[id] error:", error);
    return errorResponse("Failed to fetch contact", 500);
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
    const contact = await prisma.contact.findUnique({ where: { id } });
    
    if (!contact) return errorResponse("Contact not found", 404);

    const body = await req.json();
    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.format());
    }

    const data = parsed.data;

    // Handle primary contact logic
    if (data.isPrimary === true && !contact.isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId: contact.customerId, isPrimary: true },
        data: { isPrimary: false }
      });
    } else if (data.isPrimary === false && contact.isPrimary) {
      // Prevent removing primary if it's the only active one? 
      // Actually it's fine if they manually disable it, just allow it.
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : contact.name,
        designation: data.designation !== undefined ? data.designation : contact.designation,
        department: data.department !== undefined ? data.department : contact.department,
        mobile: data.mobile !== undefined ? data.mobile : contact.mobile,
        phone: data.phone !== undefined ? data.phone : contact.phone,
        email: data.email !== undefined ? data.email : contact.email,
        notes: data.notes !== undefined ? data.notes : contact.notes,
        isPrimary: data.isPrimary !== undefined ? data.isPrimary : contact.isPrimary,
        status: data.status !== undefined ? data.status : contact.status,
        locationId: data.locationId !== undefined ? data.locationId : contact.locationId,
      }
    });

    await logActivity({
      userId: session.userId,
      action: "CONTACT_UPDATED",
      description: `Updated contact ${updatedContact.name}.`,
      module: "CUSTOMER",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(updatedContact, "Contact updated successfully");
  } catch (error) {
    console.error("PUT /api/contacts/[id] error:", error);
    return errorResponse("Failed to update contact", 500);
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
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        _count: {
          select: { visits: true }
        }
      }
    });
    
    if (!contact) return errorResponse("Contact not found", 404);

    if (contact._count.visits > 0) {
      // Soft delete instead of hard delete if it has visits
      await prisma.contact.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });

      await logActivity({
        userId: session.userId,
        action: "CONTACT_DEACTIVATED",
        description: `Deactivated contact ${contact.name} (has visits).`,
        module: "CUSTOMER",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });

      return successResponse(null, "Contact has visits. It has been deactivated instead of deleted.");
    } else {
      await prisma.contact.delete({ where: { id } });

      await logActivity({
        userId: session.userId,
        action: "CONTACT_DELETED",
        description: `Deleted contact ${contact.name}.`,
        module: "CUSTOMER",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });

      return successResponse(null, "Contact deleted successfully");
    }
  } catch (error) {
    console.error("DELETE /api/contacts/[id] error:", error);
    return errorResponse("Failed to delete contact", 500);
  }
}
