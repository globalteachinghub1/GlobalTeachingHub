"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RowActionButton, RowActionLink } from "@/components/dashboard/row-action-button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Teacher = {
  id: string;
  name: string;
  email: string;
  courseIds: string[];
  courseNames: string[];
  studentCount: number;
};
type Course = { id: string; name: string };

const EMPTY_FORM = { name: "", email: "", password: "", courseIds: [] as string[] };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/teachers").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
    ]).then(([teachersData, coursesData]) => {
      if (!active) return;
      setTeachers(teachersData.teachers ?? []);
      const courseList = coursesData.courses ?? [];
      setCourses(courseList);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!teachers) return null;
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
    );
  }, [teachers, query]);

  function openAddForm() {
    setErrors({});
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function toggleCourse(courseId: string) {
    setForm((f) => ({
      ...f,
      courseIds: f.courseIds.includes(courseId)
        ? f.courseIds.filter((id) => id !== courseId)
        : [...f.courseIds, courseId],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors ?? { form: data.error ?? "Something went wrong." });
        return;
      }

      setTeachers((prev) => [data.teacher, ...(prev ?? [])]);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(teacher: Teacher) {
    const confirmed = window.confirm(
      `Delete ${teacher.name}? Their assigned students will become unassigned. This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingId(teacher.id);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTeachers((prev) => prev?.filter((t) => t.id !== teacher.id) ?? prev);
      } else {
        const data = await res.json().catch(() => null);
        window.alert(data?.error ?? "Couldn't delete this teacher.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teachers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage teaching staff and the courses they teach.
          </p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Add Teacher</SheetTitle>
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
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Teaches</Label>
                {courses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No courses yet — add one under Courses first.
                  </p>
                ) : (
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
                )}
                {errors.courseIds && (
                  <p className="text-xs text-destructive">{errors.courseIds}</p>
                )}
              </div>

              {errors.form && (
                <p className="text-xs text-destructive">{errors.form}</p>
              )}

              <div className="mt-auto flex gap-3 pt-2">
                <SheetClose
                  render={<Button type="button" variant="outline" className="flex-1" />}
                >
                  Cancel
                </SheetClose>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting || courses.length === 0}
                >
                  {submitting ? "Saving..." : "Save Teacher"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <Card className="border-none bg-background shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Courses</th>
                  <th className="px-6 py-3 font-medium">Students</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered === null &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-6 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-secondary/70" />
                      </td>
                    </tr>
                  ))}
                {filtered?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <Users className="mx-auto h-6 w-6 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">
                        No teachers match your search.
                      </p>
                    </td>
                  </tr>
                )}
                {filtered?.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
                            {initials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {teacher.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {teacher.courseNames.join(", ")}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {teacher.studentCount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <RowActionLink
                          href={`/admin/teachers/${teacher.id}`}
                          icon={Pencil}
                          label={`Edit ${teacher.name}`}
                          variant="edit"
                        />
                        <RowActionButton
                          onClick={() => handleDelete(teacher)}
                          disabled={deletingId === teacher.id}
                          icon={Trash2}
                          label={`Delete ${teacher.name}`}
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
