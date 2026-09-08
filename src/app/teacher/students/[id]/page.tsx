"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttendancePanel, type AttendanceRecord } from "@/components/dashboard/attendance-panel";
import {
  ReportsPanel,
  type WeeklyReport,
  type MonthlyReport,
} from "@/components/dashboard/reports-panel";
import { AssignmentsPanel, type Assignment } from "@/components/dashboard/assignments-panel";
import { MessagesPanel } from "@/components/dashboard/messages-panel";

type Note = { id: string; note: string; date: string };
type EnrollmentDetail = {
  id: string;
  courseId: string;
  courseName: string;
  attendance: AttendanceRecord[];
};
type StudentDetail = {
  id: string;
  name: string;
  email: string;
  level: string;
  progress: number;
  notes: Note[];
  enrollments: EnrollmentDetail[];
};

export default function TeacherStudentProgressPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDetail | null | undefined>(undefined);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/teacher/students/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/teacher/students/${id}/reports`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/teacher/students/${id}/assignments`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([studentData, reportsData, assignmentsData]) => {
      if (!active) return;
      setStudent(studentData?.student ?? null);
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
        <p className="text-sm text-muted-foreground">
          Student not found, or not assigned to you.
        </p>
        <Link
          href="/teacher/students"
          className="text-sm text-primary hover:underline"
        >
          Back to My Students
        </Link>
      </div>
    );
  }

  return (
    <ProgressEditor
      student={student}
      weeklyReports={weeklyReports}
      monthlyReports={monthlyReports}
      assignments={assignments}
    />
  );
}

function ProgressEditor({
  student,
  weeklyReports,
  monthlyReports,
  assignments,
}: {
  student: StudentDetail;
  weeklyReports: WeeklyReport[];
  monthlyReports: MonthlyReport[];
  assignments: Assignment[];
}) {
  const [level, setLevel] = useState(student.level);
  const [progress, setProgress] = useState(student.progress);
  const [notes, setNotes] = useState(student.notes);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/teacher/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, progress }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const res = await fetch(`/api/teacher/students/${student.id}/notes`, {
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/teacher/students"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to My Students
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          {student.name}
        </h1>
        <p className="text-sm text-muted-foreground">{student.email}</p>
      </div>

      <Card className="max-w-lg border-none bg-background shadow-none">
        <CardContent className="p-8">
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="level">Study Level</Label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Progress"}
              </Button>
              {saved && <p className="text-xs text-muted-foreground">Saved.</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="max-w-lg">
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

      <AttendancePanel
        apiBase={`/api/teacher/students/${student.id}`}
        enrollments={student.enrollments.map((e) => ({
          id: e.id,
          courseName: e.courseName,
          attendance: e.attendance,
        }))}
      />

      <ReportsPanel
        apiBase={`/api/teacher/students/${student.id}`}
        enrollments={student.enrollments.map((e) => ({ id: e.id, courseName: e.courseName }))}
        initialWeekly={weeklyReports}
        initialMonthly={monthlyReports}
      />

      <AssignmentsPanel
        apiBase={`/api/teacher/students/${student.id}`}
        enrollments={student.enrollments.map((e) => ({ id: e.id, courseName: e.courseName }))}
        initialAssignments={assignments}
      />

      <MessagesPanel apiBase={`/api/teacher/students/${student.id}`} />
    </div>
  );
}
