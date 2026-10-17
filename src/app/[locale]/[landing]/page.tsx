import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LANDING_PAGES, TEACHER_HIGHLIGHTS, getLandingPage } from "@/lib/landing-pages";
import { breadcrumbJsonLd, buildMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { routing } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string; landing: string }> };

// Only the slugs in LANDING_PAGES exist; anything else under /<slug> is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    LANDING_PAGES.map((page) => ({ locale, landing: page.slug }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { landing } = await params;
  const page = getLandingPage(landing);
  if (!page) return {};

  // English-only content: every locale's copy canonicalizes to the English
  // URL and advertises no hreflang alternates (same as blog posts).
  const metadata = buildMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${page.slug}`,
    locale: "en",
  });
  return {
    ...metadata,
    alternates: { canonical: `${SITE_URL}/${page.slug}` },
    openGraph: { ...metadata.openGraph, alternateLocale: undefined },
  };
}

export default async function LandingPageRoute({ params }: PageProps) {
  const { locale, landing } = await params;
  setRequestLocale(locale);
  const page = getLandingPage(landing);
  if (!page) notFound();

  const [tNav, tBlog, nonce] = await Promise.all([
    getTranslations("Nav"),
    getTranslations("Blog"),
    headers().then((h) => h.get("x-nonce")),
  ]);
  const url = `${SITE_URL}/${page.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.h1,
        description: page.metaDescription,
        url,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      ...(page.course
        ? [
            {
              "@type": "Course",
              name: page.course.name,
              description: page.course.description,
              url,
              inLanguage: "en",
              teaches: page.course.teaches,
              provider: {
                "@type": "EducationalOrganization",
                "@id": `${SITE_URL}/#organization`,
                name: SITE_NAME,
                url: SITE_URL,
              },
              hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online" },
            },
          ]
        : []),
      breadcrumbJsonLd("en", [
        { name: "Home", path: "/" },
        { name: page.name, path: `/${page.slug}` },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce ?? undefined}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <section className="bg-linear-to-b from-secondary/60 to-background">
          <div className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8 lg:pt-20">
            {locale !== "en" && (
              <p className="mb-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                {tBlog("englishOnly")}
              </p>
            )}
            <div lang="en" dir="ltr">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {page.h1}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">{page.intro}</p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/free-trial" className={buttonVariants({ size: "lg" })}>
                {tBlog("ctaButton")}
              </Link>
              <Link href="/courses" className={buttonVariants({ size: "lg", variant: "outline" })}>
                {tBlog("ctaCourses")}
              </Link>
            </div>
          </div>
        </section>

        <article lang="en" dir="ltr" className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          {page.sections.map((section) => (
            <section key={section.heading} className="mt-12">
              <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-relaxed text-foreground/90">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 flex flex-col gap-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-foreground/90">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="mt-12 rounded-2xl bg-secondary/40 p-6">
            <h2 className="text-xl font-semibold text-foreground">Our teachers</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {TEACHER_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/90">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {page.faqs.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-foreground">Frequently asked questions</h2>
              <Accordion className="mt-4">
                {page.faqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {page.related.length > 0 && (
            <nav aria-label="Related pages" className="mt-12">
              <h2 className="text-xl font-semibold text-foreground">Keep exploring</h2>
              <ul className="mt-4 flex flex-wrap gap-3">
                {page.related.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="mt-16 rounded-2xl border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">{tBlog("ctaTitle")}</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/free-trial" className={buttonVariants({ size: "lg" })}>
                {tBlog("ctaButton")}
              </Link>
              <Link href="/contact" className={buttonVariants({ size: "lg", variant: "outline" })}>
                {tNav("contact")}
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
