"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/use-session";

type TeacherInfo = { name: string; courseNames: string[] };
type Student = { progress: number };

export default function TeacherOverviewPage() {
  const user = useSession();
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/teacher/students")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setTeacher(data.teacher ?? null);
        setStudents(data.students ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  // Staff share this portal but have no students/courses of their own.
  if (user?.role === "STAFF") {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your staff overview.
          </p>
        </div>
        <Link href="/teacher/sops" className="block">
          <Card className="border-none bg-background shadow-none transition hover:-translate-y-1 hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-indigo-600 bg-indigo-100">
                <FileText className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Company SOPs</p>
                <p className="text-xs text-muted-foreground">
                  Browse approved standard operating procedures.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  if (!students) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s an overview of your students.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-none bg-background shadow-none">
              <CardContent className="p-6">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-secondary/70" />
                <div className="mt-4 h-7 w-12 animate-pulse rounded bg-secondary/70" />
                <div className="mt-2 h-3 w-20 animate-pulse rounded bg-secondary/70" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const avgProgress = students.length
    ? Math.round(
        students.reduce((sum, s) => sum + s.progress, 0) / students.length
      )
    : 0;

  const stats = [
    {
      label: "My Students",
      value: students.length,
      icon: Users,
      href: "/teacher/students",
      color: "text-teal-600 bg-teal-100",
    },
    {
      label: "Avg. Progress",
      value: `${avgProgress}%`,
      icon: TrendingUp,
      href: "/teacher/students",
      color: "text-rose-600 bg-rose-100",
    },
    {
      label: teacher && teacher.courseNames.length > 1 ? "Courses" : "Course",
      value: teacher?.courseNames.length ? teacher.courseNames.join(", ") : "—",
      icon: BookOpen,
      href: "/teacher/students",
      color: "text-indigo-600 bg-indigo-100",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {teacher?.name ?? "Teacher"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your students.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="block">
            <Card className="h-full border-none bg-background shadow-none transition hover:-translate-y-1 hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-6">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
