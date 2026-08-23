import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getIconComponent } from "@/lib/course-icons";
import { localizeCourse } from "@/lib/course-translations";

export async function PopularCourses() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("PopularCourses")]);
  const rawCourses = await prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { translations: { where: { locale } } },
  });
  const courses = rawCourses.map(localizeCourse);

  if (courses.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h2>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-8">
        {courses.map(({ slug, icon, name, color, description }) => {
          const Icon = getIconComponent(icon);
          return (
            <Link key={slug} href={`/courses/${slug}`} className="block">
              <Card className="w-40 border-none bg-secondary/40 shadow-none transition hover:-translate-y-1 hover:shadow-md sm:w-60">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  {description && (
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
