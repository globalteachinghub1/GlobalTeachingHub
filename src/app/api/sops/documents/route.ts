import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { requireString, type FieldErrors } from "@/lib/validation";
import { notifyStaff } from "@/lib/system-notifications";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN", "TEACHER", "STAFF"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") || undefined;

  const documents = await prisma.sopDocument.findMany({
    where: {
      categoryId,
      // Teachers/Staff only see published SOPs; Admin sees the full workflow.
      status: auth.role === "ADMIN" ? undefined : "APPROVED",
    },
    include: { category: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    documents: documents.map((d) => ({
      id: d.id,
      categoryId: d.categoryId,
      categoryName: d.category.name,
      title: d.title,
      description: d.description,
      fileUrl: d.fileUrl,
      version: d.version,
      status: d.status,
      createdByName: d.createdBy.name,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
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

  const title = requireString(errors, "title", data.title, "Title", { min: 2, max: 150 });
  const fileUrl = requireString(errors, "fileUrl", data.fileUrl, "File URL", { min: 4, max: 2000 });
  const categoryId = typeof data.categoryId === "string" ? data.categoryId : "";
  if (!categoryId) errors.categoryId = "Select a category.";
  const description =
    typeof data.description === "string" ? data.description.trim() || null : null;
  const status =
    typeof data.status === "string" && (VALID_STATUSES as readonly string[]).includes(data.status)
      ? (data.status as (typeof VALID_STATUSES)[number])
      : "PENDING";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const category = await prisma.sopCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ errors: { categoryId: "Select a valid category." } }, { status: 422 });
  }

  const document = await prisma.sopDocument.create({
    data: { categoryId, title, description, fileUrl, status, createdById: auth.sub },
    include: { category: true, createdBy: { select: { name: true } } },
  });

  if (status === "APPROVED") {
    notifyStaff("SOP_PUBLISHED", `New SOP published: ${title}`, "/teacher/sops").catch((error) => {
      console.error("Failed to create SOP-published notification", error);
    });
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
