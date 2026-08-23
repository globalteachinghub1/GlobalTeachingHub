import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getPortalLocale } from "@/lib/portal-locale";
import { localizeCourse } from "@/lib/course-translations";
import { localizeNotifications } from "@/lib/notification-i18n";
import { localizeProgressNotes } from "@/lib/progress-notes-i18n";

export async function GET() {
  const auth = await requireRole("PARENT");
  if (auth instanceof NextResponse) return auth;

  const locale = await getPortalLocale();

  const parent = await prisma.parent.findUnique({
    where: { userId: auth.sub },
    include: {
      user: { select: { name: true } },
      students: {
        include: {
          teacher: { include: { user: true } },
          enrollments: {
            include: {
              course: { include: { translations: { where: { locale } } } },
              attendance: { orderBy: { date: "desc" }, take: 7 },
            },
          },
          invoices: { orderBy: { date: "desc" } },
          notifications: { orderBy: { date: "desc" } },
          notes: { orderBy: { date: "desc" }, take: 10 },
        },
      },
    },
  });

  if (!parent) {
    return NextResponse.json({ parent: null });
  }

  const children = await Promise.all(
    parent.students.map(async (student) => {
      const [notifications, notes] = await Promise.all([
        localizeNotifications(student.notifications, locale),
        localizeProgressNotes(student.notes, locale),
      ]);

      return {
        id: student.id,
        name: student.name,
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
        invoices: student.invoices,
        notifications,
        notes,
      };
    })
  );

  return NextResponse.json({
    parent: { name: parent.user.name, children },
  });
}
