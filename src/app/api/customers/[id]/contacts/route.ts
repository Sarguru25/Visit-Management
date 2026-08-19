import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import { z } from "zod";

const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
  locationId: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const { id } = await params; // id is customerId

    const contacts = await prisma.contact.findMany({
      where: { customerId: id },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        location: true
      }
    });

    return successResponse(contacts, "Contacts retrieved successfully");
  } catch (error) {
    console.error("GET /api/customers/[id]/contacts error:", error);
    return errorResponse("Failed to fetch contacts", 500);
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
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.format());
    }

    const data = parsed.data;

    // Check for duplicates
    if (data.mobile || (data.email && data.email !== "")) {
      const duplicateWhere: any[] = [];
      if (data.mobile) duplicateWhere.push({ mobile: data.mobile });
      if (data.email && data.email !== "") duplicateWhere.push({ email: data.email });

      const duplicate = await prisma.contact.findFirst({
        where: {
          customerId: id,
          OR: duplicateWhere
        }
      });

      if (duplicate) {
        return errorResponse("A similar contact already exists for this customer with the same mobile or email.", 400);
      }
    }

    // Handle primary contact logic
    if (data.isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId: id, isPrimary: true },
        data: { isPrimary: false }
      });
    } else {
      // If no contacts exist for this customer, make this one primary
      const existingCount = await prisma.contact.count({ where: { customerId: id } });
      if (existingCount === 0) {
        data.isPrimary = true;
      }
    }

    const contact = await prisma.contact.create({
      data: {
        customerId: id,
        name: data.name,
        designation: data.designation || null,
        department: data.department || null,
        mobile: data.mobile || null,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        isPrimary: data.isPrimary,
        status: data.status,
        locationId: data.locationId || null
      }
    });

    await logActivity({
      userId: session.userId,
      action: "CONTACT_CREATED",
      description: `Added contact ${contact.name} to customer ${customer.name}.`,
      module: "CUSTOMER",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse(contact, "Contact created successfully", 201);
  } catch (error) {
    console.error("POST /api/customers/[id]/contacts error:", error);
    return errorResponse("Failed to create contact", 500);
  }
}
