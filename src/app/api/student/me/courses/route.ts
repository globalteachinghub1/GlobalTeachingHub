import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { notifyStaff } from "@/lib/system-notifications";

export async function GET() {
  const auth = await requireRole("STUDENT");
  if (auth instanceof NextResponse) return auth;

  const [courses, student] = await Promise.all([
    prisma.course.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.student.findUnique({
      where: { userId: auth.sub },
      include: { enrollments: { select: { courseId: true } } },
    }),
  ]);
  if (!student) return notFound("Student profile not found.");

  const enrolledCourseIds = new Set(student.enrollments.map((e) => e.courseId));

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      summary: c.summary,
      color: c.color,
      icon: c.icon,
      enrolled: enrolledCourseIds.has(c.id),
    })),
  });
}

export async function PUT(request: Request) {
  const auth = await requireRole("STUDENT");
  if (auth instanceof NextResponse) return auth;

  const student = await prisma.student.findUnique({
    where: { userId: auth.sub },
    include: { enrollments: true, teacher: { include: { courses: true } } },
  });
  if (!student) return notFound("Student profile not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const courseIds = Array.isArray(data.courseIds)
    ? data.courseIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (courseIds.length > 0) {
    const validCount = await prisma.course.count({ where: { id: { in: courseIds } } });
    if (validCount !== courseIds.length) {
      return NextResponse.json({ error: "Select valid courses." }, { status: 422 });
    }
  }

  const currentCourseIds = student.enrollments.map((e) => e.courseId);
  const toAdd = courseIds.filter((id) => !currentCourseIds.includes(id));
  const toRemove = student.enrollments.filter((e) => !courseIds.includes(e.courseId));

  if (toAdd.length === 0 && toRemove.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // If the student's assigned teacher no longer teaches any of their
  // remaining courses, unassign them — admin can pick a new one.
  const teacherStillMatches =
    !student.teacherId ||
    courseIds.length === 0 ||
    student.teacher?.courses.some((c) => courseIds.includes(c.id));

  await prisma.$transaction([
    ...(toRemove.length > 0
      ? [prisma.enrollment.deleteMany({ where: { id: { in: toRemove.map((e) => e.id) } } })]
      : []),
    ...(toAdd.length > 0
      ? [
          prisma.enrollment.createMany({
            data: toAdd.map((courseId) => ({ studentId: student.id, courseId })),
          }),
        ]
      : []),
    ...(!teacherStillMatches
      ? [prisma.student.update({ where: { id: student.id }, data: { teacherId: null } })]
      : []),
  ]);

  if (toAdd.length > 0 || toRemove.length > 0) {
    notifyStaff(
      "GENERAL",
      `${student.name} changed their course selection.`,
      `/admin/students/${student.id}`
    ).catch((error) => {
      console.error("Failed to create course-change notification", error);
    });
  }

  return NextResponse.json({ ok: true });
}
