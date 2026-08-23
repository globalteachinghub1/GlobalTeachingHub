import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";

/**
 * Broadcasts an event to the org-wide Admin/Teacher/Staff notification
 * center (student joined, payment received, SOP published, ...).
 */
export async function notifyStaff(
  type: NotificationType,
  message: string,
  link?: string
) {
  await prisma.systemNotification.create({
    data: { type, message, link },
  });
}
