import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { requireEmail, requireString, type FieldErrors } from "@/lib/validation";
import { checkTeacherTeachesStudentCourse } from "@/lib/teacher-course-match";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { sendAccountCreatedEmail } from "@/lib/mailer";
import { notifyStaff } from "@/lib/system-notifications";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const students = await prisma.student.findMany({
    include: { teacher: { include: { user: true } }, enrollments: { include: { course: true } } },
    orderBy: { joined: "desc" },
  });

  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      courseIds: s.enrollments.map((e) => e.courseId),
      courseNames: s.enrollments.map((e) => e.course.name),
      teacherId: s.teacherId,
      teacherName: s.teacher?.user.name ?? null,
      level: s.level,
      progress: s.progress,
      status: s.status,
      joined: s.joined,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = requireString(errors, "name", data.name, "Full name", {
    min: 2,
    max: 100,
  });
  const email = requireEmail(errors, "email", data.email);
  const courseIds = Array.isArray(data.courseIds)
    ? data.courseIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  const teacherId =
    typeof data.teacherId === "string" && data.teacherId ? data.teacherId : null;
  const level = typeof data.level === "string" ? data.level : "BEGINNER";

  if (!["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(level)) {
    errors.level = "Select a valid level.";
  }

  const phone = typeof data.phone === "string" ? data.phone.trim() || null : null;
  const whatsapp = typeof data.whatsapp === "string" ? data.whatsapp.trim() || null : null;
  const parentName = typeof data.parentName === "string" ? data.parentName.trim() || null : null;
  const parentContact =
    typeof data.parentContact === "string" ? data.parentContact.trim() || null : null;
  const monthlyFee =
    typeof data.monthlyFee === "string" ? data.monthlyFee.trim() || null : null;

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  if (courseIds.length > 0) {
    const validCount = await prisma.course.count({ where: { id: { in: courseIds } } });
    if (validCount !== courseIds.length) {
      return NextResponse.json(
        { errors: { courseIds: "Select valid courses." } },
        { status: 422 }
      );
    }
  }

  const teacherError = await checkTeacherTeachesStudentCourse(teacherId, courseIds);
  if (teacherError) {
    return NextResponse.json({ errors: { teacherId: teacherError } }, { status: 422 });
  }

  const [existingStudent, existingUser] = await Promise.all([
    prisma.student.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existingStudent || existingUser) {
    return NextResponse.json(
      { errors: { email: "A student with this email already exists." } },
      { status: 422 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "STUDENT",
      student: {
        create: {
          name,
          email,
          phone,
          whatsapp,
          parentName,
          parentContact,
          monthlyFee,
          enrollments: { create: courseIds.map((courseId) => ({ courseId })) },
          teacherId,
          level: level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
          progress: 0,
          status: "ACTIVE",
        },
      },
    },
    include: {
      student: {
        include: { enrollments: { include: { course: true } }, teacher: { include: { user: true } } },
      },
    },
  });
  const student = user.student!;

  const courseNames = student.enrollments.map((e) => e.course.name);
  const details = [
    ...(courseNames.length > 0
      ? [{ label: courseNames.length > 1 ? "Courses" : "Course", value: courseNames.join(", ") }]
      : []),
    ...(student.teacher ? [{ label: "Teacher", value: student.teacher.user.name }] : []),
  ];

  sendAccountCreatedEmail({
    to: email,
    name,
    role: "STUDENT",
    email,
    password: tempPassword,
    details,
  }).catch((error) => {
    console.error("Failed to send account-created email", error);
  });

  notifyStaff("STUDENT_JOINED", `New student joined: ${name}`, `/admin/students/${student.id}`).catch(
    (error) => {
      console.error("Failed to create student-joined notification", error);
    }
  );

  return NextResponse.json({
    student: {
      ...student,
      courseIds: student.enrollments.map((e) => e.courseId),
      courseNames,
    },
  });
}
