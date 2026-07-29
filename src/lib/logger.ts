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
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        companyId: companyId || null,
        module,
        action,
        description,
        ipAddress: ipAddress || ip,
      },
    });
  } catch (error) {
    console.error("Failed to record activity log:", error);
  }
}
