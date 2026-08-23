"use client";

import { useEffect, useState } from "react";
import { Bell, MessageSquareText, Receipt, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { getIconComponent } from "@/lib/course-icons";

type Invoice = { id: string; description: string; amount: string; date: string; status: string };
type Notification = { id: string; message: string; date: string };
type Note = { id: string; note: string; date: string };
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
type Child = {
  id: string;
  name: string;
  courses: CourseSummary[];
  teacherName: string | null;
  level: string;
  progress: number;
  status: string;
  invoices: Invoice[];
  notifications: Notification[];
  notes: Note[];
};
type ParentMe = { name: string; children: Child[] } | null;

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const LEVEL_KEY: Record<string, string> = {
  BEGINNER: "levelBeginner",
  INTERMEDIATE: "levelIntermediate",
  ADVANCED: "levelAdvanced",
};

const STATUS_KEY: Record<string, string> = {
  ACTIVE: "statusActive",
  INACTIVE: "statusInactive",
};

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

const INVOICE_STATUS_KEY: Record<string, string> = {
  PAID: "invoiceStatusPaid",
  PENDING: "invoiceStatusPending",
  OVERDUE: "invoiceStatusOverdue",
  PARTIAL: "invoiceStatusPartial",
};

export default function ParentOverviewPage() {
  const t = useTranslations("ParentPortal");
  const tCommon = useTranslations("Common");
  const tNotes = useTranslations("ProgressNotes");
  const locale = useLocale();
  const [parent, setParent] = useState<ParentMe | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/parent/me")
      .then((r) => r.json())
      .then((data) => {
        if (active) setParent(data.parent);
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

  if (parent === undefined) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  const firstName = parent?.name.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("welcome")}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {parent && parent.children.length > 1 ? t("subtitleMultiple") : t("subtitleSingle")}
        </p>
      </div>

      {(!parent || parent.children.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("noChildrenLinked")}</p>
          </CardContent>
        </Card>
      )}

      {parent?.children.map((child) => (
        <div key={child.id} className="flex flex-col gap-4 rounded-2xl border border-border/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">{child.name}</h2>
              <p className="text-xs text-muted-foreground">
                {t("levelSuffix", {
                  level: tCommon(LEVEL_KEY[child.level] ?? "levelBeginner"),
                })}
                {child.teacherName ? ` · ${t("teacherSuffix", { name: child.teacherName })}` : ""} ·{" "}
                {t("progressSuffix", { percent: child.progress })}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                child.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {tCommon(STATUS_KEY[child.status] ?? "statusActive")}
            </span>
          </div>

          {child.courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("notEnrolledYet")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {child.courses.map((course) => {
                const Icon = getIconComponent(course.icon);
                const schedule = scheduleLine(course);
                const recentAttendance = [...course.attendance].reverse();
                return (
                  <Card key={course.id} className="border-none shadow-sm">
                    <CardContent className="flex flex-col gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${course.color}`}
                        >
                          <Icon className="h-5 w-5" />
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

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("invoices")}</h3>
              <div className="mt-2 flex flex-col gap-2">
                {child.invoices.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t("noInvoicesYet")}</p>
                )}
                {child.invoices.slice(0, 3).map((invoice) => (
                  <Card key={invoice.id} className="border-none shadow-sm">
                    <CardContent className="flex items-center gap-3 p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <Receipt className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {invoice.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {invoice.amount} · {new Date(invoice.date).toLocaleDateString(locale)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[invoice.status] ?? "bg-secondary text-muted-foreground"}`}
                      >
                        {tCommon(INVOICE_STATUS_KEY[invoice.status] ?? "invoiceStatusPending")}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("notifications")}</h3>
              <div className="mt-2 flex flex-col gap-2">
                {child.notifications.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t("noNotificationsYet")}</p>
                )}
                {child.notifications.slice(0, 3).map((notification) => (
                  <Card key={notification.id} className="border-none shadow-sm">
                    <CardContent className="flex items-start gap-3 p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Bell className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground">{notification.message}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(notification.date).toLocaleDateString(locale)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">{tNotes("title")}</h3>
              <div className="mt-2 flex flex-col gap-2">
                {child.notes.length === 0 && (
                  <p className="text-xs text-muted-foreground">{tNotes("noNotesYet")}</p>
                )}
                {child.notes.slice(0, 3).map((note) => (
                  <Card key={note.id} className="border-none shadow-sm">
                    <CardContent className="flex items-start gap-3 p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <MessageSquareText className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground">{note.note}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(note.date).toLocaleDateString(locale)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
