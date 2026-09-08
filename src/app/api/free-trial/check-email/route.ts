import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(`free-trial-check-email:${getClientIp(request)}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  const email = new URL(request.url).searchParams.get("email")?.trim() ?? "";
  if (!email) return NextResponse.json({ exists: false });

  const existing = await prisma.lead.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  return NextResponse.json({ exists: !!existing });
}
