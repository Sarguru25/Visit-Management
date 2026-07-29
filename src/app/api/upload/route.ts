import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return errorResponse("Unauthorized", 401);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file uploaded", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("File size exceeds 10 MB limit", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("Invalid file type. Only Images and PDF files are allowed.", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const fileExt = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".jpg");
    const filename = `visit_attachment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return successResponse(
      {
        url: publicUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
      "File uploaded successfully"
    );
  } catch (error) {
    console.error("POST /api/upload Error:", error);
    return errorResponse("Failed to upload file", 500);
  }
}
