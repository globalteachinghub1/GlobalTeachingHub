import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getIconComponent } from "@/lib/course-icons";
import { localizeCourse } from "@/lib/course-translations";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "Courses — Global Teaching Hub",
    description: "Explore the courses offered by Global Teaching Hub.",
    path: "/courses",
    locale: locale as Locale,
  });
}

// Courses are admin-managed and must always reflect live data, not a
// snapshot frozen at build time.
export const dynamic = "force-dynamic";

export default async function CoursesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CoursesPage");
  const rawCourses = await prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { translations: { where: { locale } } },
  });
  const courses = rawCourses.map(localizeCourse);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
          </div>

          {courses.length === 0 && (
            <p className="mt-12 text-center text-muted-foreground">
              {t("noCourses")}
            </p>
          )}

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            {courses.map(({ slug, icon, name, color, description }) => {
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
                      <p className="text-lg font-semibold text-foreground">
                        {name}
                      </p>
                      {description && (
                        <p className="text-sm text-muted-foreground">
                          {description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              {t("getInTouch")}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
