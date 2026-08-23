import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { requireString, type FieldErrors } from "@/lib/validation";

export async function GET() {
  const auth = await requireRole(["ADMIN", "TEACHER", "STAFF"]);
  if (auth instanceof NextResponse) return auth;

  const categories = await prisma.sopCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      documentCount: c._count.documents,
      createdAt: c.createdAt,
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
  const name = requireString(errors, "name", data.name, "Category name", { min: 2, max: 100 });

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const existing = await prisma.sopCategory.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { errors: { name: "A category with this name already exists." } },
      { status: 422 }
    );
  }

  const category = await prisma.sopCategory.create({ data: { name } });

  return NextResponse.json({ category });
}
