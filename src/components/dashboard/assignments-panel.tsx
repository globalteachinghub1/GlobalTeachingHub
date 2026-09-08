"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RowActionButton } from "@/components/dashboard/row-action-button";

export type Assignment = {
  id: string;
  enrollmentId: string;
  courseName: string;
  title: string;
  description: string | null;
  dueDate: string | null;
};

export type EnrollmentOption = { id: string; courseName: string };

const EMPTY_FORM = { title: "", description: "", dueDate: "" };

export function AssignmentsPanel({
  apiBase,
  enrollments,
  initialAssignments,
}: {
  /** e.g. `/api/admin/students/${id}` or `/api/teacher/students/${id}` */
  apiBase: string;
  enrollments: EnrollmentOption[];
  initialAssignments: Assignment[];
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? "");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(assignment: Assignment) {
    setEditingId(assignment.id);
    setEnrollmentId(assignment.enrollmentId);
    setForm({
      title: assignment.title,
      description: assignment.description ?? "",
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 10) : "",
    });
    setErrors({});
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const payload = {
      enrollmentId,
      title: form.title,
      description: form.description,
      dueDate: form.dueDate || null,
    };

    try {
      const res = await fetch(
        editingId ? `${apiBase}/assignments/${editingId}` : `${apiBase}/assignments`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors ?? { form: data.error ?? "Something went wrong." });
        return;
      }

      setAssignments((prev) => {
        if (editingId) {
          return prev.map((a) => (a.id === editingId ? data.assignment : a));
        }
        return [data.assignment, ...prev];
      });
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(assignment: Assignment) {
    const confirmed = window.confirm(`Delete "${assignment.title}"? This can't be undone.`);
    if (!confirmed) return;

    setDeletingId(assignment.id);
    try {
      const res = await fetch(`${apiBase}/assignments/${assignment.id}`, { method: "DELETE" });
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
        if (editingId === assignment.id) cancelEdit();
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (enrollments.length === 0) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-sm font-semibold text-foreground">Assignments</h2>
        <Card className="mt-3 border-none bg-background shadow-none">
          <CardContent className="px-6 py-4 text-sm text-muted-foreground">
            Enroll this student in a course first to assign work.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-sm font-semibold text-foreground">Assignments</h2>

      <Card className="mt-3 border-none bg-background shadow-none">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-course">Course</Label>
                <select
                  id="assignment-course"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value)}
                  disabled={!!editingId}
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                >
                  {enrollments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.courseName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-due">Due Date (optional)</Label>
                <Input
                  id="assignment-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="h-8 text-xs"
                  aria-invalid={!!errors.dueDate}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignment-title">Title</Label>
              <Input
                id="assignment-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                aria-invalid={!!errors.title}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignment-description">Description (optional)</Label>
              <textarea
                id="assignment-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </div>

            {errors.form && <p className="text-xs text-destructive">{errors.form}</p>}

            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Assignment"}
              </Button>
              {editingId && (
                <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {assignments.length === 0 ? (
        <Card className="mt-3 border-none bg-background shadow-none">
          <CardContent className="px-6 py-4 text-sm text-muted-foreground">
            No assignments yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-3 border-none bg-background shadow-none">
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {a.courseName} — {a.title}
                  </p>
                  {a.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                  )}
                  {a.dueDate && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Due {new Date(a.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <RowActionButton
                    onClick={() => startEdit(a)}
                    icon={Pencil}
                    label={`Edit ${a.title}`}
                    variant="edit"
                  />
                  <RowActionButton
                    onClick={() => handleDelete(a)}
                    disabled={deletingId === a.id}
                    icon={Trash2}
                    label={`Delete ${a.title}`}
                    variant="danger"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
