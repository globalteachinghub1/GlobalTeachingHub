import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { getOrCreateThread } from "@/lib/messaging";
import { notifyStaff } from "@/lib/system-notifications";

type Params = { params: Promise<{ studentId: string }> };

async function getOwnParentAndStudent(userId: string, studentId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: { students: { where: { id: studentId } } },
  });
  if (!parent || parent.students.length === 0) return null;
  return { parent, student: parent.students[0] };
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireRole("PARENT");
  if (auth instanceof NextResponse) return auth;

  const { studentId } = await params;
  const owned = await getOwnParentAndStudent(auth.sub, studentId);
  if (!owned) return notFound("Student not found.");

  const thread = await prisma.messageThread.findUnique({
    where: { studentId_parentId: { studentId, parentId: owned.parent.id } },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { sender: true } } },
  });

  return NextResponse.json({
    messages: (thread?.messages ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      fromParent: m.sender.role === "PARENT",
      senderName: m.sender.name,
    })),
  });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireRole("PARENT");
  if (auth instanceof NextResponse) return auth;

  const { studentId } = await params;
  const owned = await getOwnParentAndStudent(auth.sub, studentId);
  if (!owned) return notFound("Student not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const text = typeof data.body === "string" ? data.body.trim() : "";
  if (!text) {
    return NextResponse.json({ errors: { body: "Message can't be empty." } }, { status: 422 });
  }

  const thread = await getOrCreateThread(studentId, owned.parent.id);
  const message = await prisma.message.create({
    data: { threadId: thread.id, senderId: auth.sub, body: text },
    include: { sender: true },
  });

  notifyStaff(
    "GENERAL",
    `New message from ${message.sender.name} about ${owned.student.name}`,
    `/admin/students/${studentId}`
  ).catch((error) => {
    console.error("Failed to create new-message staff notification", error);
  });

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      fromParent: true,
      senderName: message.sender.name,
    },
  });
}
