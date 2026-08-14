import { prisma } from "./prisma";

export async function logActivity({
  userId,
  action,
  description,
  ip = "127.0.0.1",
  companyId,
  module = "SYSTEM",
  ipAddress,
}: {
  userId?: string;
  action: string;
  description: string;
  ip?: string;
  companyId?: string;
  module?: string;
  ipAddress?: string;
}) {
  try {
    // Activity logging disabled as per user request to save storage
    // await prisma.activityLog.create({ ... });
  } catch (error) {
    console.error("Failed to record activity log:", error);
  }
}
