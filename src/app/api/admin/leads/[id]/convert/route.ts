import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { sendAccountCreatedEmail } from "@/lib/mailer";
import { notifyStaff } from "@/lib/system-notifications";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return notFound("Lead not found.");

  const [existingStudent, existingUser] = await Promise.all([
    prisma.student.findUnique({ where: { email: lead.email } }),
    prisma.user.findUnique({ where: { email: lead.email } }),
  ]);
  if (existingStudent || existingUser) {
    return NextResponse.json(
      { error: "A student or account with this email already exists." },
      { status: 422 }
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name: lead.name,
      email: lead.email,
      passwordHash,
      role: "STUDENT",
      student: {
        create: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          enrollments: lead.courseId ? { create: [{ courseId: lead.courseId }] } : undefined,
          level: "BEGINNER",
          progress: 0,
          status: "ACTIVE",
        },
      },
    },
    include: {
      student: { include: { enrollments: { include: { course: true } } } },
    },
  });
  const student = user.student!;

  await prisma.lead.update({ where: { id }, data: { stage: "ENROLLED" } });

  const courseNames = student.enrollments.map((e) => e.course.name);

  sendAccountCreatedEmail({
    to: lead.email,
    name: lead.name,
    role: "STUDENT",
    email: lead.email,
    password: tempPassword,
    details: courseNames.length
      ? [{ label: courseNames.length > 1 ? "Courses" : "Course", value: courseNames.join(", ") }]
      : [],
  }).catch((error) => {
    console.error("Failed to send account-created email", error);
  });

  notifyStaff("STUDENT_JOINED", `New student joined: ${lead.name}`, `/admin/students/${student.id}`).catch(
    (error) => {
      console.error("Failed to create student-joined notification", error);
    }
  );

  return NextResponse.json({
    student: { ...student, courseIds: student.enrollments.map((e) => e.courseId), courseNames },
  });
}
