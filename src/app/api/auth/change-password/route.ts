import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { unauthorized } from "@/lib/api-errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requirePassword, type FieldErrors } from "@/lib/validation";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  // Changing your own password is sensitive — throttle brute-force guesses
  // at the current password, per account rather than per IP.
  const limited = rateLimit(`change-password:${session.sub}:${getClientIp(request)}`, {
    limit: 8,
    windowMs: 15 * 60 * 1000,
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

  const currentPassword = requirePassword(
    errors,
    "currentPassword",
    data.currentPassword,
    "Current password"
  );
  const newPassword = requirePassword(errors, "newPassword", data.newPassword, "New password");

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return unauthorized();

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json(
      { errors: { currentPassword: "Current password is incorrect." } },
      { status: 422 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { errors: { newPassword: "New password must be different from your current password." } },
      { status: 422 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
