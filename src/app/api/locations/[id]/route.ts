import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const updateLocationSchema = z.object({
  name: z.string().min(1, "Location Name is required").optional(),
  code: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, companyName: true } },
        contacts: true,
        visits: {
          orderBy: { visitDate: "desc" },
          include: {
            contact: { select: { id: true, name: true } },
            company: { select: { id: true, name: true } },
            employee: { include: { user: { select: { name: true } } } }
          }
        }
      }
    });

    if (!location) return errorResponse("Location not found", 404);

    return successResponse(location, "Location retrieved successfully");
  } catch (error) {
    console.error("GET /api/locations/[id] error:", error);
    return errorResponse("Failed to fetch location", 500);
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
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) return errorResponse("Location not found", 404);

    const body = await req.json();
    const parsed = updateLocationSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.format());
    }

    const data = parsed.data;

    if (data.name && data.name !== location.name) {
      const existing = await prisma.location.findFirst({
        where: {
          customerId: location.customerId,
          name: { equals: data.name, mode: "insensitive" },
          id: { not: id }
        }
      });
      if (existing) return errorResponse("A similar location already exists for this customer", 400);
    }

    if (data.code && data.code !== location.code) {
      const codeExisting = await prisma.location.findFirst({
        where: {
          customerId: location.customerId,
          code: { equals: data.code, mode: "insensitive" },
          id: { not: id }
        }
      });
      if (codeExisting) return errorResponse("Location code is already used for this customer", 400);
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : location.name,
        code: data.code !== undefined ? data.code : location.code,
        type: data.type !== undefined ? data.type : location.type,
        address: data.address !== undefined ? data.address : location.address,
        city: data.city !== undefined ? data.city : location.city,
        state: data.state !== undefined ? data.state : location.state,
        country: data.country !== undefined ? data.country : location.country,
        pincode: data.pincode !== undefined ? data.pincode : location.pincode,
        phone: data.phone !== undefined ? data.phone : location.phone,
        email: data.email !== undefined ? data.email : location.email,
        status: data.status !== undefined ? data.status : location.status,
        notes: data.notes !== undefined ? data.notes : location.notes,
      }
    });

    await logActivity({
      userId: session.userId,
      action: "LOCATION_UPDATED",
      description: `Updated location ${updatedLocation.name}.`,
      module: "CUSTOMER",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(updatedLocation, "Location updated successfully");
  } catch (error) {
    console.error("PUT /api/locations/[id] error:", error);
    return errorResponse("Failed to update location", 500);
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
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { visits: true, contacts: true }
        }
      }
    });

    if (!location) return errorResponse("Location not found", 404);

    if (location._count.visits > 0 || location._count.contacts > 0) {
      await prisma.location.update({
        where: { id },
        data: { status: "INACTIVE" }
      });

      await logActivity({
        userId: session.userId,
        action: "LOCATION_DEACTIVATED",
        description: `Deactivated location ${location.name} due to existing records.`,
        module: "CUSTOMER",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });

      return successResponse(null, "Location has visits/contacts. It has been deactivated instead of deleted.");
    }

    await prisma.location.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      action: "LOCATION_DELETED",
      description: `Deleted location ${location.name}.`,
      module: "CUSTOMER",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(null, "Location deleted successfully");
  } catch (error) {
    console.error("DELETE /api/locations/[id] error:", error);
    return errorResponse("Failed to delete location", 500);
  }
}
