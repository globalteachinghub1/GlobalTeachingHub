import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { requireString, type FieldErrors } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true, teachers: true } } },
  });

  if (!course) return notFound("Course not found.");

  return NextResponse.json({
    course: {
      id: course.id,
      slug: course.slug,
      name: course.name,
      description: course.description,
      summary: course.summary,
      topics: course.topics,
      outcomes: course.outcomes,
      priceNote: course.priceNote,
      color: course.color,
      icon: course.icon,
      studentCount: course._count.enrollments,
      teacherCount: course._count.teachers,
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) return notFound("Course not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = requireString(errors, "name", data.name, "Course name", {
    min: 2,
    max: 100,
  });
  const summary = requireString(errors, "summary", data.summary, "Summary", {
    min: 10,
    max: 1000,
  });
  const description =
    typeof data.description === "string" ? data.description.trim() || null : existing.description;
  const color = typeof data.color === "string" && data.color ? data.color : existing.color;
  const icon = typeof data.icon === "string" && data.icon ? data.icon : existing.icon;
  const topics = Array.isArray(data.topics)
    ? data.topics.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    : existing.topics;
  const outcomes = Array.isArray(data.outcomes)
    ? data.outcomes.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    : existing.outcomes;
  const priceNote =
    typeof data.priceNote === "string" ? data.priceNote.trim() || null : existing.priceNote;

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: { name, summary, description, color, icon, topics, outcomes, priceNote },
    include: { _count: { select: { enrollments: true, teachers: true } } },
  });

  return NextResponse.json({
    course: {
      id: course.id,
      slug: course.slug,
      name: course.name,
      description: course.description,
      summary: course.summary,
      topics: course.topics,
      outcomes: course.outcomes,
      priceNote: course.priceNote,
      color: course.color,
      icon: course.icon,
      studentCount: course._count.enrollments,
      teacherCount: course._count.teachers,
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.course.findUnique({
    where: { id },
    include: { _count: { select: { teachers: true, enrollments: true } } },
  });
  if (!existing) return notFound("Course not found.");

  if (existing._count.teachers > 0) {
    return NextResponse.json(
      {
        error:
          "This course still has teachers assigned to it. Reassign or remove them first.",
      },
      { status: 409 }
    );
  }

  if (existing._count.enrollments > 0) {
    return NextResponse.json(
      {
        error:
          "Students are still enrolled in this course. Unenroll them first — deleting a course also deletes its enrollment attendance and reports.",
      },
      { status: 409 }
    );
  }

  await prisma.course.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
