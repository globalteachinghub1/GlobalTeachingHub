import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole("PARENT");
  if (auth instanceof NextResponse) return auth;

  const parent = await prisma.parent.findUnique({
    where: { userId: auth.sub },
    include: {
      user: { select: { name: true } },
      students: {
        include: {
          teacher: { include: { user: true } },
          enrollments: {
            include: {
              course: true,
              attendance: { orderBy: { date: "desc" }, take: 7 },
            },
          },
          invoices: { orderBy: { date: "desc" } },
          notifications: { orderBy: { date: "desc" } },
        },
      },
    },
  });

  if (!parent) {
    return NextResponse.json({ parent: null });
  }

  return NextResponse.json({
    parent: {
      name: parent.user.name,
      children: parent.students.map((student) => ({
        id: student.id,
        name: student.name,
        courses: student.enrollments.map((e) => ({
          id: e.course.id,
          slug: e.course.slug,
          name: e.course.name,
          color: e.course.color,
          icon: e.course.icon,
          classStartTime: e.classStartTime,
          classEndTime: e.classEndTime,
          classDays: e.classDays,
          attendance: e.attendance,
        })),
        teacherName: student.teacher?.user.name ?? null,
        level: student.level,
        progress: student.progress,
        status: student.status,
        invoices: student.invoices,
        notifications: student.notifications,
      })),
    },
  });
}
