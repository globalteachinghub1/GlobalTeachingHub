import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { parseAssignmentBody } from "@/lib/assignments";

type Params = { params: Promise<{ id: string; assignmentId: string }> };

async function getAssignment(studentId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) return null;
  const enrollment = await prisma.enrollment.findUnique({ where: { id: assignment.enrollmentId } });
  if (!enrollment || enrollment.studentId !== studentId) return null;
  return assignment;
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id, assignmentId } = await params;
  const existing = await getAssignment(id, assignmentId);
  if (!existing) return notFound("Assignment not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseAssignmentBody({ enrollmentId: existing.enrollmentId, ...(body as Record<string, unknown>) });
  if ("errors" in parsed) {
    return NextResponse.json({ errors: parsed.errors }, { status: 422 });
  }

  const assignment = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      title: parsed.value.title,
      description: parsed.value.description,
      dueDate: parsed.value.dueDate,
    },
    include: { enrollment: { include: { course: true } } },
  });

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      enrollmentId: assignment.enrollmentId,
      courseName: assignment.enrollment.course.name,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id, assignmentId } = await params;
  const existing = await getAssignment(id, assignmentId);
  if (!existing) return notFound("Assignment not found.");

  await prisma.assignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ ok: true });
}
