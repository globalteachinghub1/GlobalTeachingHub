import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { requireEmail, type FieldErrors } from "@/lib/validation";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function getSiteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  const limited = rateLimit(`forgot-password:${getClientIp(request)}`, {
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
  const email = requireEmail(errors, "email", data.email);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way whether or not the account exists, so the
  // form can't be used to enumerate registered emails.
  if (user) {
    const { token, tokenHash, expiresAt } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`;
    sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl }).catch((error) => {
      console.error("Failed to send password reset email", error);
    });
  }

  return NextResponse.json({ ok: true });
}
