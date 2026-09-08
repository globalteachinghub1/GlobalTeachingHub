import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { requireString, type FieldErrors } from "@/lib/validation";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { enrollments: true, teachers: true } } },
  });

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      summary: c.summary,
      topics: c.topics,
      outcomes: c.outcomes,
      priceNote: c.priceNote,
      color: c.color,
      icon: c.icon,
      studentCount: c._count.enrollments,
      teacherCount: c._count.teachers,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = requireString(errors, "name", data.name, "Course name", {
    min: 2,
    max: 100,
  });
  const summary = requireString(errors, "summary", data.summary, "Summary", {
    min: 10,
    max: 1000,
  });
  const description =
    typeof data.description === "string" ? data.description.trim() || null : null;
  const color = typeof data.color === "string" && data.color ? data.color : "text-teal-600 bg-teal-100";
  const icon = typeof data.icon === "string" && data.icon ? data.icon : "BookOpen";
  const topics = Array.isArray(data.topics)
    ? data.topics.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    : [];
  const outcomes = Array.isArray(data.outcomes)
    ? data.outcomes.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    : [];
  const priceNote = typeof data.priceNote === "string" ? data.priceNote.trim() || null : null;

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const baseSlug = slugify(name) || "course";
  let slug = baseSlug;
  let suffix = 2;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const course = await prisma.course.create({
    data: { slug, name, description, summary, topics, outcomes, priceNote, color, icon },
  });

  return NextResponse.json({
    course: {
      id: course.id,
      slug: course.slug,
      name: course.name,
      description: course.description,
      summary: course.summary,
      topics: course.topics,
      outcomes: course.outcomes,
      priceNote: course.priceNote,
      color: course.color,
      icon: course.icon,
      studentCount: 0,
      teacherCount: 0,
    },
  });
}
