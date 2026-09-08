import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { parseAssignmentBody } from "@/lib/assignments";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return notFound("Student not found.");

  const assignments = await prisma.assignment.findMany({
    where: { enrollment: { studentId: id } },
    include: { enrollment: { include: { course: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    assignments: assignments.map((a) => ({
      id: a.id,
      enrollmentId: a.enrollmentId,
      courseName: a.enrollment.course.name,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
    })),
  });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return notFound("Student not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseAssignmentBody(body as Record<string, unknown>);
  if ("errors" in parsed) {
    return NextResponse.json({ errors: parsed.errors }, { status: 422 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: parsed.value.enrollmentId },
  });
  if (!enrollment || enrollment.studentId !== id) {
    return NextResponse.json({ errors: { enrollmentId: "Select a valid course." } }, { status: 422 });
  }

  const assignment = await prisma.assignment.create({
    data: parsed.value,
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
