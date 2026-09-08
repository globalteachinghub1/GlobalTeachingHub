"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getIconComponent } from "@/lib/course-icons";

type Course = {
  slug: string;
  icon: string;
  name: string;
  color: string;
  description: string | null;
  topics: string[];
};

export function CourseSearch({ courses }: { courses: Course[] }) {
  const t = useTranslations("CoursesPage");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.topics.some((topic) => topic.toLowerCase().includes(q))
    );
  }, [courses, query]);

  return (
    <>
      <div className="relative mx-auto mt-10 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 pl-10"
        />
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">{t("noResults")}</p>
      )}

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        {filtered.map(({ slug, icon, name, color, description }) => {
          const Icon = getIconComponent(icon);
          return (
            <Link key={slug} href={`/courses/${slug}`} className="block">
              <Card className="h-full border-none bg-secondary/40 shadow-none transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <p className="text-lg font-semibold text-foreground">{name}</p>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
