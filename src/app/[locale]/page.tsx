import type { Metadata } from "next";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { PopularCourses } from "@/components/sections/popular-courses";
import { WhyChooseUs } from "@/components/sections/why-choose-us";
import { Testimonials } from "@/components/sections/testimonials";
import { HowItWorks } from "@/components/sections/how-it-works";
import { AppDownload } from "@/components/sections/app-download";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

// Courses are admin-managed and must always reflect live data, not a
// snapshot frozen at build time.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: `${SITE_NAME} — Learn from Expert Teachers, Anytime, Anywhere`,
    description: SITE_DESCRIPTION,
    path: "/",
    locale: locale as Locale,
  });
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const nonce = (await headers()).get("x-nonce");

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-full.png`,
    description: SITE_DESCRIPTION,
    inLanguage: locale,
    address: { "@type": "PostalAddress", addressLocality: "Lahore", addressCountry: "PK" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce ?? undefined}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <Hero />
        <PopularCourses />
        <WhyChooseUs />
        <Testimonials />
        <HowItWorks />
        {/* <AppDownload /> */}
      </main>
      <Footer />
    </>
  );
}
