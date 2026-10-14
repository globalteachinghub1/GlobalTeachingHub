"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Student = {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number;
  status: string;
  courseIds?: string[];
};
type TeacherDetail = {
  id: string;
  name: string;
  email: string;
  courseIds: string[];
  students: Student[];
};
type Course = { id: string; name: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminTeacherDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<TeacherDetail | null | undefined>(undefined);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/admin/teachers/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/courses").then((r) => r.json()),
    ]).then(([teacherData, coursesData]) => {
      if (!active) return;
      setTeacher(teacherData?.teacher ?? null);
      setCourses(coursesData.courses ?? []);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (teacher === undefined) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!teacher) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">Teacher not found.</p>
        <Link href="/admin/teachers" className="text-sm text-primary hover:underline">
          Back to Teachers
        </Link>
      </div>
    );
  }

  return <TeacherEditor teacher={teacher} courses={courses} />;
}

function TeacherEditor({ teacher, courses }: { teacher: TeacherDetail; courses: Course[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: teacher.name,
    email: teacher.email,
    courseIds: teacher.courseIds,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [students, setStudents] = useState(teacher.students);
  const [allStudents, setAllStudents] = useState<Student[] | null>(null);
  const [addStudentId, setAddStudentId] = useState("");
  const [rosterSaving, setRosterSaving] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  function toggleCourse(courseId: string) {
    setForm((f) => ({
      ...f,
      courseIds: f.courseIds.includes(courseId)
        ? f.courseIds.filter((id) => id !== courseId)
        : [...f.courseIds, courseId],
    }));
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((data) => {
        if (active) setAllStudents(data.students ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timeout);
  }, [saved]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setErrors({});
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        if (data.unassignedStudentCount > 0) {
          const refreshed = await fetch(`/api/admin/teachers/${teacher.id}`).then((r) =>
            r.json()
          );
          if (refreshed?.teacher) setStudents(refreshed.teacher.students);
        }
      } else {
        setErrors(data.errors ?? { form: data.error ?? "Something went wrong." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveRoster(nextStudentIds: string[]) {
    setRosterSaving(true);
    setRosterError(null);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}/students`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: nextStudentIds }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setStudents(data.students);
      } else {
        setRosterError(data?.error ?? "Couldn't update the roster.");
      }
    } finally {
      setRosterSaving(false);
    }
  }

  function handleAddStudent() {
    if (!addStudentId) return;
    saveRoster([...students.map((s) => s.id), addStudentId]);
    setAddStudentId("");
  }

  function handleRemoveStudent(studentId: string) {
    saveRoster(students.filter((s) => s.id !== studentId).map((s) => s.id));
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${teacher.name}? Their assigned students will become unassigned. This can't be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/teachers");
        router.refresh();
      } else {
        setDeleting(false);
      }
    } catch {
      setDeleting(false);
    }
  }

  const assignedIds = new Set(students.map((s) => s.id));
  const teacherCourseIds = new Set(form.courseIds);
  const availableStudents = (allStudents ?? []).filter(
    (s) =>
      !assignedIds.has(s.id) &&
      (s.courseIds ?? []).some((cid) => teacherCourseIds.has(cid))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/teachers"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to Teachers
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                {initials(teacher.name)}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-foreground">{teacher.name}</h1>
          </div>
        </div>

        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete Teacher"}
        </Button>
      </div>

      <Card className="max-w-2xl border-none bg-background shadow-none">
        <CardContent className="p-8">
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Teaches</Label>
              <div className="flex flex-wrap gap-1.5">
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
              <p className="text-xs text-muted-foreground">
                Removing a course here will unassign any of this teacher&apos;s
                students who aren&apos;t enrolled in a remaining course.
              </p>
            </div>

            {errors.form && (
              <p className="text-xs text-destructive sm:col-span-2">{errors.form}</p>
            )}

            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <span
                className={`flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300 ${
                  saved ? "opacity-100" : "opacity-0"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Saved
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Assigned Students ({students.length})
          </h2>
        </div>

        <div className="mt-3 flex gap-2">
          <select
            value={addStudentId}
            onChange={(e) => setAddStudentId(e.target.value)}
            disabled={availableStudents.length === 0 || rosterSaving}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          >
            <option value="">
              {availableStudents.length === 0
                ? "No students enrolled in these courses to assign"
                : "Select a student to assign..."}
            </option>
            {availableStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddStudent}
            disabled={!addStudentId || rosterSaving}
          >
            <UserPlus className="h-4 w-4" />
            Assign
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Only students enrolled in one of this teacher&apos;s courses can be
          assigned.
        </p>
        {rosterError && (
          <p className="mt-1.5 text-xs text-destructive">{rosterError}</p>
        )}

        <Card className="mt-3 border-none bg-background shadow-none">
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {students.length === 0 && (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                No students assigned yet.
              </p>
            )}
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <Link
                  href={`/admin/students/${student.id}`}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
                      {initials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {student.progress}%
                  </span>
                  <Badge variant={student.status === "ACTIVE" ? "default" : "outline"}>
                    {student.status}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.id)}
                    disabled={rosterSaving}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Unassign ${student.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
