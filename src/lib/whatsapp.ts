import twilio from "twilio";
import { SITE_URL } from "@/lib/seo";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error(
      "WhatsApp is not configured: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local"
    );
  }

  return twilio(sid, token);
}

function getFromNumber() {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    throw new Error("WhatsApp is not configured: set TWILIO_WHATSAPP_FROM in .env.local");
  }
  return from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
}

function toWhatsAppAddress(number: string) {
  return number.startsWith("whatsapp:") ? number : `whatsapp:${number}`;
}

export async function sendWhatsAppMessage({
  to,
  body,
  mediaUrl,
}: {
  to: string;
  body: string;
  mediaUrl?: string;
}) {
  const client = getClient();
  await client.messages.create({
    from: getFromNumber(),
    to: toWhatsAppAddress(to),
    body,
    ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
  });
}

function getSiteUrl() {
  return SITE_URL;
}

export async function sendInvoiceGeneratedWhatsApp({
  to,
  invoiceId,
  invoiceNumber,
  amount,
}: {
  to: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: string;
}) {
  await sendWhatsAppMessage({
    to,
    body: `Your invoice ${invoiceNumber} for ${amount} has been generated. View it here: ${getSiteUrl()}/api/invoices/${invoiceId}/pdf`,
    mediaUrl: `${getSiteUrl()}/api/invoices/${invoiceId}/pdf`,
  });
}

export async function sendPaymentReminderWhatsApp({
  to,
  invoiceNumber,
  amount,
  dueDate,
}: {
  to: string;
  invoiceNumber: string;
  amount: string;
  dueDate: Date | null;
}) {
  const dueText = dueDate ? ` due ${dueDate.toLocaleDateString()}` : "";
  await sendWhatsAppMessage({
    to,
    body: `Reminder: invoice ${invoiceNumber} for ${amount}${dueText} is still unpaid. Please arrange payment at your earliest convenience.`,
  });
}

export async function sendWeeklyReportWhatsApp({
  to,
  studentName,
  courseName,
  presentCount,
  totalCount,
  topicsCovered,
}: {
  to: string;
  studentName: string;
  courseName: string;
  presentCount: number;
  totalCount: number;
  topicsCovered: string;
}) {
  await sendWhatsAppMessage({
    to,
    body: `Weekly ${courseName} report for ${studentName}: attended ${presentCount}/${totalCount} classes. Topics covered: ${topicsCovered}`,
  });
}

export async function sendMonthlyReportWhatsApp({
  to,
  studentName,
  courseName,
  attendancePercent,
  performanceSummary,
}: {
  to: string;
  studentName: string;
  courseName: string;
  attendancePercent: number;
  performanceSummary: string;
}) {
  await sendWhatsAppMessage({
    to,
    body: `Monthly ${courseName} report for ${studentName}: ${attendancePercent}% attendance. ${performanceSummary}`,
  });
}
