import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { logActivity } from "@/lib/logger";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (rows.length === 0) {
      return errorResponse("Excel file is empty", 400);
    }

    // Group logic
    const customersMap = new Map<string, any>(); 

    for (const row of rows) {
      const normalizedRow: any = {};
      for (const key of Object.keys(row)) {
        normalizedRow[key.trim()] = row[key];
      }

      const companyName = String(normalizedRow["Company Name"] || "").trim();
      const phone = String(normalizedRow["Primary Phone Number"] || "").trim();
      
      if (!companyName || !phone) continue; 
      
      const customerKey = companyName.toLowerCase();

      if (!customersMap.has(customerKey)) {
        customersMap.set(customerKey, {
          name: companyName,
          companyName: String(normalizedRow["Customer Segment"] || "").trim(),
          phone: phone,
          industry: String(normalizedRow["Customer Type"] || "").trim(),
          locationsMap: new Map<string, any>()
        });
      }

      const customerObj = customersMap.get(customerKey);
      
      const locName = String(normalizedRow["Location Name"] || "Default Location").trim();
      if (!customerObj.locationsMap.has(locName)) {
        customerObj.locationsMap.set(locName, {
          name: locName,
          type: String(normalizedRow["Location Type"] || "").trim(),
          address: String(normalizedRow["Address"] || "").trim(),
          city: String(normalizedRow["City"] || "").trim(),
          state: String(normalizedRow["State"] || "").trim(),
          pincode: String(normalizedRow["PIN Code"] || "").trim(),
          country: String(normalizedRow["Country"] || "").trim(),
          contacts: []
        });
      }
      
      const locObj = customerObj.locationsMap.get(locName);

      const contactName = String(normalizedRow["Contact Name"] || "").trim();
      if (contactName) {
        const isPrimaryStr = String(normalizedRow["Primary Contact? (Y/N)"] || "N").trim().toUpperCase();
        locObj.contacts.push({
          name: contactName,
          designation: String(normalizedRow["Designation"] || "").trim(),
          department: String(normalizedRow["Department"] || "").trim(),
          mobile: String(normalizedRow["Mobile"] || "").trim(),
          phone: String(normalizedRow["LandLine"] || "").trim(),
          email: String(normalizedRow["Email"] || "").trim(),
          notes: String(normalizedRow["Notes"] || "").trim(),
          isPrimary: isPrimaryStr === "Y" || isPrimaryStr === "YES"
        });
      }
    }

    let importedCount = 0;

    for (const customerObj of customersMap.values()) {
      const existing = await prisma.customer.findUnique({ where: { phone: customerObj.phone } });
      if (existing) continue; 

      const newCustomer = await prisma.customer.create({
        data: {
          name: customerObj.name,
          companyName: customerObj.companyName,
          phone: customerObj.phone,
          industry: customerObj.industry,
          createdBy: session.userId,
        }
      });

      const locations = Array.from(customerObj.locationsMap.values());
      for (const loc of locations as any[]) {
        const newLoc = await prisma.location.create({
          data: {
            customerId: newCustomer.id,
            name: loc.name,
            type: loc.type || null,
            address: loc.address || null,
            city: loc.city || null,
            state: loc.state || null,
            pincode: loc.pincode || null,
            country: loc.country || null,
          }
        });

        if (loc.contacts && loc.contacts.length > 0) {
          await prisma.contact.createMany({
            data: loc.contacts.map((c: any) => ({
              customerId: newCustomer.id,
              locationId: newLoc.id,
              name: c.name,
              designation: c.designation || null,
              department: c.department || null,
              mobile: c.mobile || null,
              phone: c.phone || null,
              email: c.email || null,
              notes: c.notes || null,
              isPrimary: c.isPrimary
            }))
          });
        }
      }
      importedCount++;
    }

    await logActivity({
      userId: session.userId,
      module: "CUSTOMER",
      action: "BULK_UPLOAD",
      description: `Bulk uploaded ${importedCount} customers.`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return successResponse({ count: importedCount }, "Bulk upload successful");
  } catch (error) {
    console.error("Bulk upload error:", error);
    return errorResponse("Failed to process bulk upload", 500);
  }
}
