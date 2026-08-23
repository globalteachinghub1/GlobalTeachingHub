import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["TEACHER", "STAFF"]);
  if (auth instanceof NextResponse) return auth;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: auth.sub },
    include: { user: true, courses: true },
  });
  // Staff members aren't tied to a Teacher record — they share this portal
  // route but have no students/courses of their own.
  if (!teacher) return NextResponse.json({ teacher: null, students: [] });

  const students = await prisma.student.findMany({
    where: { teacherId: teacher.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    teacher: {
      name: teacher.user.name,
      courseNames: teacher.courses.map((c) => c.name),
    },
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      level: s.level,
      progress: s.progress,
      status: s.status,
    })),
  });
}
