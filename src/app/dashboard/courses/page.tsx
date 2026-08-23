"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getIconComponent } from "@/lib/course-icons";

type Course = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  color: string;
  icon: string;
  enrolled: boolean;
};

export default function MyCoursesPage() {
  const t = useTranslations("MyCoursesPage");
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [originalEnrolled, setOriginalEnrolled] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/student/me/courses")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list: Course[] = data.courses ?? [];
        setCourses(list);
        const enrolled = new Set(list.filter((c) => c.enrolled).map((c) => c.id));
        setSelected(enrolled);
        setOriginalEnrolled(enrolled);
      });
    return () => {
      active = false;
    };
  }, []);

  function toggle(courseId: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  const removing = [...originalEnrolled].filter((id) => !selected.has(id));
  const dirty =
    selected.size !== originalEnrolled.size || [...selected].some((id) => !originalEnrolled.has(id));

  async function handleSave() {
    if (removing.length > 0) {
      const removedNames = courses
        ?.filter((c) => removing.includes(c.id))
        .map((c) => c.name)
        .join(", ");
      const confirmed = window.confirm(
        removing.length > 1
          ? t("confirmRemoveMany", { names: removedNames ?? "" })
          : t("confirmRemoveOne", { name: removedNames ?? "" })
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/student/me/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds: [...selected] }),
      });
      if (res.ok) {
        setOriginalEnrolled(new Set(selected));
        setSaved(true);
        setCourses((prev) => prev?.map((c) => ({ ...c, enrolled: selected.has(c.id) })) ?? prev);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (courses === null) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => {
          const Icon = getIconComponent(course.icon);
          const checked = selected.has(course.id);
          const willBeRemoved = originalEnrolled.has(course.id) && !checked;
          return (
            <label key={course.id} className="block cursor-pointer">
              <Card
                className={`h-full border-none shadow-sm transition ${
                  checked ? "ring-2 ring-primary" : "ring-1 ring-border/60"
                }`}
              >
                <CardContent className="flex items-start gap-3 p-5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(course.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${course.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{course.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{course.summary}</p>
                    {willBeRemoved && (
                      <p className="mt-1.5 text-xs font-medium text-destructive">
                        {t("willBeRemoved")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </label>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button size="lg" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? t("saving") : t("save")}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            {t("saved")}
          </span>
        )}
      </div>
    </div>
  );
}
