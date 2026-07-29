import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const companies = await prisma.company.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" }
    });

    return successResponse(companies, "Companies retrieved successfully");
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return errorResponse("Failed to fetch companies", 500);
  }
}
