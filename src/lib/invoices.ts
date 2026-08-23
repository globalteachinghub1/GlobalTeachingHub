import { prisma } from "@/lib/prisma";
import { sendInvoiceGeneratedEmail } from "@/lib/mailer";
import { sendInvoiceGeneratedWhatsApp } from "@/lib/whatsapp";

/**
 * Sequential per-year invoice numbers (INV-<year>-0001). Generated inside
 * the caller's request so two concurrent creates in the same year both see
 * an up-to-date count; a true guarantee against races would need a DB
 * sequence, but invoice creation here is admin/cron-triggered, not
 * high-concurrency user traffic.
 */
export async function generateInvoiceNumber(year = new Date().getFullYear()) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const count = await prisma.invoice.count({
    where: { date: { gte: start, lt: end } },
  });
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

export type InvoiceStatusValue = "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";

/**
 * Creates an invoice, logs an in-app notification, and fires the
 * invoice-generated email/WhatsApp notifications. Shared by the admin
 * "Create Invoice" route and the monthly auto-generate cron job so both
 * paths stay in sync.
 */
export async function createInvoiceForStudent({
  studentId,
  description,
  amount,
  dueDate,
  status = "PENDING",
}: {
  studentId: string;
  description: string;
  amount: string;
  dueDate: Date | null;
  status?: InvoiceStatusValue;
}) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return null;

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: { invoiceNumber, studentId, description, amount, dueDate, status },
    include: { student: { select: { id: true, name: true, email: true } } },
  });

  await prisma.notification.create({
    data: {
      studentId,
      type: "INVOICE_GENERATED",
      message: `Invoice ${invoiceNumber} (${amount}) has been generated.`,
      params: { invoiceNumber, amount },
    },
  });

  sendInvoiceGeneratedEmail({
    to: student.email,
    studentName: student.name,
    invoiceNumber,
    amount,
    dueDate,
  }).catch((error) => {
    console.error("Failed to send invoice-generated email", error);
  });

  if (student.whatsapp) {
    sendInvoiceGeneratedWhatsApp({
      to: student.whatsapp,
      invoiceId: invoice.id,
      invoiceNumber,
      amount,
    }).catch((error) => {
      console.error("Failed to send invoice-generated WhatsApp message", error);
    });
  }

  return invoice;
}
