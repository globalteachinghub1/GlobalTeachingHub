"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RowActionButton } from "@/components/dashboard/row-action-button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { COLOR_OPTIONS, ICON_OPTIONS, getIconComponent } from "@/lib/course-icons";
import { routing, LOCALE_LABELS, type Locale } from "@/i18n/routing";

const TRANSLATABLE_LOCALES = routing.locales.filter(
  (l) => l !== routing.defaultLocale
) as Locale[];

type Course = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  summary: string;
  topics: string[];
  outcomes: string[];
  priceNote: string | null;
  color: string;
  icon: string;
  studentCount: number;
  teacherCount: number;
};

const EMPTY_FORM = {
  name: "",
  description: "",
  summary: "",
  topics: "",
  outcomes: "",
  priceNote: "",
  color: COLOR_OPTIONS[0].value,
  icon: ICON_OPTIONS[0].value,
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((data) => {
        if (active) setCourses(data.courses ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setOpen(true);
  }

  function openEditForm(course: Course) {
    setEditingId(course.id);
    setForm({
      name: course.name,
      description: course.description ?? "",
      summary: course.summary,
      topics: course.topics.join(", "),
      outcomes: course.outcomes.join(", "),
      priceNote: course.priceNote ?? "",
      color: course.color,
      icon: course.icon,
    });
    setErrors({});
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      summary: form.summary,
      topics: form.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      outcomes: form.outcomes
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      priceNote: form.priceNote,
      color: form.color,
      icon: form.icon,
    };

    try {
      const res = await fetch(
        editingId ? `/api/admin/courses/${editingId}` : "/api/admin/courses",
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

      setCourses((prev) => {
        if (!prev) return prev;
        if (editingId) {
          return prev.map((c) => (c.id === editingId ? data.course : c));
        }
        return [...prev, data.course];
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(course: Course) {
    const confirmed = window.confirm(`Delete "${course.name}"? This can't be undone.`);
    if (!confirmed) return;

    setDeletingId(course.id);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setCourses((prev) => prev?.filter((c) => c.id !== course.id) ?? prev);
      } else {
        window.alert(data?.error ?? "Couldn't delete this course.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Courses shown on the website and available for enrollment.
          </p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit Course" : "Add Course"}</SheetTitle>
            </SheetHeader>
            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Short Description</Label>
                <Input
                  id="description"
                  placeholder="Shown under the course name on cards"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="summary">Summary</Label>
                <textarea
                  id="summary"
                  required
                  rows={4}
                  placeholder="Longer description shown on the course details page"
                  value={form.summary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, summary: e.target.value }))
                  }
                  aria-invalid={!!errors.summary}
                  className="w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 aria-invalid:border-destructive"
                />
                {errors.summary && (
                  <p className="text-xs text-destructive">{errors.summary}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="topics">Topics (Curriculum)</Label>
                <Input
                  id="topics"
                  placeholder="Comma-separated, e.g. Tajweed, Translation, Tafseer"
                  value={form.topics}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, topics: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="outcomes">Learning Outcomes</Label>
                <Input
                  id="outcomes"
                  placeholder="Comma-separated, e.g. Recite with correct Tajweed rules"
                  value={form.outcomes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, outcomes: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="priceNote">Pricing Note</Label>
                <Input
                  id="priceNote"
                  placeholder="e.g. Custom pricing based on schedule — book a free trial to discuss."
                  value={form.priceNote}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceNote: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {ICON_OPTIONS.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon: value }))}
                      className={`flex h-9 items-center justify-center rounded-lg border transition-colors ${
                        form.icon === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map(({ value, label, swatch }) => (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      onClick={() => setForm((f) => ({ ...f, color: value }))}
                      className={`h-7 w-7 rounded-full ${swatch} transition-transform ${
                        form.color === value
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              {editingId && <CourseTranslationsEditor courseId={editingId} />}

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
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Add Course"}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {courses === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-none bg-background shadow-none">
              <CardContent className="p-6">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-secondary/70" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-secondary/70" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-secondary/70" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {courses?.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">
            No courses yet. Add your first course to get started.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses?.map((course) => {
          const Icon = getIconComponent(course.icon);
          return (
            <Card key={course.id} className="border-none bg-background shadow-none">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${course.color}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="flex gap-1.5">
                    <RowActionButton
                      onClick={() => openEditForm(course)}
                      icon={Pencil}
                      label={`Edit ${course.name}`}
                      variant="edit"
                    />
                    <RowActionButton
                      onClick={() => handleDelete(course)}
                      disabled={deletingId === course.id}
                      icon={Trash2}
                      label={`Delete ${course.name}`}
                      variant="danger"
                    />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{course.name}</p>
                  {course.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {course.studentCount} student{course.studentCount === 1 ? "" : "s"} ·{" "}
                  {course.teacherCount} teacher{course.teacherCount === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

type TranslationForm = {
  name: string;
  summary: string;
  description: string;
  topics: string;
  outcomes: string;
  priceNote: string;
};

const EMPTY_TRANSLATION: TranslationForm = {
  name: "",
  summary: "",
  description: "",
  topics: "",
  outcomes: "",
  priceNote: "",
};

function CourseTranslationsEditor({ courseId }: { courseId: string }) {
  const [translations, setTranslations] = useState<Record<string, TranslationForm> | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>(TRANSLATABLE_LOCALES[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/courses/${courseId}/translations`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const map: Record<string, TranslationForm> = {};
        for (const t of data.translations ?? []) {
          map[t.locale] = {
            name: t.name,
            summary: t.summary,
            description: t.description ?? "",
            topics: (t.topics ?? []).join(", "),
            outcomes: (t.outcomes ?? []).join(", "),
            priceNote: t.priceNote ?? "",
          };
        }
        setTranslations(map);
      });
    return () => {
      active = false;
    };
  }, [courseId]);

  const current = translations?.[activeLocale] ?? EMPTY_TRANSLATION;
  const hasContent = Boolean(translations?.[activeLocale]);

  function updateField(field: keyof TranslationForm, value: string) {
    setSaved(false);
    setTranslations((prev) => ({
      ...(prev ?? {}),
      [activeLocale]: { ...current, [field]: value },
    }));
  }

  async function handleSaveTranslation() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/translations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: activeLocale,
          name: current.name,
          summary: current.summary,
          description: current.description,
          topics: current.topics
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          outcomes: current.outcomes
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          priceNote: current.priceNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
      } else {
        setError(data.errors?.name ?? data.errors?.summary ?? data.error ?? "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleClearTranslation() {
    const confirmed = window.confirm(
      `Remove the ${LOCALE_LABELS[activeLocale]} translation? Visitors in that language will see the default-language content instead.`
    );
    if (!confirmed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/translations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: activeLocale }),
      });
      if (res.ok) {
        setTranslations((prev) => {
          const next = { ...(prev ?? {}) };
          delete next[activeLocale];
          return next;
        });
        setSaved(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Translations</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Optional per-language name, summary, description, topics, outcomes, and pricing note.
          Languages without a translation fall back to the fields above.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TRANSLATABLE_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => {
              setActiveLocale(locale);
              setSaved(false);
              setError(null);
            }}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              activeLocale === locale
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {LOCALE_LABELS[locale]}
            {translations?.[locale] && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {translations === null ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-name">Course Name</Label>
            <Input
              id="t-name"
              value={current.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-description">Short Description</Label>
            <Input
              id="t-description"
              value={current.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-summary">Summary</Label>
            <textarea
              id="t-summary"
              rows={3}
              value={current.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              className="w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-topics">Topics (Curriculum)</Label>
            <Input
              id="t-topics"
              placeholder="Comma-separated"
              value={current.topics}
              onChange={(e) => updateField("topics", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-outcomes">Learning Outcomes</Label>
            <Input
              id="t-outcomes"
              placeholder="Comma-separated"
              value={current.outcomes}
              onChange={(e) => updateField("outcomes", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-priceNote">Pricing Note</Label>
            <Input
              id="t-priceNote"
              value={current.priceNote}
              onChange={(e) => updateField("priceNote", e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSaveTranslation}
              disabled={saving || !current.name || !current.summary}
            >
              {saving ? "Saving..." : `Save ${LOCALE_LABELS[activeLocale]}`}
            </Button>
            {hasContent && (
              <button
                type="button"
                onClick={handleClearTranslation}
                disabled={saving}
                className="text-xs font-medium text-destructive hover:underline"
              >
                Remove translation
              </button>
            )}
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
