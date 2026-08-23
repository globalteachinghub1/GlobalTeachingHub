import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";

type Params = { params: Promise<{ id: string }> };

const VALID_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "ENROLLED", "LOST"] as const;

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return notFound("Lead not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const stage =
    typeof data.stage === "string" && (VALID_STAGES as readonly string[]).includes(data.stage)
      ? (data.stage as (typeof VALID_STAGES)[number])
      : existing.stage;

  const lead = await prisma.lead.update({
    where: { id },
    data: { stage },
    include: { course: { select: { id: true, name: true } }, _count: { select: { notes: true } } },
  });

  return NextResponse.json({
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      courseId: lead.courseId,
      courseName: lead.course?.name ?? null,
      message: lead.message,
      source: lead.source,
      stage: lead.stage,
      noteCount: lead._count.notes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return notFound("Lead not found.");

  await prisma.lead.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
