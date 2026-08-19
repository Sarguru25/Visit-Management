import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv"; // csv or excel
    const employeeId = searchParams.get("employeeId") || "";
    const customerId = searchParams.get("customerId") || searchParams.get("leadId") || "";
    const companyId = searchParams.get("companyId") || "";
    const visitType = searchParams.get("visitType") || "";
    const visitStatus = searchParams.get("visitStatus") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const segment = searchParams.get("segment") || "";
    const type = searchParams.get("type") || "";

    const whereClause: Record<string, unknown> = {};

    if (employeeId) whereClause.employeeId = employeeId;
    if (customerId) whereClause.customerId = customerId;
    if (companyId) whereClause.companyId = companyId;
    if (visitType) whereClause.visitType = visitType;
    if (visitStatus) whereClause.status = visitStatus;

    if (segment || type) {
      whereClause.customer = {
        ...(segment ? { companyName: segment } : {}),
        ...(type ? { industry: type } : {}),
      };
    }

    if (dateFrom || dateTo) {
      whereClause.visitDate = {};
      if (dateFrom) (whereClause.visitDate as Record<string, string>).gte = dateFrom;
      if (dateTo) (whereClause.visitDate as Record<string, string>).lte = dateTo;
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      include: {
        customer: true,
        company: true,
        employee: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { visitDate: "desc" },
    });

    const exportRows = visits.map((v) => ({
      "Visit ID": v.id,
      "Visit Date": v.visitDate.toISOString().split("T")[0],
      "Visit Time": v.visitTime || "N/A",
      "Customer Name": v.customer.name,
      "Customer Company": v.customer.companyName || "N/A",
      "Assigned Company": v.company.name,
      "Employee": v.employee.user.name,
      "Visit Type": v.visitType.replace("_", " "),
      "Visit Status": v.status,
      "Location": v.location || "N/A",
      "Next Follow-up": v.nextFollowupDate ? v.nextFollowupDate.toISOString().split("T")[0] : "N/A",
      "Report": v.visitReport || "N/A",
    }));

    if (format === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Visits");

      const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=customer_visits_report_${Date.now()}.xlsx`,
        },
      });
    } else {
      // Default CSV format
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

      return new NextResponse(csvOutput, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=customer_visits_report_${Date.now()}.csv`,
        },
      });
    }
  } catch (error) {
    console.error("GET /api/reports/export Error:", error);
    return NextResponse.json({ success: false, message: "Export failed" }, { status: 500 });
  }
}
