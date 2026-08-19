import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const createLocationSchema = z.object({
  name: z.string().min(1, "Location Name is required"),
  code: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
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
    const locations = await prisma.location.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contacts: true, visits: true }
        }
      }
    });

    return successResponse(locations, "Locations retrieved successfully");
  } catch (error) {
    console.error("GET /api/customers/[id]/locations error:", error);
    return errorResponse("Failed to fetch locations", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return errorResponse("Customer not found", 404);

    const body = await req.json();
    const parsed = createLocationSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.format());
    }

    const data = parsed.data;

    // Check for duplicate location (same name for same customer)
    const existing = await prisma.location.findFirst({
      where: {
        customerId: id,
        name: { equals: data.name, mode: "insensitive" }
      }
    });
    if (existing) {
      return errorResponse("A similar location already exists for this customer", 400);
    }

    // Also check code uniqueness
    if (data.code) {
      const codeExisting = await prisma.location.findFirst({
        where: {
          customerId: id,
          code: { equals: data.code, mode: "insensitive" }
        }
      });
      if (codeExisting) {
        return errorResponse("Location code is already used for this customer", 400);
      }
    }

    const location = await prisma.location.create({
      data: {
        customerId: id,
        name: data.name,
        code: data.code,
        type: data.type,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        phone: data.phone,
        email: data.email,
        status: data.status,
        notes: data.notes,
      }
    });

    await logActivity({
      userId: session.userId,
      action: "LOCATION_CREATED",
      description: `Created new location ${location.name} for customer ${customer.name}.`,
      module: "CUSTOMER",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(location, "Location created successfully", 201);
  } catch (error) {
    console.error("POST /api/customers/[id]/locations error:", error);
    return errorResponse("Failed to create location", 500);
  }
}
