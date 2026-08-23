import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return notFound("Lead not found.");

  const notes = await prisma.leadNote.findMany({
    where: { leadId: id },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      note: n.note,
      createdByName: n.createdBy?.name ?? null,
      createdAt: n.createdAt,
    })),
  });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return notFound("Lead not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const note = typeof data.note === "string" ? data.note.trim() : "";
  if (!note) {
    return NextResponse.json({ errors: { note: "Note text is required." } }, { status: 422 });
  }

  const created = await prisma.leadNote.create({
    data: { leadId: id, note, createdById: auth.sub },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json({
    note: {
      id: created.id,
      note: created.note,
      createdByName: created.createdBy?.name ?? null,
      createdAt: created.createdAt,
    },
  });
}
