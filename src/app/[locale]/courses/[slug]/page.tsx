import type { Metadata } from "next";
import { createElement } from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { headers } from "next/headers";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link, permanentRedirect } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { prisma } from "@/lib/prisma";
import { getIconComponent } from "@/lib/course-icons";
import { localizeCourse } from "@/lib/course-translations";
import { breadcrumbJsonLd, buildMetadata, SITE_NAME, SITE_URL, localizedPath } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type Faq = { question: string; answer: string };

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

// Courses are admin-managed and must always reflect live data, not a
// snapshot frozen at build time.
export const dynamic = "force-dynamic";

// Slugs that were renamed after being indexed, mapped to their current slug.
// Requests for the old URL are permanently redirected so search engines carry
// the page's ranking over instead of seeing a 404. Only consulted when no
// course has the old slug any more.
const RENAMED_COURSE_SLUGS: Record<string, string> = {
  "computer-courses": "arabic-language",
};

async function findCourse(slug: string, locale: string) {
  const include = { translations: { where: { locale } } };
  const course = await prisma.course.findUnique({ where: { slug }, include });
  if (course) return course;
  // Until the rename has been applied to the database, the new slug doesn't
  // exist yet; serve the course from its old one so links to the new URL
  // never 404. Its canonical still names the old URL in that case.
  const oldSlug = Object.keys(RENAMED_COURSE_SLUGS).find(
    (key) => RENAMED_COURSE_SLUGS[key] === slug
  );
  return oldSlug ? prisma.course.findUnique({ where: { slug: oldSlug }, include }) : null;
}

/** Search snippets read better as full sentences; summaries are often fragments. */
function asSentence(text: string) {
  const trimmed = text.trim();
  return /[.!?۔؟]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const rawCourse = await findCourse(slug, locale);

  if (!rawCourse) return {};
  const course = localizeCourse(rawCourse);
  const t = await getTranslations({ locale, namespace: "Seo" });

  return buildMetadata({
    title: t("courseTitle", { name: course.name }),
    description: t("courseDescription", { summary: asSentence(course.summary) }),
    path: `/courses/${course.slug}`,
    locale: locale as Locale,
  });
}

export default async function CourseDetailsPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CourseDetailPage");
  const rawCourse = await findCourse(slug, locale);

  if (!rawCourse) {
    const renamedTo = RENAMED_COURSE_SLUGS[slug];
    if (renamedTo) permanentRedirect({ href: `/courses/${renamedTo}`, locale });
    notFound();
  }
  const course = localizeCourse(rawCourse);
  const tNav = await getTranslations("Nav");
  const tFaq = await getTranslations("Faq");
  const faqs = (tFaq.raw("items") as Faq[]).slice(0, 3);

  const nonce = (await headers()).get("x-nonce");
  const coursePath = `/courses/${course.slug}`;
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.name,
        description: course.summary,
        url: `${SITE_URL}${localizedPath(locale, coursePath)}`,
        inLanguage: locale,
        ...(course.topics.length > 0 && { teaches: course.topics }),
        provider: {
          "@type": "EducationalOrganization",
          "@id": `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: SITE_URL,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "Online",
        },
      },
      breadcrumbJsonLd(locale as Locale, [
        { name: tNav("home"), path: "/" },
        { name: tNav("courses"), path: "/courses" },
        { name: course.name, path: coursePath },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce ?? undefined}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <span
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${course.color}`}
            >
              {createElement(getIconComponent(course.icon), { className: "h-8 w-8" })}
            </span>
            <h1 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl">
              {course.name}
            </h1>
            <p className="mt-3 text-sm font-medium text-primary">{t("tagline")}</p>
            <p className="mt-4 text-muted-foreground">{course.summary}</p>
          </div>

          {course.topics.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-foreground">
                {t("curriculumTitle")}
              </h2>
              <Accordion className="mt-4">
                <AccordionItem value="curriculum">
                  <AccordionTrigger className="text-base">
                    {t("whatYoullLearn")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex flex-col gap-3">
                      {course.topics.map((topic) => (
                        <li
                          key={topic}
                          className="flex items-center gap-3 rounded-lg bg-secondary/40 px-4 py-3"
                        >
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {topic}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {course.outcomes.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-foreground">
                {t("outcomesTitle")}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-12">
            <h2 className="text-lg font-semibold text-foreground">{t("teachersTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("teachersBody")}</p>
          </div>

          <div className="mt-12 rounded-2xl bg-secondary/40 p-6">
            <h2 className="text-lg font-semibold text-foreground">{t("pricingTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {course.priceNote || t("pricingDefault")}
            </p>
          </div>

          {faqs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-foreground">{t("faqTitle")}</h2>
              <Accordion className="mt-4">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="mt-4 text-center">
                <Link
                  href="/faq"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("viewAllFaqs")}
                </Link>
              </div>
            </div>
          )}

          <div className="mt-12 flex flex-col items-center gap-3">
            <Link href="/free-trial" className={buttonVariants({ size: "lg" })}>
              {t("bookDemo")}
            </Link>
            <Link
              href="/courses"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("backToAllCourses")}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
