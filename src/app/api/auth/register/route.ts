import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { sendAccountCreatedEmail } from "@/lib/mailer";
import {
  requireEmail,
  requirePassword,
  requireString,
  type FieldErrors,
} from "@/lib/validation";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(`register:${getClientIp(request)}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

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
  const password = requirePassword(errors, "password", data.password);

  const phone = typeof data.phone === "string" ? data.phone.trim() || null : null;
  const whatsapp = typeof data.whatsapp === "string" ? data.whatsapp.trim() || null : null;
  const parentName = typeof data.parentName === "string" ? data.parentName.trim() || null : null;
  const parentContact =
    typeof data.parentContact === "string" ? data.parentContact.trim() || null : null;

  const courseIds = Array.isArray(data.courseIds)
    ? data.courseIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (courseIds.length === 0) {
    errors.courseIds = "Select at least one course to enroll in.";
  }

  if (data.acceptedTerms !== true) {
    errors.acceptedTerms = "You must accept the Terms & Conditions to continue.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const validCourses = await prisma.course.findMany({ where: { id: { in: courseIds } } });
  if (validCourses.length !== courseIds.length) {
    return NextResponse.json(
      { errors: { courseIds: "Select valid courses." } },
      { status: 422 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { errors: { email: "An account with this email already exists." } },
      { status: 422 }
    );
  }

  const passwordHash = await hashPassword(password);

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
          enrollments: { create: courseIds.map((courseId) => ({ courseId })) },
        },
      },
    },
  });

  const token = await createSessionToken({ sub: user.id, role: user.role });
  await setSessionCookie(token);

  // Don't let a flaky email provider block registration — the account
  // is already created and usable regardless of whether this succeeds.
  sendAccountCreatedEmail({
    to: email,
    name,
    role: "STUDENT",
    email,
    details: [
      {
        label: validCourses.length > 1 ? "Courses" : "Course",
        value: validCourses.map((c) => c.name).join(", "),
      },
    ],
  }).catch((error) => {
    console.error("Failed to send account-created email", error);
  });

  return NextResponse.json({ ok: true, role: user.role });
}
