import { prisma } from "@/lib/prisma";

/** Finds or creates the single (student, parent) conversation thread. */
export async function getOrCreateThread(studentId: string, parentId: string) {
  return prisma.messageThread.upsert({
    where: { studentId_parentId: { studentId, parentId } },
    update: {},
    create: { studentId, parentId },
  });
}
