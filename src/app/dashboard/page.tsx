"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarClock,
  ClipboardList,
  MessageSquareText,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { getIconComponent } from "@/lib/course-icons";
import { ProgressRing } from "@/components/dashboard/progress-ring";

type Invoice = { id: string; description: string; amount: string; date: string; status: string };
type Notification = { id: string; message: string; date: string };
type Note = { id: string; note: string; date: string };
type AssignmentEntry = {
  id: string;
  courseName: string;
  title: string;
  description: string | null;
  dueDate: string | null;
};
type AttendanceEntry = { id: string; date: string; present: boolean };
type CourseSummary = {
  id: string;
  slug: string;
  name: string;
  color: string;
  icon: string;
  classStartTime: string | null;
  classEndTime: string | null;
  classDays: string[];
  attendance: AttendanceEntry[];
};
type StudentMe = {
  name: string;
  courses: CourseSummary[];
  progress: number;
  invoices: Invoice[];
  notifications: Notification[];
  notes: Note[];
  assignments: AssignmentEntry[];
} | null;

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** Next occurrence of a weekly-recurring class from `now`, or null if the course has no schedule. */
function nextClassDate(course: CourseSummary, now: Date): Date | null {
  if (course.classDays.length === 0 || !course.classStartTime) return null;
  const [hour, minute] = course.classStartTime.split(":").map(Number);

  let soonest: Date | null = null;
  for (const day of course.classDays) {
    const targetDow = DAY_INDEX[day];
    if (targetDow === undefined) continue;
    const candidate = new Date(now);
    candidate.setHours(hour, minute, 0, 0);
    let daysAhead = (targetDow - now.getDay() + 7) % 7;
    if (daysAhead === 0 && candidate.getTime() <= now.getTime()) daysAhead = 7;
    candidate.setDate(candidate.getDate() + daysAhead);
    if (!soonest || candidate.getTime() < soonest.getTime()) soonest = candidate;
  }
  return soonest;
}

function formatTime(time: string) {
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  PARTIAL: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};

const STATUS_KEY: Record<string, string> = {
  PAID: "invoiceStatusPaid",
  PENDING: "invoiceStatusPending",
  OVERDUE: "invoiceStatusOverdue",
  PARTIAL: "invoiceStatusPartial",
};

export default function DashboardPage() {
  const t = useTranslations("DashboardOverview");
  const tCommon = useTranslations("Common");
  const tNotes = useTranslations("ProgressNotes");
  const locale = useLocale();
  const [student, setStudent] = useState<StudentMe | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/student/me")
      .then((r) => r.json())
      .then((data) => {
        if (active) setStudent(data.student);
      });
    return () => {
      active = false;
    };
  }, []);

  function scheduleLine(course: CourseSummary) {
    if (course.classDays.length === 0 || !course.classStartTime || !course.classEndTime) {
      return null;
    }
    const days = course.classDays.map((d) => DAY_SHORT[d]).join(" & ");
    return `${days}, ${formatTime(course.classStartTime)} – ${formatTime(course.classEndTime)}`;
  }

  if (student === undefined) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  const firstName = student?.name.split(" ")[0] ?? "";
  const now = new Date();
  const upcomingClasses = (student?.courses ?? [])
    .map((course) => ({ course, date: nextClassDate(course, now) }))
    .filter((entry): entry is { course: CourseSummary; date: Date } => entry.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-700 via-teal-600 to-emerald-700 p-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-20 -right-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-teal-50">
              <Sparkles className="h-3.5 w-3.5" />
              {t("keepItUp")}
            </span>
            <h1 className="mt-3 text-3xl font-bold">
              {t("welcomeBack")}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-2 max-w-md text-sm text-teal-50/90">{t("subtitle")}</p>
          </div>
          {student && student.courses.length > 0 && (
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
              <ProgressRing value={student.progress} />
              <div>
                <p className="text-sm font-semibold text-white">{t("overallProgress")}</p>
                <p className="text-xs text-teal-50/80">
                  {t("acrossCourses", { count: student.courses.length })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground">{t("myEnrollments")}</h2>
        {(!student || student.courses.length === 0) && (
          <Card className="mt-3 border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">{t("notEnrolledYet")}</p>
            </CardContent>
          </Card>
        )}
        {student && student.courses.length > 0 && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {student.courses.map((course) => {
              const Icon = getIconComponent(course.icon);
              const schedule = scheduleLine(course);
              const recentAttendance = [...course.attendance].reverse();
              return (
                <Card
                  key={course.id}
                  className="group overflow-hidden border-none shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${course.color}`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {course.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {schedule ?? t("scheduleNotSet")}
                        </p>
                      </div>
                    </div>
                    {recentAttendance.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {recentAttendance.map((entry) => (
                          <span
                            key={entry.id}
                            title={new Date(entry.date).toLocaleDateString(locale)}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              entry.present
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                            }`}
                          >
                            {new Date(entry.date).toLocaleDateString(locale, {
                              weekday: "short",
                            })}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {student && student.courses.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("upcomingClasses")}</h2>
          {upcomingClasses.length === 0 ? (
            <Card className="mt-3 border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {t("noUpcomingClasses")}
              </CardContent>
            </Card>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {upcomingClasses.map(({ course, date }) => (
                <Card key={course.id} className="border-none shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {course.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {student && student.assignments.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("assignments")}</h2>
          <div className="mt-3 flex flex-col gap-2">
            {student.assignments.map((assignment) => {
              const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
              const overdue = due !== null && due.getTime() < now.getTime();
              return (
                <Card key={assignment.id} className="border-none shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        overdue
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {assignment.courseName} — {assignment.title}
                      </p>
                      {assignment.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {assignment.description}
                        </p>
                      )}
                      {due && (
                        <p
                          className={`mt-0.5 text-xs ${overdue ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                        >
                          {t("assignmentDue", { date: due.toLocaleDateString(locale) })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{t("recentInvoices")}</h2>
            <Link
              href="/dashboard/invoices"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {student?.invoices.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {t("noInvoicesYet")}
                </CardContent>
              </Card>
            )}
            {student?.invoices.slice(0, 3).map((invoice) => (
              <Card key={invoice.id} className="border-none shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Receipt className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {invoice.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.amount} · {new Date(invoice.date).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[invoice.status] ?? "bg-secondary text-muted-foreground"}`}
                  >
                    {tCommon(STATUS_KEY[invoice.status] ?? "invoiceStatusPending")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">{t("notifications")}</h2>
          <div className="mt-3 flex flex-col gap-2">
            {student?.notifications.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {t("noNotificationsYet")}
                </CardContent>
              </Card>
            )}
            {student?.notifications.map((notification) => (
              <Card key={notification.id} className="border-none shadow-sm">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(notification.date).toLocaleDateString(locale)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground">{tNotes("title")}</h2>
        <div className="mt-3 flex flex-col gap-2">
          {student?.notes.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {tNotes("noNotesYet")}
              </CardContent>
            </Card>
          )}
          {student?.notes.map((note) => (
            <Card key={note.id} className="border-none shadow-sm">
              <CardContent className="flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{note.note}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(note.date).toLocaleDateString(locale)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
