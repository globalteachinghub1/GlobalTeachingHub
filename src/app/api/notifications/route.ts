import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const RECENT_LIMIT = 30;

export async function GET() {
  const auth = await requireRole(["ADMIN", "TEACHER", "STAFF"]);
  if (auth instanceof NextResponse) return auth;

  const notifications = await prisma.systemNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: RECENT_LIMIT,
  });

  const items = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    link: n.link,
    createdAt: n.createdAt,
    isRead: n.readBy.includes(auth.sub),
  }));

  return NextResponse.json({
    notifications: items,
    unreadCount: items.filter((n) => !n.isRead).length,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER", "STAFF"]);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  if (data.all === true) {
    const unread = await prisma.systemNotification.findMany({
      where: { NOT: { readBy: { has: auth.sub } } },
      select: { id: true, readBy: true },
      take: RECENT_LIMIT,
    });
    await Promise.all(
      unread.map((n) =>
        prisma.systemNotification.update({
          where: { id: n.id },
          data: { readBy: { set: [...n.readBy, auth.sub] } },
        })
      )
    );
    return NextResponse.json({ ok: true });
  }

  const id = typeof data.id === "string" ? data.id : "";
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const existing = await prisma.systemNotification.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  if (!existing.readBy.includes(auth.sub)) {
    await prisma.systemNotification.update({
      where: { id },
      data: { readBy: { set: [...existing.readBy, auth.sub] } },
    });
  }

  return NextResponse.json({ ok: true });
}
