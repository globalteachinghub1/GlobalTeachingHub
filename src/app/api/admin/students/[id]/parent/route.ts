import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { sendAccountCreatedEmail } from "@/lib/mailer";
import { requireEmail, requireString, type FieldErrors } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return notFound("Student not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const errors: FieldErrors = {};
  const name = requireString(errors, "name", data.name, "Parent name", { min: 2, max: 100 });
  const email = requireEmail(errors, "email", data.email);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, include: { parent: true } });

  if (existingUser && existingUser.role !== "PARENT") {
    return NextResponse.json(
      { errors: { email: "This email already belongs to a non-parent account." } },
      { status: 422 }
    );
  }

  if (existingUser?.parent) {
    // Existing parent account — just link them to this student too.
    const parent = await prisma.parent.update({
      where: { id: existingUser.parent.id },
      data: { students: { connect: { id: student.id } } },
      include: { user: { select: { name: true, email: true } } },
    });
    return NextResponse.json({
      parent: { id: parent.id, name: parent.user.name, email: parent.user.email },
    });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "PARENT",
      parent: { create: { students: { connect: { id: student.id } } } },
    },
    include: { parent: true },
  });

  sendAccountCreatedEmail({
    to: email,
    name,
    role: "PARENT",
    email,
    password: tempPassword,
    details: [{ label: "Linked Student", value: student.name }],
  }).catch((error) => {
    console.error("Failed to send parent account-created email", error);
  });

  return NextResponse.json({
    parent: { id: user.parent!.id, name: user.name, email: user.email },
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return notFound("Student not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const parentId = typeof data.parentId === "string" ? data.parentId : "";
  if (!parentId) {
    return NextResponse.json({ error: "parentId is required." }, { status: 400 });
  }

  await prisma.parent.update({
    where: { id: parentId },
    data: { students: { disconnect: { id: student.id } } },
  });

  return NextResponse.json({ ok: true });
}
