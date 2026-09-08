import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { requireEmail, requireString, type FieldErrors } from "@/lib/validation";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(`login:${getClientIp(request)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
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

  const email = requireEmail(errors, "email", data.email);
  const password = requireString(errors, "password", data.password, "Password", {
    min: 1,
    max: 200,
  });

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({ sub: user.id, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, role: user.role });
}
