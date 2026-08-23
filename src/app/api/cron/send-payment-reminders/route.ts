import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronRequest } from "@/lib/cron-auth";
import { sendPaymentReminderEmail } from "@/lib/mailer";
import { sendPaymentReminderWhatsApp } from "@/lib/whatsapp";

const REMINDER_WINDOW_DAYS = 3;

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET(request: Request) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const today = startOfDayUTC(new Date());
  const windowEnd = new Date(today);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + REMINDER_WINDOW_DAYS);

  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL"] },
      dueDate: { gte: today, lte: windowEnd },
    },
    include: { student: true },
  });

  let reminded = 0;
  for (const invoice of invoices) {
    const alreadyRemindedToday = await prisma.notification.findFirst({
      where: { studentId: invoice.studentId, type: "PAYMENT_REMINDER", date: { gte: today } },
    });
    if (alreadyRemindedToday) continue;

    const { student } = invoice;

    await prisma.notification.create({
      data: {
        studentId: student.id,
        type: "PAYMENT_REMINDER",
        message: `Invoice ${invoice.invoiceNumber} (${invoice.amount}) is due soon.`,
        params: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount },
      },
    });

    sendPaymentReminderEmail({
      to: student.email,
      studentName: student.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
    }).catch((error) => {
      console.error("Failed to send payment reminder email", error);
    });

    if (student.whatsapp) {
      sendPaymentReminderWhatsApp({
        to: student.whatsapp,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
      }).catch((error) => {
        console.error("Failed to send payment reminder WhatsApp message", error);
      });
    }

    reminded += 1;
  }

  return NextResponse.json({ invoicesChecked: invoices.length, remindersSent: reminded });
}
