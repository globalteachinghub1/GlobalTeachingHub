import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { getOrCreateThread } from "@/lib/messaging";

type Params = { params: Promise<{ id: string }> };

async function getOwnStudent(userId: string, studentId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) return null;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { parents: { include: { user: true } } },
  });
  if (!student || student.teacherId !== teacher.id) return null;
  return student;
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireRole("TEACHER");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const student = await getOwnStudent(auth.sub, id);
  if (!student) return notFound("Student not found.");

  const parents = student.parents.map((p) => ({ id: p.id, name: p.user.name }));
  const parentId = new URL(request.url).searchParams.get("parentId") || parents[0]?.id;

  if (!parentId || !parents.some((p) => p.id === parentId)) {
    return NextResponse.json({ parents, messages: [] });
  }

  const thread = await prisma.messageThread.findUnique({
    where: { studentId_parentId: { studentId: id, parentId } },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { sender: true } } },
  });

  return NextResponse.json({
    parents,
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
  const auth = await requireRole("TEACHER");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const student = await getOwnStudent(auth.sub, id);
  if (!student) return notFound("Student not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const parentId = typeof data.parentId === "string" ? data.parentId : "";
  const text = typeof data.body === "string" ? data.body.trim() : "";

  if (!student.parents.some((p) => p.id === parentId)) {
    return NextResponse.json({ errors: { parentId: "Select a valid parent." } }, { status: 422 });
  }
  if (!text) {
    return NextResponse.json({ errors: { body: "Message can't be empty." } }, { status: 422 });
  }

  const thread = await getOrCreateThread(id, parentId);
  const message = await prisma.message.create({
    data: { threadId: thread.id, senderId: auth.sub, body: text },
    include: { sender: true },
  });

  prisma.notification
    .create({
      data: {
        studentId: id,
        type: "GENERAL",
        message: "You have a new message from your teaching team.",
      },
    })
    .catch((error) => {
      console.error("Failed to create new-message student notification", error);
    });

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      fromParent: false,
      senderName: message.sender.name,
    },
  });
}
