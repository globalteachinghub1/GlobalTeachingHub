import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { getPortalLocale } from "@/lib/portal-locale";
import { localizeCourse } from "@/lib/course-translations";
import { localizeNotifications } from "@/lib/notification-i18n";
import { localizeProgressNotes } from "@/lib/progress-notes-i18n";

export async function GET() {
  const auth = await requireRole("STUDENT");
  if (auth instanceof NextResponse) return auth;

  const locale = await getPortalLocale();

  const student = await prisma.student.findUnique({
    where: { userId: auth.sub },
    include: {
      teacher: { include: { user: true } },
      enrollments: {
        include: {
          course: { include: { translations: { where: { locale } } } },
          attendance: { orderBy: { date: "desc" }, take: 7 },
          assignments: { orderBy: { dueDate: "asc" } },
        },
      },
      invoices: { orderBy: { date: "desc" } },
      notifications: { orderBy: { date: "desc" } },
      notes: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  if (!student) {
    return NextResponse.json({ student: null });
  }

  const [notifications, notes] = await Promise.all([
    localizeNotifications(student.notifications, locale),
    localizeProgressNotes(student.notes, locale),
  ]);

  const assignments = student.enrollments
    .flatMap((e) =>
      e.assignments.map((a) => ({
        id: a.id,
        courseName: localizeCourse(e.course).name,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
      }))
    )
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      whatsapp: student.whatsapp,
      parentName: student.parentName,
      parentContact: student.parentContact,
      courses: student.enrollments.map((e) => {
        const course = localizeCourse(e.course);
        return {
          id: course.id,
          slug: course.slug,
          name: course.name,
          color: course.color,
          icon: course.icon,
          classStartTime: e.classStartTime,
          classEndTime: e.classEndTime,
          classDays: e.classDays,
          attendance: e.attendance,
        };
      }),
      teacherName: student.teacher?.user.name ?? null,
      level: student.level,
      progress: student.progress,
      status: student.status,
      joined: student.joined,
      invoices: student.invoices,
      notifications,
      notes,
      assignments,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireRole("STUDENT");
  if (auth instanceof NextResponse) return auth;

  const existing = await prisma.student.findUnique({ where: { userId: auth.sub } });
  if (!existing) return notFound("Student profile not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const name = typeof data.name === "string" ? data.name.trim() : existing.name;
  const phone = typeof data.phone === "string" ? data.phone.trim() : existing.phone;

  if (!name) errors.name = "Full name is required.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const student = await prisma.student.update({
    where: { id: existing.id },
    data: { name, phone },
  });

  return NextResponse.json({ student });
}
