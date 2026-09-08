import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { notifyStaff } from "@/lib/system-notifications";
import {
  requireEmail,
  requireString,
  type FieldErrors,
} from "@/lib/validation";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(`contact:${getClientIp(request)}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = requireString(
    errors,
    "name",
    data.name,
    "Full name",
    {
      min: 2,
      max: 100,
    }
  );

  const email = requireEmail(
    errors,
    "email",
    data.email
  );

  const subject = requireString(
    errors,
    "subject",
    data.subject,
    "Subject",
    {
      min: 2,
      max: 150,
    }
  );

  const message = requireString(
    errors,
    "message",
    data.message,
    "Message",
    {
      min: 10,
      max: 3000,
    }
  );

  // Validation errors
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { errors },
      { status: 422 }
    );
  }

  await prisma.lead.create({
    data: {
      name,
      email,
      message: `${subject}\n\n${message}`,
      source: "CONTACT",
    },
  });

  notifyStaff("NEW_LEAD", `New contact message: ${name} — ${subject}`, "/admin/leads").catch(
    (error) => {
      console.error("Failed to create new-lead notification", error);
    }
  );

  try {
    await sendNotificationEmail({
      type: "contact",
      subject: `📩 New Contact Message — ${subject} — ${name}`,
      replyTo: email,
      lines: [
        { label: "Name", value: name },
        { label: "Email", value: email },
        { label: "Subject", value: subject },
        { label: "Message", value: message },
      ],
    });
  } catch (error) {
    console.error(
      "Failed to send contact form email",
      error
    );
    // The lead is already saved, so don't fail the request over the email.
  }

  return NextResponse.json({
    ok: true,
  });
}