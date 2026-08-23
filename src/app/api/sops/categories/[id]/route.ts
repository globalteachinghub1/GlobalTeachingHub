import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { requireString, type FieldErrors } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.sopCategory.findUnique({ where: { id } });
  if (!existing) return notFound("Category not found.");

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

  const category = await prisma.sopCategory.update({ where: { id }, data: { name } });

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.sopCategory.findUnique({ where: { id } });
  if (!existing) return notFound("Category not found.");

  await prisma.sopCategory.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
