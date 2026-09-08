"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AttendancePanel, type AttendanceRecord } from "@/components/dashboard/attendance-panel";
import { AssignmentsPanel, type Assignment } from "@/components/dashboard/assignments-panel";
import { MessagesPanel } from "@/components/dashboard/messages-panel";
import {
  ReportsPanel,
  type WeeklyReport,
  type MonthlyReport,
} from "@/components/dashboard/reports-panel";

type Note = { id: string; note: string; date: string };
type EnrollmentDetail = {
  id: string;
  courseId: string;
  courseName: string;
  classStartTime: string | null;
  classEndTime: string | null;
  classDays: string[];
  attendance: AttendanceRecord[];
};
type StudentDetail = {
  id: string;
  name: string;
  email: string;
  courseIds: string[];
  teacherId: string | null;
  level: string;
  progress: number;
  status: string;
  notes: Note[];
  enrollments: EnrollmentDetail[];
  phone: string | null;
  whatsapp: string | null;
  parentName: string | null;
  parentContact: string | null;
  monthlyFee: string | null;
  joined: string;
  parents: { id: string; name: string; email: string }[];
};
type Teacher = { id: string; name: string; courseIds: string[] };
type Course = { id: string; name: string };

const CLASS_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

function dayLabel(day: string) {
  return day.charAt(0) + day.slice(1, 3).toLowerCase();
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminStudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDetail | null | undefined>(undefined);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/admin/students/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/teachers").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
      fetch(`/api/admin/students/${id}/reports`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/admin/students/${id}/assignments`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([studentData, teachersData, coursesData, reportsData, assignmentsData]) => {
      if (!active) return;
      setStudent(studentData?.student ?? null);
      setTeachers(teachersData.teachers ?? []);
      setCourses(coursesData.courses ?? []);
      setWeeklyReports(reportsData?.weeklyReports ?? []);
      setMonthlyReports(reportsData?.monthlyReports ?? []);
      setAssignments(assignmentsData?.assignments ?? []);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (student === undefined) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!student) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">Student not found.</p>
        <Link href="/admin/students" className="text-sm text-primary hover:underline">
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <StudentEditor
      student={student}
      teachers={teachers}
      courses={courses}
      weeklyReports={weeklyReports}
      monthlyReports={monthlyReports}
      assignments={assignments}
    />
  );
}

function StudentEditor({
  student,
  weeklyReports,
  monthlyReports,
  assignments,
  teachers,
  courses,
}: {
  student: StudentDetail;
  teachers: Teacher[];
  courses: Course[];
  weeklyReports: WeeklyReport[];
  monthlyReports: MonthlyReport[];
  assignments: Assignment[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: student.name,
    email: student.email,
    courseIds: student.courseIds,
    teacherId: student.teacherId ?? "",
    level: student.level,
    progress: student.progress,
    status: student.status,
    phone: student.phone ?? "",
    whatsapp: student.whatsapp ?? "",
    parentName: student.parentName ?? "",
    parentContact: student.parentContact ?? "",
    monthlyFee: student.monthlyFee ?? "",
    joined: toDateInputValue(student.joined),
  });

  function toggleCourse(courseId: string) {
    setForm((f) => {
      const nextCourseIds = f.courseIds.includes(courseId)
        ? f.courseIds.filter((cid) => cid !== courseId)
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

  const [enrollments, setEnrollments] = useState(student.enrollments);
  const [notes, setNotes] = useState(student.notes);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parents, setParents] = useState(student.parents);
  const [parentForm, setParentForm] = useState({ name: "", email: "" });
  const [invitingParent, setInvitingParent] = useState(false);
  const [parentErrors, setParentErrors] = useState<Record<string, string>>({});
  const [removingParentId, setRemovingParentId] = useState<string | null>(null);

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
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setSaved(true);
      } else {
        setErrors(data?.errors ?? { form: data?.error ?? "Something went wrong." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${student.name}? This will remove their notes, invoices, and notifications too. This can't be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/students");
        router.refresh();
      } else {
        setDeleting(false);
      }
    } catch {
      setDeleting(false);
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const res = await fetch(`/api/admin/students/${student.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteText.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setNotes((prev) => [data.note, ...prev]);
      setNoteText("");
    }
  }

  async function handleInviteParent(e: FormEvent) {
    e.preventDefault();
    setInvitingParent(true);
    setParentErrors({});
    try {
      const res = await fetch(`/api/admin/students/${student.id}/parent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentForm),
      });
      const data = await res.json();
      if (res.ok) {
        setParents((prev) => [...prev, data.parent]);
        setParentForm({ name: "", email: "" });
      } else {
        setParentErrors(data.errors ?? { form: data.error ?? "Something went wrong." });
      }
    } finally {
      setInvitingParent(false);
    }
  }

  async function handleRemoveParent(parent: { id: string; name: string }) {
    const confirmed = window.confirm(`Remove ${parent.name}'s access to this student?`);
    if (!confirmed) return;
    setRemovingParentId(parent.id);
    try {
      const res = await fetch(`/api/admin/students/${student.id}/parent`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: parent.id }),
      });
      if (res.ok) {
        setParents((prev) => prev.filter((p) => p.id !== parent.id));
      }
    } finally {
      setRemovingParentId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/students"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to Students
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                {initials(student.name)}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-foreground">
              {student.name}
            </h1>
          </div>
        </div>

        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete Student"}
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
            </div>
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
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Courses</Label>
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
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="teacher">Assigned Teacher</Label>
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
              <Label>Study Level</Label>
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

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <div className="flex gap-1.5">
                {["ACTIVE", "INACTIVE"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status }))}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      form.status === status
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:bg-secondary/60"
                    }`}
                  >
                    {status.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="joined">Joining Date</Label>
              <Input
                id="joined"
                type="date"
                value={form.joined}
                onChange={(e) => setForm((f) => ({ ...f, joined: e.target.value }))}
              />
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

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="progress">Progress</Label>
                <span className="text-xs font-medium text-muted-foreground">
                  {form.progress}%
                </span>
              </div>
              <input
                id="progress"
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) =>
                  setForm((f) => ({ ...f, progress: Number(e.target.value) }))
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
              />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${form.progress}%` }}
                />
              </div>
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
        <h2 className="text-sm font-semibold text-foreground">
          Course Schedules
        </h2>
        {enrollments.length === 0 && (
          <Card className="mt-3 border-dashed">
            <CardContent className="px-6 py-4 text-sm text-muted-foreground">
              Enroll this student in a course above, then save, to set its class schedule.
            </CardContent>
          </Card>
        )}
        <div className="mt-3 flex flex-col gap-3">
          {enrollments.map((enrollment) => (
            <EnrollmentScheduleCard
              key={enrollment.id}
              studentId={student.id}
              enrollment={enrollment}
              onSaved={(updated) =>
                setEnrollments((prev) =>
                  prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
                )
              }
            />
          ))}
        </div>
      </div>

      <div className="max-w-2xl">
        <h2 className="text-sm font-semibold text-foreground">
          Progress Notes
        </h2>
        <Card className="mt-3 border-none bg-background shadow-none">
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {notes.length === 0 && (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                No notes yet.
              </p>
            )}
            {notes.map((note) => (
              <div key={note.id} className="px-6 py-4">
                <p className="text-sm text-foreground">{note.note}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(note.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
          <Input
            placeholder="Add a progress note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <Button type="submit" variant="outline">
            Add Note
          </Button>
        </form>
      </div>

      <div className="max-w-2xl">
        <h2 className="text-sm font-semibold text-foreground">Parent Access</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Parents linked here can log in at the student login page with a read-only view of
          attendance, invoices, and reports.
        </p>
        <Card className="mt-3 border-none bg-background shadow-none">
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {parents.length === 0 && (
              <p className="px-6 py-4 text-sm text-muted-foreground">No parent linked yet.</p>
            )}
            {parents.map((parent) => (
              <div key={parent.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{parent.name}</p>
                  <p className="text-xs text-muted-foreground">{parent.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveParent(parent)}
                  disabled={removingParentId === parent.id}
                  aria-label={`Remove ${parent.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <form onSubmit={handleInviteParent} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Parent name"
            value={parentForm.name}
            onChange={(e) => setParentForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            type="email"
            placeholder="Parent email"
            value={parentForm.email}
            onChange={(e) => setParentForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Button type="submit" variant="outline" disabled={invitingParent} className="shrink-0">
            <UserPlus className="h-4 w-4" />
            {invitingParent ? "Inviting..." : "Invite Parent"}
          </Button>
        </form>
        {(parentErrors.name || parentErrors.email || parentErrors.form) && (
          <p className="mt-1.5 text-xs text-destructive">
            {parentErrors.name || parentErrors.email || parentErrors.form}
          </p>
        )}
      </div>

      <AttendancePanel
        apiBase={`/api/admin/students/${student.id}`}
        enrollments={enrollments.map((e) => ({
          id: e.id,
          courseName: e.courseName,
          attendance: e.attendance,
        }))}
      />

      <ReportsPanel
        apiBase={`/api/admin/students/${student.id}`}
        enrollments={enrollments.map((e) => ({ id: e.id, courseName: e.courseName }))}
        initialWeekly={weeklyReports}
        initialMonthly={monthlyReports}
      />

      <AssignmentsPanel
        apiBase={`/api/admin/students/${student.id}`}
        enrollments={enrollments.map((e) => ({ id: e.id, courseName: e.courseName }))}
        initialAssignments={assignments}
      />

      <MessagesPanel apiBase={`/api/admin/students/${student.id}`} />
    </div>
  );
}

function EnrollmentScheduleCard({
  studentId,
  enrollment,
  onSaved,
}: {
  studentId: string;
  enrollment: EnrollmentDetail;
  onSaved: (updated: {
    id: string;
    classStartTime: string | null;
    classEndTime: string | null;
    classDays: string[];
  }) => void;
}) {
  const [classStartTime, setClassStartTime] = useState(enrollment.classStartTime ?? "");
  const [classEndTime, setClassEndTime] = useState(enrollment.classEndTime ?? "");
  const [classDays, setClassDays] = useState(enrollment.classDays);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timeout);
  }, [saved]);

  function toggleDay(day: string) {
    setClassDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setErrors({});
    try {
      const res = await fetch(
        `/api/admin/students/${studentId}/enrollments/${enrollment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classStartTime, classEndTime, classDays }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setSaved(true);
        onSaved({ id: enrollment.id, classStartTime, classEndTime, classDays });
      } else {
        setErrors(data?.errors ?? {});
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-none bg-background shadow-none">
      <CardContent className="flex flex-col gap-3 p-5">
        <p className="text-sm font-semibold text-foreground">{enrollment.courseName}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`start-${enrollment.id}`}>Class Start Time</Label>
            <Input
              id={`start-${enrollment.id}`}
              type="time"
              value={classStartTime}
              onChange={(e) => setClassStartTime(e.target.value)}
            />
            {errors.classStartTime && (
              <p className="text-xs text-destructive">{errors.classStartTime}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`end-${enrollment.id}`}>Class End Time</Label>
            <Input
              id={`end-${enrollment.id}`}
              type="time"
              value={classEndTime}
              onChange={(e) => setClassEndTime(e.target.value)}
            />
            {errors.classEndTime && (
              <p className="text-xs text-destructive">{errors.classEndTime}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Class Days</Label>
          <div className="flex flex-wrap gap-1.5">
            {CLASS_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  classDays.includes(day)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                {dayLabel(day)}
              </button>
            ))}
          </div>
          {errors.classDays && <p className="text-xs text-destructive">{errors.classDays}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Schedule"}
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
      </CardContent>
    </Card>
  );
}
