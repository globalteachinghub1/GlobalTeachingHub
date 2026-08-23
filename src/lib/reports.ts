import { prisma } from "@/lib/prisma";
import { sendMonthlyReportEmail, sendWeeklyReportEmail } from "@/lib/mailer";
import { sendMonthlyReportWhatsApp, sendWeeklyReportWhatsApp } from "@/lib/whatsapp";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Generates (or regenerates) the weekly report for one course enrollment, for the 7-day range starting at weekStart. */
export async function generateWeeklyReport(enrollmentId: string, weekStart: Date) {
  const start = startOfDayUTC(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const rangeEndExclusive = new Date(end);
  rangeEndExclusive.setUTCDate(rangeEndExclusive.getUTCDate() + 1);

  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { student: true, course: true },
  });
  const { student, course } = enrollment;

  const [attendance, latestNote] = await Promise.all([
    prisma.attendance.findMany({
      where: { enrollmentId, date: { gte: start, lt: rangeEndExclusive } },
      orderBy: { date: "asc" },
    }),
    prisma.progressNote.findFirst({
      where: { studentId: student.id, date: { gte: start, lt: rangeEndExclusive } },
      orderBy: { date: "desc" },
    }),
  ]);

  const presentCount = attendance.filter((a) => a.present).length;
  const totalCount = attendance.length;
  const topics = attendance
    .map((a) => a.lessonRemarks)
    .filter((v): v is string => !!v);
  const topicsCovered =
    topics.length > 0 ? topics.join("; ") : "No lesson remarks recorded this week.";

  const existing = await prisma.weeklyReport.findFirst({
    where: { enrollmentId, weekStart: start },
  });

  const data = {
    enrollmentId,
    weekStart: start,
    weekEnd: end,
    presentCount,
    totalCount,
    topicsCovered,
    teacherRemarks: latestNote?.note ?? null,
  };

  const report = existing
    ? await prisma.weeklyReport.update({ where: { id: existing.id }, data })
    : await prisma.weeklyReport.create({ data });

  await prisma.notification.create({
    data: {
      studentId: student.id,
      type: "WEEKLY_REPORT",
      message: `Your weekly report for ${course.name} (week of ${start.toLocaleDateString()}) is ready.`,
      params: { courseId: course.id, weekStart: start.toISOString() },
    },
  });

  sendWeeklyReportEmail({
    to: student.email,
    studentName: student.name,
    courseName: course.name,
    weekStart: start,
    weekEnd: end,
    presentCount,
    totalCount,
    topicsCovered,
    teacherRemarks: report.teacherRemarks,
  })
    .then(() => prisma.weeklyReport.update({ where: { id: report.id }, data: { sentEmail: true } }))
    .catch((error) => {
      console.error("Failed to send weekly report email", error);
    });

  if (student.whatsapp) {
    sendWeeklyReportWhatsApp({
      to: student.whatsapp,
      studentName: student.name,
      courseName: course.name,
      presentCount,
      totalCount,
      topicsCovered,
    })
      .then(() =>
        prisma.weeklyReport.update({ where: { id: report.id }, data: { sentWhatsapp: true } })
      )
      .catch((error) => {
        console.error("Failed to send weekly report WhatsApp message", error);
      });
  }

  return report;
}

/** Generates (or regenerates) the monthly report for one course enrollment, for the given calendar month (1-12). */
export async function generateMonthlyReport(enrollmentId: string, month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { student: true, course: true },
  });
  const { student, course } = enrollment;

  const [attendance, latestNote] = await Promise.all([
    prisma.attendance.findMany({ where: { enrollmentId, date: { gte: start, lt: end } } }),
    prisma.progressNote.findFirst({
      where: { studentId: student.id, date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
    }),
  ]);

  const presentCount = attendance.filter((a) => a.present).length;
  const totalCount = attendance.length;
  const attendancePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 1000) / 10 : 0;

  const performanceSummary = `${student.name} is at ${student.progress}% progress in ${course.name} (${student.level.toLowerCase()} level) with ${presentCount}/${totalCount} classes attended this month.`;

  const report = await prisma.monthlyReport.upsert({
    where: { enrollmentId_month_year: { enrollmentId, month, year } },
    update: { attendancePercent, performanceSummary, teacherRemarks: latestNote?.note ?? null },
    create: {
      enrollmentId,
      month,
      year,
      attendancePercent,
      performanceSummary,
      teacherRemarks: latestNote?.note ?? null,
    },
  });

  const monthName = MONTH_NAMES[month - 1];

  await prisma.notification.create({
    data: {
      studentId: student.id,
      type: "MONTHLY_REPORT",
      message: `Your monthly report for ${course.name} (${monthName} ${year}) is ready.`,
      params: { courseId: course.id, month, year },
    },
  });

  sendMonthlyReportEmail({
    to: student.email,
    studentName: student.name,
    courseName: course.name,
    month: monthName,
    year,
    attendancePercent,
    performanceSummary,
    teacherRemarks: report.teacherRemarks,
  })
    .then(() => prisma.monthlyReport.update({ where: { id: report.id }, data: { sentEmail: true } }))
    .catch((error) => {
      console.error("Failed to send monthly report email", error);
    });

  if (student.whatsapp) {
    sendMonthlyReportWhatsApp({
      to: student.whatsapp,
      studentName: student.name,
      courseName: course.name,
      attendancePercent,
      performanceSummary,
    })
      .then(() =>
        prisma.monthlyReport.update({ where: { id: report.id }, data: { sentWhatsapp: true } })
      )
      .catch((error) => {
        console.error("Failed to send monthly report WhatsApp message", error);
      });
  }

  return report;
}
