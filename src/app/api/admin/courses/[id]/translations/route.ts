import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { requireString, type FieldErrors } from "@/lib/validation";
import { routing } from "@/i18n/routing";

type Params = { params: Promise<{ id: string }> };

const TRANSLATABLE_LOCALES = routing.locales.filter((l) => l !== routing.defaultLocale);

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return notFound("Course not found.");

  const translations = await prisma.courseTranslation.findMany({ where: { courseId: id } });

  return NextResponse.json({
    translations: translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      summary: t.summary,
      description: t.description,
      topics: t.topics,
    })),
  });
}

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return notFound("Course not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const locale = typeof data.locale === "string" ? data.locale : "";
  if (!(TRANSLATABLE_LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  const errors: FieldErrors = {};
  const name = requireString(errors, "name", data.name, "Course name", { min: 2, max: 100 });
  const summary = requireString(errors, "summary", data.summary, "Summary", {
    min: 10,
    max: 1000,
  });
  const description =
    typeof data.description === "string" ? data.description.trim() || null : null;
  const topics = Array.isArray(data.topics)
    ? data.topics
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim())
    : [];

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const translation = await prisma.courseTranslation.upsert({
    where: { courseId_locale: { courseId: id, locale } },
    update: { name, summary, description, topics },
    create: { courseId: id, locale, name, summary, description, topics },
  });

  return NextResponse.json({
    translation: {
      locale: translation.locale,
      name: translation.name,
      summary: translation.summary,
      description: translation.description,
      topics: translation.topics,
    },
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return notFound("Course not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const locale = typeof data.locale === "string" ? data.locale : "";
  if (!(TRANSLATABLE_LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  await prisma.courseTranslation.deleteMany({ where: { courseId: id, locale } });

  return NextResponse.json({ ok: true });
}
