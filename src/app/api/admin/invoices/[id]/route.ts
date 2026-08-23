import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { notFound } from "@/lib/api-errors";
import { notifyStaff } from "@/lib/system-notifications";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["PAID", "PENDING", "OVERDUE", "PARTIAL"] as const;

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return notFound("Invoice not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const status = typeof data.status === "string" ? data.status : existing.status;
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    errors.status = "Select a valid status.";
  }

  const amountPaid =
    typeof data.amountPaid === "string" ? data.amountPaid.trim() || null : existing.amountPaid;

  let dueDate = existing.dueDate;
  if (typeof data.dueDate === "string") {
    if (!data.dueDate) {
      dueDate = null;
    } else {
      const parsed = new Date(data.dueDate);
      if (Number.isNaN(parsed.getTime())) {
        errors.dueDate = "Enter a valid due date.";
      } else {
        dueDate = parsed;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      status: status as (typeof VALID_STATUSES)[number],
      amountPaid,
      dueDate,
    },
    include: { student: { select: { id: true, name: true, email: true } } },
  });

  if (status === "PAID" && existing.status !== "PAID") {
    notifyStaff(
      "PAYMENT_RECEIVED",
      `Payment received: ${invoice.amount} from ${invoice.student.name}`,
      `/admin/invoices`
    ).catch((error) => {
      console.error("Failed to create payment-received notification", error);
    });
  }

  return NextResponse.json({ invoice });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return notFound("Invoice not found.");

  await prisma.invoice.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
