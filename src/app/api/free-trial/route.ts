import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { notifyStaff } from "@/lib/system-notifications";
import {
  requireEmail,
  requirePhone,
  requireString,
  type FieldErrors,
} from "@/lib/validation";

export async function POST(request: Request) {
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
  const phone = requirePhone(errors, "phone", data.phone);
  const email = requireEmail(errors, "email", data.email);
  const courseId = requireString(errors, "course", data.courseId, "Course", {
    min: 1,
    max: 100,
  });

  let matchedCourse: { id: string; name: string } | null = null;
  if (courseId) {
    matchedCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, name: true },
    });
    if (!matchedCourse) errors.course = "Select a valid course.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  await prisma.lead.create({
    data: {
      name,
      email,
      phone,
      courseId: matchedCourse?.id ?? null,
      source: "FREE_TRIAL",
    },
  });

  const courseName = matchedCourse!.name;

  notifyStaff("NEW_LEAD", `New free trial lead: ${name} (${courseName})`, "/admin/leads").catch(
    (error) => {
      console.error("Failed to create new-lead notification", error);
    }
  );

  try {
    await sendNotificationEmail({
      type: "demo",
      subject: `🎓 New Free Demo Request — ${courseName} — ${name}`,
      replyTo: email,
      lines: [
        { label: "Name", value: name },
        { label: "Phone / WhatsApp", value: phone },
        { label: "Email", value: email },
        { label: "Course", value: courseName },
      ],
    });
  } catch (error) {
    console.error("Failed to send free trial email", error);
    // The lead is already saved, so don't fail the request over the email.
  }

  return NextResponse.json({ ok: true });
}
