import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { requireString, type FieldErrors } from "@/lib/validation";
import { notifyStaff } from "@/lib/system-notifications";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.sopDocument.findUnique({ where: { id } });
  if (!existing) return notFound("SOP document not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  const title =
    data.title !== undefined
      ? requireString(errors, "title", data.title, "Title", { min: 2, max: 150 })
      : existing.title;
  const fileUrl =
    data.fileUrl !== undefined
      ? requireString(errors, "fileUrl", data.fileUrl, "File URL", { min: 4, max: 2000 })
      : existing.fileUrl;
  const description =
    typeof data.description === "string" ? data.description.trim() || null : existing.description;
  const status =
    typeof data.status === "string" && (VALID_STATUSES as readonly string[]).includes(data.status)
      ? (data.status as (typeof VALID_STATUSES)[number])
      : existing.status;
  const bumpVersion = data.bumpVersion === true;

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const document = await prisma.sopDocument.update({
    where: { id },
    data: {
      title,
      fileUrl,
      description,
      status,
      version: bumpVersion ? existing.version + 1 : existing.version,
    },
    include: { category: true, createdBy: { select: { name: true } } },
  });

  if (status === "APPROVED" && existing.status !== "APPROVED") {
    notifyStaff("SOP_PUBLISHED", `New SOP published: ${document.title}`, "/teacher/sops").catch(
      (error) => {
        console.error("Failed to create SOP-published notification", error);
      }
    );
  }

  return NextResponse.json({
    document: {
      id: document.id,
      categoryId: document.categoryId,
      categoryName: document.category.name,
      title: document.title,
      description: document.description,
      fileUrl: document.fileUrl,
      version: document.version,
      status: document.status,
      createdByName: document.createdBy.name,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.sopDocument.findUnique({ where: { id } });
  if (!existing) return notFound("SOP document not found.");

  await prisma.sopDocument.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
