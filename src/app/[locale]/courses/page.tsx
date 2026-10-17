import type { Metadata } from "next";
import { headers } from "next/headers";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { buttonVariants } from "@/components/ui/button";
import { CourseSearch } from "@/components/sections/course-search";
import { prisma } from "@/lib/prisma";
import { localizeCourse } from "@/lib/course-translations";
import { LANDING_LINKS } from "@/lib/landing-pages";
import { breadcrumbJsonLd, localizedPath, pageMetadata, SITE_URL } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "courses", "/courses");
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
  const tNav = await getTranslations("Nav");
  const tLanding = await getTranslations("Landing");
  const nonce = (await headers()).get("x-nonce");

  const coursesJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        itemListElement: courses.map((course, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: course.name,
          url: `${SITE_URL}${localizedPath(locale, `/courses/${course.slug}`)}`,
        })),
      },
      breadcrumbJsonLd(locale as Locale, [
        { name: tNav("home"), path: "/" },
        { name: tNav("courses"), path: "/courses" },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce ?? undefined}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coursesJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
          </div>

          {courses.length === 0 ? (
            <p className="mt-12 text-center text-muted-foreground">
              {t("noCourses")}
            </p>
          ) : (
            <CourseSearch courses={courses} />
          )}

          <nav aria-labelledby="more-ways-to-learn" className="mt-16 text-center">
            <h2 id="more-ways-to-learn" className="text-xl font-semibold text-foreground">
              {t("moreTitle")}
            </h2>
            <ul className="mt-4 flex flex-wrap justify-center gap-3">
              {LANDING_LINKS.map(({ key, href }) => (
                <li key={href}>
                  <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    {tLanding(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

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
