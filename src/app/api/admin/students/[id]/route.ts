import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { checkTeacherTeachesStudentCourse } from "@/lib/teacher-course-match";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { date: "desc" } },
      enrollments: {
        include: {
          course: true,
          attendance: { orderBy: { date: "desc" }, take: 30 },
        },
      },
      parents: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!student) return notFound("Student not found.");

  return NextResponse.json({
    student: {
      ...student,
      courseIds: student.enrollments.map((e) => e.courseId),
      courseNames: student.enrollments.map((e) => e.course.name),
      enrollments: student.enrollments.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        courseName: e.course.name,
        classStartTime: e.classStartTime,
        classEndTime: e.classEndTime,
        classDays: e.classDays,
        attendance: e.attendance,
      })),
      parents: student.parents.map((p) => ({
        id: p.id,
        name: p.user.name,
        email: p.user.email,
      })),
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.student.findUnique({
    where: { id },
    include: { enrollments: true },
  });
  if (!existing) return notFound("Student not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const name = typeof data.name === "string" ? data.name.trim() : existing.name;
  const email = typeof data.email === "string" ? data.email.trim() : existing.email;
  const courseIds = Array.isArray(data.courseIds)
    ? data.courseIds.filter((cid): cid is string => typeof cid === "string" && cid.length > 0)
    : undefined;
  const teacherId =
    typeof data.teacherId === "string" ? data.teacherId || null : existing.teacherId;
  const level = typeof data.level === "string" ? data.level : existing.level;
  const status = typeof data.status === "string" ? data.status : existing.status;
  const progress =
    typeof data.progress === "number" ? Math.max(0, Math.min(100, data.progress)) : existing.progress;

  const phone = typeof data.phone === "string" ? data.phone.trim() || null : existing.phone;
  const whatsapp =
    typeof data.whatsapp === "string" ? data.whatsapp.trim() || null : existing.whatsapp;
  const parentName =
    typeof data.parentName === "string" ? data.parentName.trim() || null : existing.parentName;
  const parentContact =
    typeof data.parentContact === "string"
      ? data.parentContact.trim() || null
      : existing.parentContact;
  const monthlyFee =
    typeof data.monthlyFee === "string" ? data.monthlyFee.trim() || null : existing.monthlyFee;

  let joined = existing.joined;
  if (typeof data.joined === "string" && data.joined) {
    const parsed = new Date(data.joined);
    if (Number.isNaN(parsed.getTime())) {
      errors.joined = "Enter a valid joining date.";
    } else {
      joined = parsed;
    }
  }

  if (!name) errors.name = "Full name is required.";
  if (!email) errors.email = "Email is required.";
  if (!["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(level)) {
    errors.level = "Select a valid level.";
  }
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    errors.status = "Select a valid status.";
  }
  if (courseIds && courseIds.length > 0) {
    const validCount = await prisma.course.count({ where: { id: { in: courseIds } } });
    if (validCount !== courseIds.length) {
      errors.courseIds = "Select valid courses.";
    }
  }

  if (Object.keys(errors).length === 0) {
    const effectiveCourseIds = courseIds ?? existing.enrollments.map((e) => e.courseId);
    const teacherError = await checkTeacherTeachesStudentCourse(teacherId, effectiveCourseIds);
    if (teacherError) errors.teacherId = teacherError;
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  await prisma.student.update({
    where: { id },
    data: {
      name,
      email,
      teacherId,
      level: level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      status: status as "ACTIVE" | "INACTIVE",
      progress,
      phone,
      whatsapp,
      parentName,
      parentContact,
      monthlyFee,
      joined,
    },
  });

  if (courseIds !== undefined) {
    const currentCourseIds = existing.enrollments.map((e) => e.courseId);
    const toAdd = courseIds.filter((cid) => !currentCourseIds.includes(cid));
    const toRemove = existing.enrollments.filter((e) => !courseIds.includes(e.courseId));

    await prisma.$transaction([
      ...(toRemove.length > 0
        ? [prisma.enrollment.deleteMany({ where: { id: { in: toRemove.map((e) => e.id) } } })]
        : []),
      ...(toAdd.length > 0
        ? [
            prisma.enrollment.createMany({
              data: toAdd.map((courseId) => ({ studentId: id, courseId })),
            }),
          ]
        : []),
    ]);
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id },
    include: { enrollments: { include: { course: true } } },
  });

  return NextResponse.json({
    student: {
      ...student,
      courseIds: student.enrollments.map((e) => e.courseId),
      courseNames: student.enrollments.map((e) => e.course.name),
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return notFound("Student not found.");

  // Notes, invoices, notifications, and enrollments (with their attendance/
  // reports) cascade with the Student row (see schema.prisma). Delete
  // first, then remove any linked login account separately, since that
  // relation only nulls out on delete.
  await prisma.student.delete({ where: { id } });
  if (existing.userId) {
    await prisma.user.delete({ where: { id: existing.userId } });
  }

  return NextResponse.json({ ok: true });
}
