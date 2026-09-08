import type { Metadata } from "next";
import { headers } from "next/headers";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FaqList } from "@/components/sections/faq-list";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

// FAQPage structured data needs a CSP nonce, which only exists per-request —
// this trades this page's static generation for FAQ rich-snippet eligibility
// in search results.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "FAQs — Global Teaching Hub",
    description: "Frequently asked questions about Global Teaching Hub.",
    path: "/faq",
    locale: locale as Locale,
  });
}

type Faq = { question: string; answer: string };

export default async function FaqPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Faq");
  const faqs = t.raw("items") as Faq[];
  const nonce = (await headers()).get("x-nonce");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce ?? undefined}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h1>
            <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
          </div>

          <FaqList />
        </section>
      </main>
      <Footer />
    </>
  );
}
