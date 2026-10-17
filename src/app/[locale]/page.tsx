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
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

// Courses are admin-managed and must always reflect live data, not a
// snapshot frozen at build time.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale as Locale, "home", "/");
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const nonce = (await headers()).get("x-nonce");

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-full.png`,
        description: SITE_DESCRIPTION,
        email: "info@globalteachinghub.com",
        telephone: "+923195459398",
        areaServed: "Worldwide",
        address: { "@type": "PostalAddress", addressLocality: "Lahore", addressCountry: "PK" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "info@globalteachinghub.com",
          telephone: "+923195459398",
          availableLanguage: ["English", "Urdu", "Arabic"],
        },
        knowsAbout: ["Quran recitation", "Tajweed", "Quran translation", "Arabic language", "Islamic Studies"],
      },
      {
        // Lets Google show "Global Teaching Hub" as the site name in results.
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
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
