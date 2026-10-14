"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RowActionButton, RowActionLink } from "@/components/dashboard/row-action-button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Student = {
  id: string;
  name: string;
  email: string;
  courseNames: string[];
  teacherId: string | null;
  teacherName: string | null;
  level: string;
  progress: number;
  status: string;
};

type Teacher = { id: string; name: string; courseIds: string[] };
type Course = { id: string; name: string };

const EMPTY_FORM = {
  name: "",
  email: "",
  courseIds: [] as string[],
  teacherId: "",
  level: "BEGINNER",
  phone: "",
  whatsapp: "",
  parentName: "",
  parentContact: "",
  monthlyFee: "",
};

const LEVEL_STYLES: Record<string, string> = {
  BEGINNER: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  INTERMEDIATE: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  ADVANCED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/students").then((r) => r.json()),
      fetch("/api/admin/teachers").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
    ]).then(([studentsData, teachersData, coursesData]) => {
      if (!active) return;
      setStudents(studentsData.students ?? []);
      setTeachers(teachersData.teachers ?? []);
      setCourses(coursesData.courses ?? []);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!students) return null;
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [students, query, statusFilter]);

  function toggleCourse(courseId: string) {
    setForm((f) => {
      const nextCourseIds = f.courseIds.includes(courseId)
        ? f.courseIds.filter((id) => id !== courseId)
        : [...f.courseIds, courseId];
      const teacherStillValid = teachers.some(
        (t) => t.id === f.teacherId && t.courseIds.some((cid) => nextCourseIds.includes(cid))
      );
      return {
        ...f,
        courseIds: nextCourseIds,
        teacherId: teacherStillValid ? f.teacherId : "",
      };
    });
  }

  const availableTeachers = teachers.filter((t) =>
    t.courseIds.some((cid) => form.courseIds.includes(cid))
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors ?? { form: data.error ?? "Something went wrong." });
        return;
      }

      const teacher = teachers.find((t) => t.id === form.teacherId);
      setStudents((prev) => [
        {
          id: data.student.id,
          name: data.student.name,
          email: data.student.email,
          courseNames: data.student.courseNames,
          teacherId: data.student.teacherId,
          teacherName: teacher?.name ?? null,
          level: data.student.level,
          progress: data.student.progress,
          status: data.student.status,
        },
        ...(prev ?? []),
      ]);
      setForm(EMPTY_FORM);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(student: Student) {
    const confirmed = window.confirm(
      `Delete ${student.name}? This will remove their notes, invoices, and notifications too. This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingId(student.id);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStudents((prev) => prev?.filter((s) => s.id !== student.id) ?? prev);
      } else {
        const data = await res.json().catch(() => null);
        window.alert(data?.error ?? "Couldn't delete this student.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student records and course assignments.
          </p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Add Student</SheetTitle>
            </SheetHeader>
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Courses</Label>
                {courses.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No courses yet — add one under Courses first.
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  {courses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center gap-2 rounded-lg border border-input px-2.5 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary/10"
                    >
                      <input
                        type="checkbox"
                        checked={form.courseIds.includes(course.id)}
                        onChange={() => toggleCourse(course.id)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      {course.name}
                    </label>
                  ))}
                </div>
                {errors.courseIds && (
                  <p className="text-xs text-destructive">{errors.courseIds}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="teacher">Assign Teacher</Label>
                <select
                  id="teacher"
                  value={form.teacherId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, teacherId: e.target.value }))
                  }
                  disabled={form.courseIds.length === 0}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                >
                  <option value="">Unassigned</option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {form.courseIds.length === 0
                    ? "Select a course to see teachers who teach it."
                    : availableTeachers.length === 0
                      ? "No teacher teaches these courses yet."
                      : "Only teachers of the selected courses are shown."}
                </p>
                {errors.teacherId && (
                  <p className="text-xs text-destructive">{errors.teacherId}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="level">Study Level</Label>
                <div className="flex gap-1.5">
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, level }))}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                        form.level === level
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {level.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="parentName">Parent Name</Label>
                  <Input
                    id="parentName"
                    value={form.parentName}
                    onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="parentContact">Parent Contact</Label>
                  <Input
                    id="parentContact"
                    value={form.parentContact}
                    onChange={(e) => setForm((f) => ({ ...f, parentContact: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="monthlyFee">Monthly Fee</Label>
                <Input
                  id="monthlyFee"
                  placeholder="e.g. PKR 5,000"
                  value={form.monthlyFee}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyFee: e.target.value }))}
                />
              </div>

              {form.courseIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Each course&apos;s class schedule can be set from the student&apos;s
                  detail page after saving.
                </p>
              )}

              {errors.form && (
                <p className="text-xs text-destructive">{errors.form}</p>
              )}

              <div className="mt-auto flex gap-3 pt-2">
                <SheetClose
                  render={<Button type="button" variant="outline" className="flex-1" />}
                >
                  Cancel
                </SheetClose>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Student"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1.5">
          {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === status
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-none bg-background shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Courses</th>
                  <th className="px-6 py-3 font-medium">Teacher</th>
                  <th className="px-6 py-3 font-medium">Level</th>
                  <th className="px-6 py-3 font-medium">Progress</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered === null &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-secondary/70" />
                      </td>
                    </tr>
                  ))}
                {filtered?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center">
                      <Users className="mx-auto h-6 w-6 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">
                        No students match your search.
                      </p>
                    </td>
                  </tr>
                )}
                {filtered?.map((student) => (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
                            {initials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.courseNames.length > 0
                        ? student.courseNames.join(", ")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.teacherName ?? "Unassigned"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={LEVEL_STYLES[student.level]}
                      >
                        {student.level.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {student.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={student.status === "ACTIVE" ? "default" : "outline"}
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <RowActionLink
                          href={`/admin/students/${student.id}`}
                          icon={Pencil}
                          label={`Edit ${student.name}`}
                          variant="edit"
                        />
                        <RowActionButton
                          onClick={() => handleDelete(student)}
                          disabled={deletingId === student.id}
                          icon={Trash2}
                          label={`Delete ${student.name}`}
                          variant="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
