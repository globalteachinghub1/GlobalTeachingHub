import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const leads = await prisma.lead.findMany({
    include: { course: { select: { id: true, name: true } }, _count: { select: { notes: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    leads: leads.map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone,
      courseId: l.courseId,
      courseName: l.course?.name ?? null,
      message: l.message,
      source: l.source,
      stage: l.stage,
      noteCount: l._count.notes,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
  });
}
